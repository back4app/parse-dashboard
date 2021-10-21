import React            from 'react';
import $                from 'jquery'
import jstree           from 'jstree';
import Swal             from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Base64 }       from 'js-base64'
import * as base64 from 'base64-async';

import emptyFolderIcon from './icons/folder-empty.png';
import folderIcon from './icons/folder.png';
import file from './icons/file.png';
import fileCheck from './icons/file-check.png';
import undeployedFolder from './icons/folder-notdeployed.png';

// Alert parameters
const MySwal = withReactContent(Swal)
const overwriteFileModal = {
  title: 'Are you sure?',
  text: "",
  type: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#169cee',
  cancelButtonColor: '#ff395e',
  confirmButtonText: 'Yes, overwrite it!'
}

const confirmRemoveFileModal = {
  title: 'Are you sure?',
  text: '',
  type: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#169cee',
  cancelButtonColor: '#ff395e',
  confirmButtonText: 'Yes, remove it!',
  reverseButtons: true,
};

// Function used to force an update on jstree element. Useful to re-render tree
// after deploy changes
export const updateTreeContent = async (files) => {
  $('#tree').jstree(true).settings.core.data = files;
  await $('#tree').jstree(true).refresh();
}

// Create a new-node on tree
const create = (data, file) => {
  let inst = $.jstree.reference(data),
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
const remove = (data, showAlert=false) => {
  let inst = $.jstree.reference(data)
  let obj = inst.get_node(data);
  if (showAlert) {
    confirmRemoveFileModal.text = `Are you sure you want to remove ${obj.text} file?`;
    MySwal.fire(confirmRemoveFileModal).then((alertResponse) => {
      if (alertResponse.value) {
        if (inst.is_selected(obj)) return inst.delete_node(inst.get_selected());
        else return inst.delete_node(obj);
      }
    })
  } else {
    if (inst.is_selected(obj)) return inst.delete_node(inst.get_selected());
    else return inst.delete_node(obj);
  }
}

// Decode base64 file content.
const decodeFile = async (code) => {
  let encodedCode = code.split(',')[1];
  return base64.decode(encodedCode);
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
  if ( currentCode ) {
    for (let i = 0; i < currentCode.length; i++) {
      if (newNode.text && currentCode[i].text === newNode.text.name) {
        overwriteFileModal.text = currentCode[i].text + ' file already exists. Do you want to overwrite?'
        let currentId = currentCode[i].id
        // Show alert and wait for the user response
        let alertResponse = await MySwal.fire(overwriteFileModal)
        if (alertResponse.value) {
          await remove(`#${currentId}`)
        } else {
          overwrite = false;
        }
      }
    }
  }
  return overwrite;
}

const getExtension = (fileName) => {
  let re = /(?:\.([^.]+))?$/
  return re.exec(fileName)[1]
}

// Function used to add files on tree.
const addFilesOnTree = async (files, currentCode, selectedFolder) => {
  let newTreeNodes = [], overwrite = true;
  let folder
  for (let i = 0; i < files.fileList.length; i++) {
    newTreeNodes = readFile({ name: files.fileList[i], code: files.base64[i] }, newTreeNodes);
  }

  for (let j = 0; j < newTreeNodes.length; j++ ) {
    if (currentCode === '#') {
      let inst = $.jstree.reference(currentCode)
      let obj = inst.get_node(currentCode);
      // Select the folder to insert based on file extension. If is a js file,
      // insert on "cloud" folder, else insert on "public" folder. This logic is
      // a legacy from the old Cloud Code page
      if (typeof selectedFolder === 'number') {
        folder = obj.children[selectedFolder]
      } else
        folder = obj.children?.find(f => f === selectedFolder);
    }
    overwrite = await verifyFileNames(folder, newTreeNodes[j]);
    if ( overwrite === false ) continue;
    addFileOnSelectedNode(newTreeNodes[j].text.name, newTreeNodes[j].data );
  }
  return overwrite;
}

const addFileOnSelectedNode = ( name, data = {code: 'data:plain/text;base64,IA=='} ) => {
  let parent = $('#tree').jstree('get_selected');
  if ( ['default', 'file', 'new-file'].includes($('#tree').jstree().get_node(parent).type) ) {
    parent = $('#tree').jstree().get_node(parent).parent;
  }
  $('#tree').jstree("create_node", parent, { data, type: 'new-file', text: name }, 'inside', false, false);
}


// Configure the menu that is shown on right-click based on files type
const customMenu = node => {
  let items = $.jstree.defaults.contextmenu.items();
  if (node.type === 'folder' || node.type === 'new-folder') {
    items.create.label = 'Create Folder';
  }
  items.create.action = function (data) {
    create(data.reference)
  };
  items.remove.action = function (data) {
    remove(data.reference, true)
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
  if (files && files[0] && files[0].state) files[0].state.selected = true
  return {
    plugins: ['contextmenu', 'dnd', 'sort', 'types', 'unique', 'changed'],
    core: {
      "check_callback": true,
      'data': files
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
      "new-folder": {
        icon: undeployedFolder,
        max_depth: 10,
        max_children: 200
      },
      "new-file": {
        icon: file,
        max_children: 0
      }
    }
  }
}

// Get the current files on jstree element
export const getFiles = (reference = '#') => {
  return $("#tree").jstree(true).get_json(reference)
}

// empty folder icons.
export const refreshEmptyFolderIcons = () => {
  const leaves = $('.jstree-leaf');

  for( let i = 0; i < leaves.length; i++ ){
    // folder or undeployed folder.
    if (
      leaves[i].querySelector('.jstree-themeicon').style['background-image'] === "url(\""+require('./icons/folder.png').default+"\")"
    ) {
      leaves[i].querySelector('.jstree-themeicon').style = "background-image: url(\""+require('./icons/folder-empty.png').default+"\"); background-position: center center; background-size: auto;";
    }
    else if ( leaves[i].querySelector('.jstree-themeicon').style['background-image'] === "url(\""+require('./icons/folder-notdeployed.png').default+"\")" ) {
      leaves[i].querySelector('.jstree-themeicon').style = "background-image: url(\""+require('./icons/folder-empty-undeployed.png').default+"\"); background-position: center center; background-size: auto;";
    }
  }
}

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
  addFileOnSelectedNode
}
