import React                        from 'react';
import $                            from 'jquery';
import Resizable                    from 're-resizable';
import jstree                       from 'jstree';
import ReactFileReader              from 'react-file-reader';
import styles                       from 'components/B4ACodeTree/B4ACodeTree.scss'
import Button                       from 'components/Button/Button.react';
import B4ACloudCodeView             from 'components/B4ACloudCodeView/B4ACloudCodeView.react';
import B4ATreeActions               from 'components/B4ACodeTree/B4ATreeActions';
import Swal                         from 'sweetalert2';
import B4AAlert                     from 'components/B4AAlert/B4AAlert.react';
import Icon                         from 'components/Icon/Icon.react';
import addFileIcon                  from './icons/add-file.png';
import uploadFileIcon               from './icons/file-upload-outline.png';
import removeFileIcon               from './icons/trash-can-outline.png';
import 'jstree/dist/themes/default/style.css'
import 'components/B4ACodeTree/B4AJsTree.css'

const getCloudFolderPlaceholder = (appId, restKey) =>
  "The Cloud Folder can be used to deploy cloud functions, triggers, and custom Express.js routes.";

const publicFolderPlaceholder = "Public folder can be used to deploy public static content as html, images, css, etc.\n"

let cloudFolderPlaceholder

export default class B4ACodeTree extends React.Component {
  constructor(props){
    super(props);

    // get appId and restKey from props
    this.appId = this.props.currentApp && this.props.currentApp.applicationId || '<YOUR_APP_ID_HERE>'
    this.restKey = this.props.currentApp && this.props.currentApp.restKey || '<YOUR_REST_KEY_HERE>'

    // set a cloudCodePlaceholder with the app's data
    cloudFolderPlaceholder = getCloudFolderPlaceholder(this.appId, this.restKey)

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
    let fileObj = files.fileList['0'];
    if (fileObj && fileObj.size === 0) {
      let fileType = fileObj.type || 'plain/text';
      files.base64[0] = `data:${fileType};base64,`;
    }
    this.setState({ newFile: files })
    this.loadFile()
  }

  // load file and add on tree
  async loadFile() {
    let file = this.state.newFile;
    if (file) {
      let currentTree = '#';
      const { overwrite, newNodeId } = await B4ATreeActions.addFilesOnTree(file, currentTree, this.state.selectedFolder);
      if ( overwrite === true ) {
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
        fileList?.map( (file ) => {
          if ( file.name === selected.text ) {
            selectedFile = file;
          }
        });
        const fr = new FileReader();
        isImage = this.getFileType(selected.data.code)
        if ( isImage === false ) {
          if ( selectedFile instanceof Blob ) {
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
            const decodedCode = await B4ATreeActions.decodeFile(selected.data.code);
            const decodedCodeString = new TextDecoder().decode(decodedCode);
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

    this.props.setCodeUpdated(true);
    this.state.selectedNodeData?.instance.set_icon(this.state.selectedNodeData.node, require('./icons/file.png').default);

    $('#tree').jstree('get_selected', true).pop().data.code = ecodedValue;
    $('#tree').jstree().redraw(true);

  }

  selectCloudFolder() {
    if ( $('#tree').jstree().get_json().length > 0 ) {
      const cloudFolder = $('#tree').jstree().get_json()[0].id;
      $('#tree').jstree('select_node', cloudFolder);
    }
  }


  componentDidMount() {
    let config = B4ATreeActions.getConfig(this.state.files);
    $('#tree').jstree(config);
    this.watchSelectedNode();
    $('#tree').on('changed.jstree', function() {
      B4ATreeActions.refreshEmptyFolderIcons();
    });
    $('#tree').on('create_node.jstree', function() {
      B4ATreeActions.refreshEmptyFolderIcons();
    });

    $('#tree').on('delete_node.jstree', function() {
      if ( $('#tree').jstree().get_json().length > 0 ) {
        const cloudFolder = $('#tree').jstree().get_json()[0].id;
        $('#tree').jstree('select_node', cloudFolder);
      }
    });
  }

  componentDidUpdate() {
    if ( $('#tree').jstree().get_selected().length <= 0 ) {
      this.selectCloudFolder();
    }
  }

  render(){
    let content;
    if (this.state.isImage) {
      content = <img style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} src={this.state.source} />;
    }
    else if ( this.state.isFolderSelected === true ) {
      content = this.state.source && this.state.source !== '' ? <B4AAlert
                  hideClose
                  show={true}
                  title={typeof this.state.selectedFile === 'string' ? this.state.selectedFile : this.state.selectedFile.name}
                  description={this.state.source} /> : <div></div>;
    }
    else if (this.state.selectedFile) {
      content = <div className={`${styles['files-box']}`}>
            <div className={styles['files-header']} >
              <p>{ typeof this.state.selectedFile === 'string' ? this.state.selectedFile : this.state.selectedFile.name}</p>
              <Button
                additionalStyles={{ minWidth: '70px', background: 'transparent', border: 'none' }}
                value={
                  <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={removeFileIcon} height='24px' width='24px' />
                    <span style={{ color: 'dimgray', fontSize: '10px', lineHeight: '15px' }}>Remove File</span>
                  </div>
                }
                primary={true}
                color={'red'}
                width='93'
                disabled={!this.state.nodeId}
                onClick={this.deleteFile.bind(this)}
              />
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
        <B4AAlert show={true} hideClose description="Select a file to edit" />
      );
    }

    return (
      <div className={styles.codeContainer}>
        <div className={styles.fileSelector}>
          <div className={`${styles['files-box']}`}>
            <div className={styles['files-header']} >
              <p>Files</p>
              <ReactFileReader
                fileTypes={'*/*'}
                base64={true}
                multipleFiles={true}
                handleFiles={this.handleFiles.bind(this)}>
                <Button
                  value={
                    <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src={uploadFileIcon} height='24px' width='24px' />
                      <span style={{ color: 'dimgray', fontSize: '10px', lineHeight: '15px' }}>Upload File</span>
                    </div>}
                  primary={true}
                  width='20'
                  additionalStyles={{ minWidth: '60px', background: 'transparent', border: 'none' }}
                />
              </ReactFileReader>
                <Button
                  onClick={() => {
                    if ( this.state.selectedFile === '' ) {
                      this.selectCloudFolder();
                    }
                    Swal.fire({
                      title: 'Create a new empty file',
                      text: 'Name your file',
                      input: 'text',
                      inputAttributes: {
                        autocapitalize: 'off'
                      },
                      showCancelButton: true,
                      confirmButtonText: 'Create file',
                      allowOutsideClick: () => !Swal.isLoading()
                    }).then(({value}) => {
                      if (value) {
                        const parent = B4ATreeActions.getSelectedParent();
                        let newNodeId = B4ATreeActions.addFileOnSelectedNode(value, parent);
                        B4ATreeActions.selectFileOnTree(newNodeId); // select new file
                        this.setState({ files: $('#tree').jstree(true).get_json() });
                      }
                    })
                  }}
                  disabled={false}
                  value={
                    <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src={addFileIcon} height='24px' width='24px' />
                      <span style={{ color: 'dimgray', fontSize: '10px', lineHeight: '15px' }}>New File</span>
                    </div>}
                  primary={true}
                  width='20'
                  additionalStyles={{ minWidth: '40px', background: 'transparent', border: 'none' }}
                />
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
