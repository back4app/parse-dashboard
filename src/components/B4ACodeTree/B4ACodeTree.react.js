import React from 'react';
import jstree from 'jstree';
// 🚫🚫 DO NOT REMOVE ABOVE LINE, as the scripts needs to be loaded that allows to use $('#tree').jstree for proper tree rendering, it took me a whole day to debug 🤯🤯🤯.
import $ from 'jquery';
import styles from 'components/B4ACodeTree/B4ACodeTree.scss'
import B4aFileTree from 'components/B4aFileTree/B4aFileTree.react';
import B4ACloudCodeView from 'components/B4ACloudCodeView/B4ACloudCodeView.react';
import B4ATreeActions from 'components/B4ACodeTree/B4ATreeActions';
import Swal from 'sweetalert2';
import folderInfoIcon from './icons/folder-info.png';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import B4aCloudEmpty from 'components/B4aCloudEmpty/B4aCloudEmpty.react';
import B4aCloudPublicEmpty from 'components/B4aCloudEmpty/B4aCloudPublicEmpty.react';
// import CloudCodeChanges from 'lib/CloudCodeChanges';
import PropTypes from 'lib/PropTypes';
import Icon from 'components/Icon/Icon.react';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';

import buttonStyles from 'components/Button/Button.scss';
import baseStyles from 'stylesheets/base.scss';
import modalStyles from 'components/B4aModal/B4aModal.scss';
import CloudCodeSampleModal from './CloudCodeSampleModal.react'

import 'jstree/dist/themes/default/style.css'
import 'components/B4ACodeTree/B4AJsTree.css'

const getCloudFolderPlaceholder = () =>
  'The Cloud Folder can be used to deploy cloud functions, triggers, and custom Express.js routes.';

const publicFolderPlaceholder = 'Public folder can be used to deploy public static content as html, images, css, etc.\n'

let cloudFolderPlaceholder;

const swalWithBootstrapButtons = Swal.mixin({
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
});

class UploadMenu extends React.Component {
  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside, true);
    document.addEventListener('keydown', this.handleEscape, true);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside, true);
    document.removeEventListener('keydown', this.handleEscape, true);
  }

  handleClickOutside = e => {
    if (this.props.menuRef?.current && !this.props.menuRef.current.contains(e.target)) {
      this.props.onClose();
    }
  };

  handleEscape = e => {
    if (e.key === 'Escape') {
      this.props.onClose();
    }
  };

  render() {
    return (
      <div ref={this.props.menuRef} className={styles.uploadDropdown}>
        <button
          type="button"
          className={styles.uploadDropdownItem}
          onClick={this.props.onUploadFiles}
        >
          <Icon name="B4a-upload-file-icon" fill="currentColor" width={14} height={14} />
          Upload Files
        </button>
        <button
          type="button"
          className={styles.uploadDropdownItem}
          onClick={this.props.onUploadFolder}
        >
          <Icon name="B4a-upload-file-icon" fill="currentColor" width={14} height={14} />
          Upload Folder
        </button>
      </div>
    );
  }
}

export default class B4ACodeTree extends React.Component {
  constructor(props){
    super(props);

    // set a cloudCodePlaceholder with the app's data
    cloudFolderPlaceholder = getCloudFolderPlaceholder()

    this.state = {
      selectedFile: '',
      extension: '',
      source: '',
      nodeId: '',
      files: this.props.files,
      isImage: false,
      selectedFolder: 0,
      currentFolder: null,
      isFolderSelected: true,
      selectedNodeData: null,
      loadingFileId: null,
      errorFileData: null,
      // Mirror of jstree's current tree, used to render the VSCode-style
      // <B4aFileTree>. Kept in sync via syncTreeData() on every jstree mutation.
      treeData: this.props.files || [],
      // Path of the currently-selected file in <B4aFileTree>. Kept in sync via
      // jstree's `changed.jstree` event in selectNode().
      selectedTreePath: '',
      showUploadMenu: false,
    }

    // Used to track the latest file load request
    this.loadRequestId = 0;

    this.fileInputRef = React.createRef();
    this.folderInputRef = React.createRef();
    this.uploadMenuRef = React.createRef();
  }

  // Read the current tree state from jstree and mirror it into React state so
  // <B4aFileTree> re-renders. Called after every jstree mutation event.
  syncTreeData() {
    const inst = $('#tree').jstree(true);
    if (!inst) {
      return;
    }
    const data = inst.get_json('#', { no_state: false, no_data: false });
    this.setState({ treeData: Array.isArray(data) ? data : [] });
  }

  // Build the VSCode-style "path" (e.g. "cloud/main.js") for a jstree node by
  // walking up the parent chain. We need this to highlight the selected node
  // in <B4aFileTree> (which keys nodes by path, not by jstree's internal IDs).
  getNodePath(nodeId) {
    const inst = $('#tree').jstree(true);
    if (!inst || !nodeId) {
      return '';
    }
    const parts = [];
    let current = inst.get_node(nodeId);
    while (current && current.id !== '#') {
      parts.unshift(current.text);
      current = inst.get_node(current.parent);
    }
    return parts.join('/');
  }

  // Walk a B4aFileTree path back to a jstree node id so we can forward the
  // click into jstree (which still owns selection state and edit operations).
  findNodeIdByPath(path) {
    if (!path) {
      return null;
    }
    const inst = $('#tree').jstree(true);
    if (!inst) {
      return null;
    }
    const segments = path.split('/');
    const roots = inst.get_json('#', { flat: false });
    const findIn = (nodes, depth) => {
      if (!Array.isArray(nodes) || depth >= segments.length) {
        return null;
      }
      const target = nodes.find(n => n.text === segments[depth]);
      if (!target) {
        return null;
      }
      if (depth === segments.length - 1) {
        return target.id;
      }
      return findIn(target.children, depth + 1);
    };
    return findIn(roots, 0);
  }

  handleFileTreeSelect(node, path) {
    if (!node) {
      return;
    }
    const nodeId = node.id || this.findNodeIdByPath(path);
    if (!nodeId) {
      return;
    }
    B4ATreeActions.selectFileOnTree(nodeId);
  }

  handleContextAction(action, node, path, newName) {
    if (this.props.hideControls) {
      return;
    }
    const isFolder = node && (node.type === 'folder' || node.type === 'new-folder');
    const nodeId = node && (node.id || this.findNodeIdByPath(path));
    const isProtectedRoot =
      path && path.indexOf('/') === -1 && (node.text === 'cloud' || node.text === 'public');
    const parentNodeId = isFolder
      ? (node.id || this.findNodeIdByPath(path))
      : this.findNodeIdByPath(path.split('/').slice(0, -1).join('/'));

    if ((action === 'delete' || action === 'rename') && isProtectedRoot) {
      return;
    }

    if (action === 'delete') {
      if (!nodeId) {
        return;
      }
      B4ATreeActions.selectFileOnTree(nodeId);
      B4ATreeActions.remove(`#${nodeId}`, true);
      return;
    }

    if (action === 'rename') {
      if (!nodeId) {
        return;
      }
      B4ATreeActions.selectFileOnTree(nodeId);
      const value = B4ATreeActions.sanitizeHTML((newName || '').trim());
      if (!value || value === node.text) {
        return;
      }
      const inst = $('#tree').jstree(true);
      inst.rename_node(nodeId, value);
      this.setState({ files: inst.get_json() });
      return;
    }

    if (parentNodeId) {
      B4ATreeActions.selectFileOnTree(parentNodeId);
    }

    if (action === 'create-file') {
      swalWithBootstrapButtons.fire({
        title: 'Create a new empty file',
        text: 'Name your file',
        padding: '1rem 2rem',
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off',
          placeholder: 'File name',
        },
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Create file',
        buttonsStyling: false,
        showCloseButton: true,
        allowOutsideClick: () => !Swal.isLoading()
      }).then(({ value }) => {
        if (value) {
          value = B4ATreeActions.sanitizeHTML(value);
          const parent = parentNodeId ? [parentNodeId] : B4ATreeActions.getSelectedParent();
          const newNodeId = B4ATreeActions.addFileOnSelectedNode(value, parent[0]);
          B4ATreeActions.selectFileOnTree(newNodeId);
          this.setState({ files: $('#tree').jstree(true).get_json() });
        }
      });
    } else if (action === 'create-folder') {
      swalWithBootstrapButtons.fire({
        title: 'Create a new folder',
        text: 'Name your folder',
        padding: '1rem 2rem',
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off',
          placeholder: 'Folder name',
        },
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Create folder',
        buttonsStyling: false,
        showCloseButton: true,
        allowOutsideClick: () => !Swal.isLoading()
      }).then(({ value }) => {
        if (value) {
          value = B4ATreeActions.sanitizeHTML(value);
          const targetId = parentNodeId || B4ATreeActions.getSelectedParent()[0];
          const inst = $('#tree').jstree(true);
          inst.create_node(targetId, {
            type: 'new-folder',
            text: value,
            state: { opened: true },
          });
          this.setState({ files: inst.get_json() });
        }
      });
    }
  }

  handleFileTreeDrop(sourcePath, targetPath) {
    if (this.props.hideControls || !sourcePath || !targetPath) {
      return;
    }
    const inst = $('#tree').jstree(true);
    if (!inst) {
      return;
    }
    const sourceId = this.findNodeIdByPath(sourcePath);
    const targetId = this.findNodeIdByPath(targetPath);
    if (!sourceId || !targetId) {
      return;
    }
    const sourceNode = inst.get_node(sourceId);
    const targetNode = inst.get_node(targetId);
    if (!sourceNode || !targetNode || (targetNode.type !== 'folder' && targetNode.type !== 'new-folder')) {
      return;
    }
    if (sourceNode.parent === targetNode.id) {
      return;
    }
    const moved = inst.move_node(sourceNode, targetNode, 'last');
    if (moved === false) {
      return;
    }
    B4ATreeActions.selectFileOnTree(sourceNode.id);
    this.syncTreeData();
    this.handleTreeChanges();
  }

  selectSpecificFile(fileName) {
    const tree = $('#tree').jstree(true);
    if (!tree) return;
  
    const node = tree.get_json('#', { flat: true }).find(n => n.text === fileName);
  
    if (node) {
      B4ATreeActions.selectFileOnTree(node.id);
    } else {
      console.warn('Arquivo não encontrado na árvore.');
    }
  }

  getFileType(file) {
    try {
      return file.split(',')[0].indexOf('image') >= 0
    } catch (err) {
      console.error(err)
    }
    return false
  }

  handleFiles(files) {
    // handle empty files
    const fileObj = files.fileList['0'];
    if (fileObj && fileObj.size === 0) {
      const fileType = fileObj.type || 'plain/text';
      files.base64[0] = `data:${fileType};base64,`;
    }
    this.setState({ newFile: files })
    this.loadFile()
  }

  // load file and add on tree
  async loadFile() {
    const file = this.state.newFile;
    if (file) {
      const currentTree = '#';
      const { overwrite, newNodeId } = await B4ATreeActions.addFilesOnTree(file, currentTree, this.state.selectedFolder);
      if (overwrite === true) {
        this.setState({ newFile: '', filesOnTree: file });
        this.handleTreeChanges()
      }
      if (newNodeId && file.fileList.length === 1) { // select only single new file upload
        B4ATreeActions.selectFileOnTree(newNodeId);
      }
    }
  }

  handleNativeFileUpload(e) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }
    const readPromises = Array.from(fileList).map(file =>
      new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, base64: reader.result });
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readPromises).then(results => {
      const files = {
        fileList: results.map(r => ({ name: r.name, size: 1 })),
        base64: results.map(r => r.base64),
      };
      this.handleFiles(files);
    });
    e.target.value = '';
  }

  handleFolderUpload(e) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }
    const inst = $('#tree').jstree(true);
    if (!inst) {
      return;
    }
    const parent = B4ATreeActions.getSelectedParent();
    const parentId = parent[0];

    const readPromises = Array.from(fileList).map(file =>
      new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ path: file.webkitRelativePath, base64: reader.result });
        reader.readAsDataURL(file);
      })
    );

    Promise.all(readPromises).then(results => {
      const createdFolders = {};

      const ensureFolder = (segments, rootId) => {
        let currentParent = rootId;
        let key = '';
        for (const seg of segments) {
          key = key ? `${key}/${seg}` : seg;
          if (!createdFolders[key]) {
            const existingChildren = inst.get_node(currentParent).children || [];
            const existing = existingChildren.find(childId => inst.get_node(childId).text === seg);
            if (existing) {
              createdFolders[key] = existing;
            } else {
              createdFolders[key] = inst.create_node(currentParent, {
                type: 'new-folder',
                text: seg,
                state: { opened: true },
              });
            }
          }
          currentParent = createdFolders[key];
        }
        return currentParent;
      };

      let lastFileId = null;
      for (const { path, base64 } of results) {
        const parts = path.split('/');
        const fileName = parts.pop();
        const targetParent = parts.length > 0 ? ensureFolder(parts, parentId) : parentId;
        lastFileId = inst.create_node(targetParent, {
          type: 'new-file',
          text: fileName,
          data: { code: base64 },
        });
      }

      this.setState({ files: inst.get_json() });
      this.handleTreeChanges();
      if (lastFileId) {
        B4ATreeActions.selectFileOnTree(lastFileId);
      }
    });
    e.target.value = '';
  }

  deleteFile() {
    if (this.props.hideControls) { return; }
    if (this.state.nodeId) {
      B4ATreeActions.remove(`#${this.state.nodeId}`, true);
      this.setState({ source: '', selectedFile: '', nodeId: '' })
      this.handleTreeChanges();
    }
  }

  async selectNode(data) {
    let selected = ''
    let source = ''
    let selectedFile = ''
    let nodeId = ''
    let extension = ''
    let isImage = false
    let selectedFolder = 0;

    if (data.selected && data.selected.length === 1) {
      selected = data.instance.get_node(data.selected[0]);
      // if is not a folder
      if (selected.type !== 'folder') {
        // if is code
        if (selected.data && selected.data.code) {
          // index of file on tree.
          const fileList = this.state.filesOnTree?.fileList ? Array.from(this.state.filesOnTree?.fileList) : [];
          fileList?.map((file) => {
            if (file.name === selected.text) {
              selectedFile = file;
            }
          });
          const fr = new FileReader();
          isImage = this.getFileType(selected.data.code)
          if (isImage === false) {
            if (selectedFile instanceof Blob) {
              fr.onload = () => {
                source = fr.result;
                selectedFile = selected.text;
                nodeId = selected.id
                extension = B4ATreeActions.getExtension(selectedFile)
                this.setState({ source, selectedFile, nodeId, extension, isImage, isLoadingFileData: false })
              }
              fr.readAsText(selectedFile);
            }
            else {
              const decodedCode = window.atob(selected.data.code.split(',')?.[1]);
              const decodedCodeString = decodeURIComponent(escape(decodedCode));
              source = decodedCodeString;
              selectedFile = selected.text
              nodeId = selected.id
              extension = B4ATreeActions.getExtension(selectedFile)
            }
          } else {
            source = selected.data.code;
            selectedFile = selected.text
            nodeId = selected.id
            extension = B4ATreeActions.getExtension(selectedFile)
          }
        } else if (this.props.onFileClick) {
          // Use a request token to prevent race conditions
          if (this.state.loadingFileId === selected.id) {
            return;
          }
          this.loadRequestId += 1;
          const currentRequestId = this.loadRequestId;
          this.setState({ loadingFileId: selected.id, errorFileData: null });
          const dataResult = await this.props.onFileClick(selected);
          // Only update state if this is the latest request
          if (this.loadRequestId !== currentRequestId) {
            return;
          }
          if (dataResult.base64) {
            isImage = /^(jpg|jpeg|png|gif)$/i.test(B4ATreeActions.getExtension(selected.text));
            if (isImage) {
              source = `data:image/png;base64,${dataResult.base64}`;
            } else {
              const base64Data = dataResult.base64.includes(',') ? dataResult.base64.split(',')?.[1] : dataResult.base64;
              const decodedCode = window.atob(base64Data);
              const decodedCodeString = decodeURIComponent(escape(decodedCode));
              source = decodedCodeString;
            }
            selectedFile = selected.text;
            nodeId = selected.id;
            extension = B4ATreeActions.getExtension(selectedFile);
            this.setState({ loadingFileId: null });
          } else {
            this.setState({ errorFileData: 'Failed to fetch file data', loadingFileId: null });
          }
        }
      } else {
        selectedFolder = selected.id;
        if (selected.text === 'cloud') {
          source = cloudFolderPlaceholder
        }
        else if (selected.text === 'public') {
          source = publicFolderPlaceholder
        }
      }
    }
    this.setState({
      source,
      selectedFile,
      nodeId,
      extension,
      isImage,
      selectedFolder,
      isFolderSelected: selected.type == 'folder' || selected.type == 'new-folder' ,
      currentFolder: selected.text,
      selectedTreePath: nodeId ? this.getNodePath(nodeId) : (selected.id ? this.getNodePath(selected.id) : ''),
    })
  }

  // method to identify the selected tree node
  watchSelectedNode() {
    // Detach any previously bound handlers so repeated calls cannot stack
    // duplicate listeners (which would cause selectNode to fire N times per
    // click and freeze the editor on file switches).
    $('#tree').off('changed.jstree');
    $('#tree').on('changed.jstree', (e, data) => {
      this.selectNode(data);
      this.setState({ selectedNodeData: data });
    });
  }

  handleTreeChanges() {
    return this.props.parentState({ unsavedChanges: true })
  }

  async updateSelectedFileContent(value) {
    if (this.props.hideControls) { return; }
    const ecodedValue = await B4ATreeActions.encodeFile(value, 'data:plain/text;base64');
    this.setState({ source: value });

    this.state.selectedNodeData?.instance.set_icon(this.state.selectedNodeData.node, require('./icons/file.png'));

    $('#tree').jstree('get_selected', true).pop().data.code = ecodedValue;
    $('#tree').jstree().redraw(true);

    // set updated files.
    let cloneUpdatedFiles = [...this.props.updatedFiles];
    if(!cloneUpdatedFiles.includes('j1_mainJS') && !cloneUpdatedFiles.includes('j1_indexHTML')){
      this.props.cloudCodeChanges.addFile($('#tree').jstree('get_selected', true).pop().id);
      this.props.setUpdatedFile(this.props.cloudCodeChanges.getFiles());
    }
  }

  selectCloudFolder() {
    if ($('#tree').jstree().get_json().length > 0) {
      const cloudFolder = $('#tree').jstree().get_json()[0].id;
      $('#tree').jstree('select_node', cloudFolder);
    }
  }

  updateCodeOnNewFile(type, text, id, childrenIds = []){

    if (type === 'delete-file') {
      if (!this.props.hasDeployed) {
        let cloneUpdatedFiles = [...this.props.updatedFiles];

        // Mapping auto created files and specific IDs
        const specialFiles = {
          'main.js': 'j1_mainJS',
          'index.html': 'j1_indexHTML'
        };

        // Define which ID to use
        const fileIdToRemove = specialFiles[text] && cloneUpdatedFiles.includes(specialFiles[text])
          ? specialFiles[text]
          : id;

        // Remove from cloudCodeChanges and cloneArray
        this.props.cloudCodeChanges.removeFile(fileIdToRemove);
        cloneUpdatedFiles = cloneUpdatedFiles.filter(f => f !== fileIdToRemove);

        // Reselect folder and update UI
        if ($('#tree').jstree().get_json().length > 0) {
          const cloudFolder = $('#tree').jstree().get_json()[0].id;
          $('#tree').jstree('select_node', cloudFolder);
        }

        this.props.setUpdatedFile(cloneUpdatedFiles);  

        this.selectCloudFolder();
        B4ATreeActions.refreshEmptyFolderIcons();
        return;
      }    

      // this.props.cloudCodeChanges.removeFile(text);
      this.props.cloudCodeChanges.removeFile(id);
      if ($('#tree').jstree().get_json().length > 0) {
        const cloudFolder = $('#tree').jstree().get_json()[0].id;
        $('#tree').jstree('select_node', cloudFolder);
      }
    } else if (type === 'new-file' || type === 'new-folder') {
      // incase of new-file, other file or folder is selected
      // so, directly add that file name in cloudCodeChanges
      text && this.props.cloudCodeChanges.addFile(id);
    } else if (type === 'delete-folder') {
      const toBeDeletedFolder = $('#tree').jstree(true).get_node(id);
      const toBeDeletedIds = toBeDeletedFolder
        ? [toBeDeletedFolder.id, ...toBeDeletedFolder.children_d]
        : [id, ...childrenIds];
      this.props.cloudCodeChanges.removeMultiple(toBeDeletedIds);
    } else if (type === 'rename-node') {
      const renamedNode = $('#tree').jstree(true).get_node(id);
      const renamedIds = renamedNode ? [renamedNode.id, ...renamedNode.children_d] : [id];
      renamedIds.forEach(fileId => this.props.cloudCodeChanges.addFile(fileId));
      this.props.setUpdatedFile(this.props.cloudCodeChanges.getFiles());
      B4ATreeActions.refreshEmptyFolderIcons();
      return;
    } else if (type === 'move-node') {
      const movedNode = $('#tree').jstree(true).get_node(id);
      const movedIds = movedNode ? [movedNode.id, ...movedNode.children_d] : [id];
      movedIds.forEach(fileId => this.props.cloudCodeChanges.addFile(fileId));
    } else {
      // set updated files.
      const selectedFiles = $('#tree').jstree('get_selected', true)
      if (selectedFiles.length) {
        this.props.cloudCodeChanges.addFile(selectedFiles.pop().id);
      }
    }

    this.props.setUpdatedFile(this.props.cloudCodeChanges.getFiles());

    this.selectCloudFolder();

    B4ATreeActions.refreshEmptyFolderIcons();
  }

  componentDidMount() {
    const config = B4ATreeActions.getConfig(this.state.files);
    if (this.props.hideControls) {
      // Remove contextmenu plugin to disable right-click
      config.plugins = config.plugins.filter(p => p !== 'contextmenu' && p !== 'dnd');
      // Remove contextmenu property
      delete config.contextmenu;
    }
    $('#tree').jstree(config);
    this.watchSelectedNode();

    // Mirror jstree's data into React state on every mutation so
    // <B4aFileTree> stays in sync with the source of truth.
    $('#tree').on(
      'refresh.jstree create_node.jstree delete_node.jstree rename_node.jstree move_node.jstree set_text.jstree',
      () => this.syncTreeData()
    );
    $('#tree').on('ready.jstree', () => {
      this.syncTreeData();
      this.selectCloudFolder();
    });

    if (!this.props.hideControls) {
      $('#tree').on('create_node.jstree', (node, parent) => {
        amplitudeLogEvent(`CloudCode create ${parent?.node?.type}`);
        this.updateCodeOnNewFile(parent?.node?.type, parent?.node?.text, parent?.node?.id);
      });
      $('#tree').on('delete_node.jstree', (parent, node) => {
        if (node?.node?.type === 'folder' || node?.node?.type === 'new-folder') {
          amplitudeLogEvent(`CloudCode delete ${parent?.node?.type}`);
          this.updateCodeOnNewFile('delete-folder', node?.node?.text, node?.node?.id, node?.node?.children_d || []);
        } else {
          this.updateCodeOnNewFile('delete-file', node?.node?.text, node?.node?.id);
        }
      });
      $('#tree').on('rename_node.jstree', (event, data) => {
        amplitudeLogEvent(`CloudCode rename ${data?.node?.type}`);
        this.updateCodeOnNewFile('rename-node', data?.node?.text, data?.node?.id);
        this.handleTreeChanges();
      });
      $('#tree').on('move_node.jstree', (event, data) => {
        amplitudeLogEvent(`CloudCode move ${data?.node?.type}`);
        this.updateCodeOnNewFile('move-node', data?.node?.text, data?.node?.id);
        this.handleTreeChanges();
      });
    }
  }

  componentDidUpdate() {
    if ($('#tree').jstree().get_selected().length <= 0) {
      this.selectCloudFolder();
    }
  }

  componentWillUnmount() {
    $('#tree').off(
      'changed.jstree create_node.jstree delete_node.jstree rename_node.jstree move_node.jstree set_text.jstree refresh.jstree ready.jstree'
    );
  }

  render(){
    let content;
    if (this.state.loadingFileId) {
      content = <B4aEmptyState
        margin="46px 0 0 0"
        imgSrc={folderInfoIcon}
        description="Loading file content..." />;
    } else if (this.state.isImage) {
      content = <img style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} src={this.state.source} />;
    }
    else if (this.state.isFolderSelected === true) {
      content = 
        this.state.currentFolder && this.state.currentFolder === 'cloud' ?
          <B4aCloudEmpty
            imgSrc={folderInfoIcon}
            selectMainJs={() => this.selectSpecificFile('main.js')}
            currentApp={this.props.currentApp}
            hasDeployed={this.props.hasDeployed}
          />
        : this.state.currentFolder === 'public' ?
          <B4aCloudPublicEmpty
            imgSrc={folderInfoIcon}
            selectIndex={() => this.selectSpecificFile('index.html')}
            hasDeployed={this.props.hasDeployed}
          /> 
        :
        this.state.source && this.state.source !== '' ? 
          <B4aEmptyState
            margin="46px 0 0 0"
            imgSrc={folderInfoIcon}
            description={this.state.source} 
          /> 
        : 
        <div></div>;
    }
    else if (this.state.selectedFile) {
      content = <div className={`${styles.filesPreviewWrapper}`}>
        <div className={styles.filesPreviewHeader} >
          <p>{typeof this.state.selectedFile === 'string' ? this.state.selectedFile : this.state.selectedFile.name}</p>
          {!this.props.hideControls && (
            <button
              className={styles.deleteBtn}
              primary={true}
              disabled={!this.state.nodeId}
              onClick={this.deleteFile.bind(this)}
            >
              <Icon name='b4a-delete-icon' fill="#E85C3E" width={24} height={20} />
            </button>
          )}
        </div>
        <B4ACloudCodeView
          isFolderSelected={this.state.isFolderSelected}
          onCodeChange={value => this.updateSelectedFileContent(value)}
          source={this.state.source}
          extension={this.state.extension}
          fileName={this.state.selectedFile}
          readOnly={!!this.props.hideControls}
        />
      </div>;
    } else {
      content = (
        <B4aEmptyState imgSrc={folderInfoIcon} description={`Select a file to ${this.props.hideControls ? 'view' : 'edit'}`} margin="46px 0 0 0" />
      );
    }

    const handleNewFile = () => {
      if (this.state.selectedFile === '') {
        this.selectCloudFolder();
      }
      swalWithBootstrapButtons.fire({
        title: 'Create a new empty file',
        text: 'Name your file',
        padding: '1rem 2rem',
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off',
          placeholder: 'File name',
        },
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Create file',
        buttonsStyling: false,
        showCloseButton: true,
        allowOutsideClick: () => !Swal.isLoading()
      }).then(({ value }) => {
        if (value) {
          value = B4ATreeActions.sanitizeHTML(value);
          const parent = B4ATreeActions.getSelectedParent();
          const newNodeId = B4ATreeActions.addFileOnSelectedNode(value, parent[0]);
          B4ATreeActions.selectFileOnTree(newNodeId);
          this.setState({ files: $('#tree').jstree(true).get_json() });
        }
      });
    };

    return (
      <div className={styles.codeContainer} style={this.props.style ? this.props.style : {}} id="codeContainer">
        <div className={styles.fileSelector}>
          <div className={styles.vscodeSidebar}>
            <div className={styles.vscodeHeader}>
              <span className={styles.vscodeHeaderTitle}>Explorer</span>
              {!this.props.hideControls && (
                <div className={styles.vscodeHeaderActions}>
                  <button
                    type="button"
                    className={styles.vscodeIconButton}
                    onClick={handleNewFile}
                    title="New file"
                    aria-label="New file"
                  >
                    <Icon name="b4a-add-outline-circle" fill="currentColor" width={16} height={16} />
                  </button>
                  <div className={styles.uploadDropdownWrapper}>
                    <button
                      type="button"
                      className={styles.vscodeIconButton}
                      title="Upload"
                      aria-label="Upload"
                      onClick={() => this.setState({ showUploadMenu: !this.state.showUploadMenu })}
                    >
                      <Icon name="B4a-upload-file-icon" fill="currentColor" width={16} height={16} />
                    </button>
                    {this.state.showUploadMenu && (
                      <UploadMenu
                        menuRef={this.uploadMenuRef}
                        onUploadFiles={() => {
                          this.setState({ showUploadMenu: false });
                          this.fileInputRef.current?.click();
                        }}
                        onUploadFolder={() => {
                          this.setState({ showUploadMenu: false });
                          this.folderInputRef.current?.click();
                        }}
                        onClose={() => this.setState({ showUploadMenu: false })}
                      />
                    )}
                    <input
                      ref={this.fileInputRef}
                      type="file"
                      multiple
                      accept="*/*"
                      className={styles.hiddenInput}
                      onChange={e => this.handleNativeFileUpload(e)}
                    />
                    <input
                      ref={this.folderInputRef}
                      type="file"
                      /* eslint-disable-next-line react/no-unknown-property */
                      webkitdirectory=""
                      directory=""
                      multiple
                      className={styles.hiddenInput}
                      onChange={e => this.handleFolderUpload(e)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className={styles.vscodeTreeWrapper}>
              <B4aFileTree
                tree={this.state.treeData}
                selectedPath={this.state.selectedTreePath}
                onFileSelect={(node, path) => this.handleFileTreeSelect(node, path)}
                onContextAction={!this.props.hideControls ? (action, node, path, newName) => this.handleContextAction(action, node, path, newName) : undefined}
                onNodeDrop={!this.props.hideControls ? (sourcePath, targetPath) => this.handleFileTreeDrop(sourcePath, targetPath) : undefined}
                defaultExpanded={['cloud', 'public']}
                emptyMessage="No files yet"
              />
              {/*
                jstree still owns selection state, mutation operations, and
                deploy serialization. Its DOM is hidden
                but kept mounted so all those existing flows keep working.
              */}
              <div className={styles.hiddenJstree}>
                <div id={'tree'}></div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.filePreview}>
          {content}
        </div>
      </div>
    );
  }
}

B4ACodeTree.propTypes = {
  setUpdatedFile: PropTypes.func.isRequired.describe('Function to update undeployed file count.'),
  currentApp: PropTypes.any.isRequired.describe('The current parseApp.'),
  files: PropTypes.any.isRequired.describe('Array of files'),
  parentState: PropTypes.func.isRequired.describe('Update parent state.'),
  onFileClick: PropTypes.func.describe('Function to call when a file is clicked'),
  hideControls: PropTypes.bool.describe('Whether to hide the controls')
}
