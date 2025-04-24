import React from 'react';
// eslint-disable-next-line no-unused-vars
import jstree from 'jstree';
// 🚫🚫 DO NOT REMOVE ABOVE LINE, as the scripts needs to be loaded that allows to use $('#tree').jstree for proper tree rendering, it took me a whole day to debug 🤯🤯🤯.
import $ from 'jquery';
import { Resizable } from 're-resizable';
import ReactFileReader from 'react-file-reader';
import styles from 'components/B4ACodeTree/B4ACodeTree.scss'
import Button from 'components/Button/Button.react';
import B4ACloudCodeView from 'components/B4ACloudCodeView/B4ACloudCodeView.react';
import B4ATreeActions from 'components/B4ACodeTree/B4ATreeActions';
import Swal from 'sweetalert2';
// import B4ACloudCodeInfo from 'components/B4ACodeTree/B4ACloudCodeInfo.react';
import folderInfoIcon from './icons/folder-info.png';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
// import CloudCodeChanges from 'lib/CloudCodeChanges';
import PropTypes from 'lib/PropTypes';
import Icon from 'components/Icon/Icon.react';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';

import buttonStyles from 'components/Button/Button.scss';
import baseStyles from 'stylesheets/base.scss';
import modalStyles from 'components/B4aModal/B4aModal.scss';

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
      isFolderSelected: true,
      selectedNodeData: null
    }

    // this.cloudCodeChanges = new CloudCodeChanges();
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

  deleteFile() {
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
      // if is code
      if (selected.data && selected.data.code && selected.type != 'folder') {
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
              this.setState({ source, selectedFile, nodeId, extension, isImage })
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
    this.setState({ source, selectedFile, nodeId, extension, isImage, selectedFolder, isFolderSelected: selected.type == 'folder' || selected.type == 'new-folder' })
  }

  // method to identify the selected tree node
  watchSelectedNode() {
    $('#tree').on('select_node.jstree', async (e, data) => this.selectNode(data))
    $('#tree').on('changed.jstree', (e, data) => {
      this.selectNode(data);
      this.setState({ selectedNodeData: data });
    })
  }

  handleTreeChanges() {
    return this.props.parentState({ unsavedChanges: true })
  }

  async updateSelectedFileContent(value) {
    const ecodedValue = await B4ATreeActions.encodeFile(value, 'data:plain/text;base64');
    this.setState({ source: value });

    this.state.selectedNodeData?.instance.set_icon(this.state.selectedNodeData.node, require('./icons/file.png'));

    $('#tree').jstree('get_selected', true).pop().data.code = ecodedValue;
    $('#tree').jstree().redraw(true);

    // set updated files.
    this.props.cloudCodeChanges.addFile($('#tree').jstree('get_selected', true).pop().id);
    this.props.setUpdatedFile(this.props.cloudCodeChanges.getFiles());
  }

  selectCloudFolder() {
    if ($('#tree').jstree().get_json().length > 0) {
      const cloudFolder = $('#tree').jstree().get_json()[0].id;
      $('#tree').jstree('select_node', cloudFolder);
    }
  }

  updateCodeOnNewFile(type, text, id){
    if (type === 'delete-file') {
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
      const toBeDeletedIds = [toBeDeletedFolder.id, ...toBeDeletedFolder.children_d];
      this.props.cloudCodeChanges.removeMultiple(toBeDeletedIds);
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
    $('#tree').jstree(config);
    this.watchSelectedNode();
    $('#tree').on('create_node.jstree', (node, parent) => {
      amplitudeLogEvent(`CloudCode create ${parent?.node?.type}`);
      this.updateCodeOnNewFile(parent?.node?.type, parent?.node?.text, parent?.node?.id);
    });
    $('#tree').on('delete_node.jstree', (parent, node) => {
      if (node?.node?.type === 'new-folder') {
        amplitudeLogEvent(`CloudCode delete ${parent?.node?.type}`);
        this.updateCodeOnNewFile('delete-folder', node?.node?.text, node?.node?.id);
      } else {
        this.updateCodeOnNewFile('delete-file', node?.node?.text, node?.node?.id);
      }
    });
  }

  componentDidUpdate() {
    if ($('#tree').jstree().get_selected().length <= 0) {
      this.selectCloudFolder();
    }
  }

  render(){
    let content;
    if (this.state.isImage) {
      content = <img style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} src={this.state.source} />;
    }
    else if (this.state.isFolderSelected === true) {
      content = this.state.source && this.state.source !== '' ? <B4aEmptyState
        margin="46px 0 0 0"
        imgSrc={folderInfoIcon}
        description={this.state.source} /> : <div></div>;
    }
    else if (this.state.selectedFile) {
      content = <div className={`${styles.filesPreviewWrapper}`}>
        <div className={styles.filesPreviewHeader} >
          <p>{typeof this.state.selectedFile === 'string' ? this.state.selectedFile : this.state.selectedFile.name}</p>
          <button
            className={styles.deleteBtn}
            primary={true}
            disabled={!this.state.nodeId}
            onClick={this.deleteFile.bind(this)}
          >
            <Icon name='b4a-delete-icon' fill="#E85C3E" width={24} height={20} />
          </button>
        </div>
        <B4ACloudCodeView
          isFolderSelected={this.state.isFolderSelected}
          onCodeChange={value => this.updateSelectedFileContent(value)}
          source={this.state.source}
          extension={this.state.extension}
          fileName={this.state.selectedFile} />
      </div>;
    } else {
      content = (
        <B4aEmptyState imgSrc={folderInfoIcon} description="Select a file to edit" margin="46px 0 0 0" />
      );
    }

    return (
      <div className={styles.codeContainer}>
        <div className={styles.fileSelector}>
          <div className={`${styles['files-box']}`}>
            <div className={styles['files-header']} >
              <p>Files</p>
              <div>
                <Button
                  onClick={() => {
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
                    }).then(({value}) => {
                      if (value) {
                        value = B4ATreeActions.sanitizeHTML(value);
                        const parent = B4ATreeActions.getSelectedParent();
                        const newNodeId = B4ATreeActions.addFileOnSelectedNode(value, parent[0]);
                        B4ATreeActions.selectFileOnTree(newNodeId); // select new file
                        this.setState({ files: $('#tree').jstree(true).get_json() });
                      }
                    })
                  }}
                  disabled={false}
                  value={
                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: '0.3125rem', border: '1px solid rgba(249, 249, 249, 0.06)', background: '#303338', padding: '0.3125rem 0.875rem' }}>
                      <Icon name="b4a-add-outline-circle" fill="#27AE60" width={18} height={18} />
                      <span style={{ color: '#f9f9f9', marginLeft:'0.25rem', fontSize: '14px' }}>New File</span>
                    </div>}
                  width='20'
                  additionalStyles={{ minWidth: '40px', background: 'transparent', border: 'none', padding: '0' }}
                />
                <ReactFileReader
                  fileTypes={'*/*'}
                  base64={true}
                  multipleFiles={true}
                  handleFiles={this.handleFiles.bind(this)}>
                  <Button
                    value={
                      <div style={{ display: 'flex', alignItems: 'center', borderRadius: '0.3125rem', border: '1px solid rgba(249, 249, 249, 0.06)', background: '#303338', padding: '0.3125rem 0.875rem' }}>
                        <Icon name="B4a-upload-file-icon" fill="#27AE60" width={18} height={18} />
                        <span style={{ color: '#f9f9f9', marginLeft: '0.25rem', fontSize: '14px' }}>Upload</span>
                      </div>}
                    width='20'
                    additionalStyles={{ minWidth: '60px', background: 'transparent', border: 'none', padding: '0' }}
                  />
                </ReactFileReader>
              </div>
            </div>
            <Resizable className={styles['files-tree']}
              defaultSize={{ height: '100%', overflow: 'srcoll', width: '100%' }}
              enable={{
                top:false,
                right:false,
                bottom:true,
                left:false,
                topRight:false,
                bottomRight:false,
                bottomLeft:false,
                topLeft:false
              }}>
              <div id={'tree'} onClick={this.watchSelectedNode.bind(this)}></div>
            </Resizable>
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
  parentState: PropTypes.func.isRequired.describe('Update parent state.')
}
