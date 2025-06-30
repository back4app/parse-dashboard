import $ from 'jquery'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Base64 } from 'js-base64'

// import emptyFolderIcon from './icons/folder-empty.png';
import folderIcon from './icons/folder.png';
import file from './icons/file.png';
import fileCheck from './icons/file-check.png';
import undeployedFolder from './icons/folder-notdeployed.png';
import styles from 'components/B4ACodeTree/B4ACodeTree.scss';
import buttonStyles from 'components/Button/Button.scss';
import baseStyles from 'stylesheets/base.scss';
import modalStyles from 'components/B4aModal/B4aModal.scss';

// Alert parameters
const MySwal = withReactContent(Swal.mixin({
  customClass: {
    header: '',
    title: `${modalStyles.title} ${styles.sweetalertTitle}`,
    htmlContainer: `${styles.sweetalertContainer}`,
    closeButton: styles.sweetalertCloseBtn,
    icon: styles.sweetalertIcon,
    input: styles.sweetalertInput,
    actions: `${styles.sweetalertActions}`,
    confirmButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.primary, buttonStyles.green].join(' '),
    cancelButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.white].join(' '),
  },
  buttonsStyling: false,
}));


const overwriteFileModal = {
  title: 'Are you sure?',
  text: '',
  showCancelButton: true,
  confirmButtonText: 'Yes, overwrite it!',
  showCloseButton: true,
  allowOutsideClick: false,
}

const confirmRemoveFileModal = {
  title: 'Are you sure?',
  text: '',
  showCancelButton: true,
  confirmButtonText: 'Yes, remove it!',
  reverseButtons: true,
  showCloseButton: true,
  allowOutsideClick: false,
};

const preventRemoveFileModal = {
  title: 'Can not remove file',
  text: '',
  confirmButtonText: 'Ok',
  reverseButtons: true,
  showCloseButton: true,
  allowOutsideClick: false,
};

// Function used to force an update on jstree element. Useful to re-render tree
// after deploy changes
export const updateTreeContent = async (files) => {
  $('#tree').jstree(true).settings.core.data = files;
  await $('#tree').jstree(true).refresh();
}

// Create a new-node on tree
const create = (data, file) => {
  const inst = $.jstree.reference(data),
    obj = inst.get_node(data);
  if (!file) {
    return inst.create_node(obj, {
      type: 'new-folder',
      text: 'New Folder',
      state: { opened: true }
    });
  } else {
    return inst.create_node(obj, {
      type: 'new-file',
      text: file.text.name,
      data: file.data
    });
  }
}

// Remove a node on tree
const remove = (data, showAlert = false) => {
  const inst = $.jstree.reference(data)
  const obj = inst.get_node(data);
  if (showAlert) {
    const RemoveSwal = withReactContent(Swal.mixin({
      customClass: {
        header: '',
        title: `${modalStyles.title} ${styles.sweetalertTitle}`,
        htmlContainer: `${styles.sweetalertContainer}`,
        closeButton: styles.sweetalertCloseBtn,
        icon: styles.sweetalertIcon,
        input: styles.sweetalertInput,
        actions: `${styles.sweetalertActions}`,
        confirmButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.primary, buttonStyles.red].join(' '),
        cancelButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.white].join(' '),
      },
      buttonsStyling: false,
    }));
    confirmRemoveFileModal.text = `Are you sure you want to remove ${obj.text} file?`;
    RemoveSwal.fire(confirmRemoveFileModal).then((alertResponse) => {
      if (alertResponse.value) {
        if (inst.is_selected(obj)) {return inst.delete_node(inst.get_selected());}
        else {return inst.delete_node(obj);}
      }
    })
  } else {
    if (inst.is_selected(obj)) {return inst.delete_node(inst.get_selected());}
    else {return inst.delete_node(obj);}
  }
}

// Decode base64 file content.
const decodeFile = (code) => {
  return Base64.decode(code.split(',')[1]);
}

const encodeFile = async (code, extension) => {
  return extension + ',' + Base64.encode(code);
}

const readFile = (file, newTreeNodes) => {
  newTreeNodes.push({
    text: file.name,
    data: {
      code: file.code
    }
  })
  return newTreeNodes
}

// Iterate over current files on the tree to verify if exist a file with the
// same name at the new files to insert and ask the user if he wants to overwrite it
const verifyFileNames = async (data, newNode) => {
  let currentCode = getFiles(data)
  currentCode = currentCode && currentCode.children
  let overwrite = true;
  if (currentCode) {
    for (let i = 0; i < currentCode.length; i++) {
      if (newNode.text && currentCode[i].text === newNode.text.name) {
        overwriteFileModal.text = currentCode[i].text + ' file already exists. Do you want to overwrite?'
        const currentId = currentCode[i].id
        // Show alert and wait for the user response
        const alertResponse = await MySwal.fire(overwriteFileModal)
        if (alertResponse.value) {
          remove(`#${currentId}`)
        } else {
          overwrite = false;
        }
      }
    }
  }
  return overwrite;
}

export const getExtension = (fileName) => {
  const re = /(?:\.([^.]+))?$/
  return re.exec(fileName)[1] || '';
}

// Function used to add files on tree.
const addFilesOnTree = async (files, currentCode, selectedFolder) => {
  let newTreeNodes = [], overwrite = true;
  let folder
  for (let i = 0; i < files.fileList.length; i++) {
    newTreeNodes = readFile({ name: files.fileList[i], code: files.base64[i] }, newTreeNodes);
  }
  let newNodeId = '';
  for (let j = 0; j < newTreeNodes.length; j++) {
    if (currentCode === '#') {
      const inst = $.jstree.reference(currentCode)
      const obj = inst.get_node(currentCode);
      // Select the folder to insert based on file extension. If is a js file,
      // insert on "cloud" folder, else insert on "public" folder. This logic is
      // a legacy from the old Cloud Code page
      if (typeof selectedFolder === 'number') {
        folder = obj.children[selectedFolder]
      } else
      {folder = obj.children?.find(f => f === selectedFolder);}
    }
    const selectedParent = getSelectedParent();
    overwrite = await verifyFileNames(folder, newTreeNodes[j]);
    if (overwrite === false) {continue;}
    newNodeId = addFileOnSelectedNode(newTreeNodes[j].text.name, selectedParent, newTreeNodes[j].data);
  }
  return { overwrite, newNodeId };
}

const getSelectedParent = () => {
  let parent = $('#tree').jstree('get_selected');
  if (['default', 'file', 'new-file'].includes($('#tree').jstree().get_node(parent).type)) {
    parent = [$('#tree').jstree().get_node(parent).parent];
  }
  return parent;
}

const addFileOnSelectedNode = (name, parent, data = {code: 'data:plain/text;base64,IA=='}) => {
  const newNodeId = $('#tree').jstree('create_node', parent, { data, type: 'new-file', text: name }, 'inside', false, false);
  return newNodeId;
}


// Configure the menu that is shown on right-click based on files type
const customMenu = node => {
  const items = $.jstree.defaults.contextmenu.items();
  if (node.type === 'folder' || node.type === 'new-folder') {
    items.create.label = 'Create Folder';
  }
  items.create.action = function (data) {
    create(data.reference)
  };
  items.remove.action = function (data) {
    const obj = $('#tree').jstree().get_node(data.reference);
    if (obj?.text === 'main.js' || obj?.text === 'index.html') {
      preventRemoveFileModal.text = `Can not remove ${obj.text} file as it is required by cloud code.`;
      MySwal.fire(preventRemoveFileModal);
    } else {
      remove(data.reference, true)
    }
  };
  delete items.ccp;
  if (node.type === 'default' || node.type === 'new-file') {
    delete items.create;
    delete items.rename;
  }
  if (node.text === 'cloud' && node.parent === '#') {
    delete items.remove;
    delete items.rename;
    delete items.ccp;
  }
  if (node.text === 'public' && node.parent === '#') {
    delete items.remove;
    delete items.rename;
    delete items.ccp;
  }
  return items;
}

// Return the jstree config
const getConfig = (files) => {
  if (files && files[0] && files[0].state) {files[0].state.selected = true}
  return {
    plugins: ['contextmenu', 'dnd', 'sort', 'types', 'unique', 'changed'],
    core: {
      'check_callback': true,
      'data': files,
      'theme': {
        'name': 'default-dark',
      }
    },
    contextmenu: {items: customMenu},
    types: {
      '#': {
        max_children: 2,
        icon: fileCheck,
      },
      default: {
        icon: fileCheck,
        max_children: 0
      },
      folder: {
        icon: folderIcon,
        max_depth: 10,
        max_children: 200,
      },
      'new-folder': {
        icon: undeployedFolder,
        max_depth: 10,
        max_children: 200
      },
      'new-file': {
        icon: file,
        max_children: 0
      }
    }
  }
}

// Get the current files on jstree element
export const getFiles = (reference = '#') => {
  return $('#tree').jstree(true).get_json(reference)
}

// empty folder icons.
export const refreshEmptyFolderIcons = () => {
  const leaves = $('.jstree-leaf');

  for(let i = 0; i < leaves.length; i++){
    // folder or undeployed folder.
    if (
      leaves[i].querySelector('.jstree-themeicon').style['background-image'] === 'url("' + require('./icons/folder.png') + '")'
    ) {
      leaves[i].querySelector('.jstree-themeicon').style = 'background-image: url("' + require('./icons/folder-empty.png') + '"); background-position: center center; background-size: auto;';
    }
    else if (leaves[i].querySelector('.jstree-themeicon').style['background-image'] === 'url("' + require('./icons/folder-notdeployed.png') + '")') {
      leaves[i].querySelector('.jstree-themeicon').style = 'background-image: url("' + require('./icons/folder-empty-undeployed.png') + '"); background-position: center center; background-size: auto;';
    }
  }
}

const selectFileOnTree = (nodeId) => {
  $('#tree').jstree().deselect_all(true); // first deselect all selected files
  $('#tree').jstree().select_node(nodeId); // select specified node
}

const sanitizeHTML = (str) => {
  return str.replace(/[^\w. ]/gi, function (c) {
    return '&#' + c.charCodeAt(0) + ';';
  });
};

export default {
  getConfig,
  remove,
  addFilesOnTree,
  readFile,
  getFiles,
  decodeFile,
  encodeFile,
  updateTreeContent,
  getExtension,
  refreshEmptyFolderIcons,
  addFileOnSelectedNode,
  getSelectedParent,
  selectFileOnTree,
  sanitizeHTML
};
