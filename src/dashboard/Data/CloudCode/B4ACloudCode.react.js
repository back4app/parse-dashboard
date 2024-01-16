/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React                  from 'react';
import { withRouter } from 'react-router';
import history                from 'dashboard/history';
import $                      from 'jquery';
import axios                  from 'axios';
import Button                 from 'components/Button/Button.react';
import B4ACodeTree            from 'components/B4ACodeTree/B4ACodeTree.react';
import {
  updateTreeContent
}                             from 'components/B4ACodeTree/B4ATreeActions';
import B4ACloudCodeToolbar    from 'dashboard/Data/CloudCode/B4ACloudCodeToolbar.react';
import CloudCode              from 'dashboard/Data/CloudCode/CloudCode.react';
import LoaderContainer        from 'components/LoaderContainer/LoaderContainer.react';
import LoaderDots             from 'components/LoaderDots/LoaderDots.react';
import styles                 from 'dashboard/Data/CloudCode/CloudCode.scss';
import Icon                   from 'components/Icon/Icon.react';
import Modal                  from 'components/Modal/Modal.react';

class B4ACloudCode extends CloudCode {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Functions & Web Hosting';

    this.appsPath = 'parse-app'

    // Parameters used to on/off alerts
    this.alertTips = 'showTips'
    this.alertWhatIs= 'showWhatIs'

    this.state = {
      // property to keep the persisted cloud code files
      files: undefined,
      loading: true,
      unsavedChanges: false,
      modal: null,
      updatedFiles: [],

      // Parameters used to on/off alerts
      showTips: localStorage.getItem(this.alertTips) !== 'false',
      showWhatIs: localStorage.getItem(this.alertWhatIs) !== 'false'
    };

    this.onLogClick = this.onLogClick.bind(this);
  }

  // Method used to handler the B4AAlerts closed (that divs with some tips) and
  // save this action at Local Storage to persist data.
  handlerCloseAlert(alertTitle) {
    // identify the alert name based on received alert title
    let alertName = (alertTitle.indexOf('Tips') >= 0 ? this.alertTips : this.alertWhatIs)
    localStorage.setItem(alertName, 'false')
  }

  // Return the cloud code API path
  getPath() {
    return `${b4aSettings.BACK4APP_API_PATH}/${this.appsPath}/${this.props.params.appId}/cloud`
  }

  async componentWillMount() {
    typeof back4AppNavigation === 'object' && back4AppNavigation.atCloudCodePageEvent()
    await this.fetchSource()
    // define the parameters to show unsaved changes warning modal
    const unbindHook = this.props.history.block(nextLocation => {
      if (this.state.unsavedChanges || this.state.updatedFiles.length > 0) {
        const warningModal = <Modal
          type={Modal.Types.WARNING}
          icon='warn-triangle-solid'
          title="Undeployed changes!"
          buttonsInCenter={true}
          textModal={true}
          confirmText='Continue anyway'
          onConfirm={() => {
            unbindHook();
            history.push(nextLocation);
          }}
          onCancel={() => { this.setState({ modal: null }); }}
          >There are undeployed changes, if you leave the page you will lose it.</Modal>;
        this.setState({ modal: warningModal });
        return false;
      } else {
        unbindHook();
      }
    });
  }

  componentDidUpdate() {
    if ( this.state.updatedFiles.length > 0 || this.state.unsavedChanges === true ) {
      window.onbeforeunload = function() {
        this.onBeforeUnloadSaveCode = window.onbeforeunload = function() {
          return '';
        }
      }
    } else {
      window.onbeforeunload = undefined;
    }
  }

  componentWillUnmount() {
    if (this.onBeforeUnloadSaveCode) {
      window.removeEventListener('onbeforeunload',this.onBeforeUnloadSaveCode);
    }
  }

  // Format object to expected backend pattern
  formatFiles(nodes, parent) {
    nodes.forEach(node => {
      let file = node;

      // Remove 'new-' prefix from files that will be deployed
      let currentFile = { text: file.text, type: file.type.split('new-').pop() };
      currentFile.type = (currentFile.type === 'file' ? 'default' : currentFile.type)

      parent.push(currentFile);
      if (currentFile.type === 'folder') {
        currentFile.children = [];
        // If is a folder, call formatFiles recursively
        this.formatFiles(file.children, currentFile.children);
      } else {
        currentFile.data = file.data;
      }
    })
  }

  async uploadCode() {
    let tree = [];
    // Get current files on tree
    let currentCode = $('#tree').jstree().get_json();
    const missingFileModal = (
      <Modal
        type={Modal.Types.DANGER}
        icon='warn-triangle-solid'
        title='Missing required file'
        showCancel={false}
        textModal={true}
        confirmText='Ok, got it'
        buttonsInCenter={true}
        onConfirm={() => {
          this.setState({ modal: null });
        }}>
          The cloud folder must contain either main.js or app.js file, and must be placed on the root of the folder.
        </Modal>
    );

    // get files in cloud folder
    let cloudCode = currentCode?.find(code => code.text === 'cloud');
    if (!cloudCode) {
      // show modal for missing main.js or app.js
      return this.setState({ modal: missingFileModal });
    }
    // check main.js or app.js file on cloud folder
    let fileIdx = cloudCode.children.findIndex(file => file.text === 'main.js' || file.text === 'app.js');
    if (fileIdx === -1) {
      // show modal for missing main.js or app.js
      return this.setState({ modal: missingFileModal });
    }

    this.formatFiles(currentCode, tree);
    const loadingModal = <Modal
      type={Modal.Types.INFO}
      icon='files-outline'
      title='Deploying...'
      textModal={true}
      customFooter={<div style={{ padding: '10px 0 20px' }}></div>}>
        <div>
          <LoaderDots />
          <div>
            Please wait, deploying in progress...
          </div>
        </div>
      </Modal>;
    // show 'loading' modal
    this.setState({ modal: loadingModal });
    try{
      await axios(this.getPath(), {
        method: "post",
        data: { tree },
        withCredentials: true
      })
      back4AppNavigation && back4AppNavigation.deployCloudCodeEvent()
      await this.fetchSource()
      // force jstree component to upload
      await updateTreeContent(this.state.files)
      const successModal = <Modal
        type={Modal.Types.VALID}
        icon='check'
        title='Success on deploying your changes!'
        showCancel={false}
        buttonsInCenter={true}
        confirmText='Ok, got it'
        onConfirm={() => this.setState({ modal: null })}
        />;
      this.setState({updatedFiles: [], unsavedChanges: false, modal: successModal });
      $('#tree').jstree(true).redraw(true);
      this.fetchSource();
    } catch (err) {
      const errorModal = <Modal
        type={Modal.Types.DANGER}
        icon='warn-triangle-solid'
        title='Something went wrong'
        showCancel={false}
        textModal={true}
        confirmText='Ok, got it'
        buttonsInCenter={true}
        onConfirm={() => {
          this.setState({ modal: null });
        }}>
          Please try to deploy your changes again.
        </Modal>;
      this.setState({
        modal: errorModal
      });
    }
  }

  // method used to fetch the cloud code from app
  async fetchSource() {
    try {
      let response = await axios.get(this.getPath(), { withCredentials: true })
      if (response.data && response.data.tree) {
        this.setState({ files: response.data.tree, loading: false })
        $('#tree').jstree().refresh(true);
      }
    } catch(err) {
      console.error(err)
      this.setState({ loading: false })
    }
  }

  onLogClick() {
    window.open(`/apps/${this.context.currentApp.slug}/logs/system`, '_blank');
  }

  // override renderSidebar from cloud code to don't show the files name on sidebar
  renderSidebar() {
    return null
  }

  renderContent() {
    let content = null;
    let title = null;
    let footer = null;

    // Show loading page before fetch data
    if (this.state.loading) {
      content = <LoaderContainer loading={true} solid={false}>
        <div className={styles.loading}></div>
      </LoaderContainer>
    } else { // render cloud code page

      title = <B4ACloudCodeToolbar />

      content = <B4ACodeTree
        setUpdatedFile={(updatedFiles) => this.setState({ updatedFiles })}
        files={this.state.files}
        parentState={this.setState.bind(this)}
        currentApp={this.context.currentApp}
      />

      footer = <div className={styles.footer}>
        <div className={styles.footerContainer}>
          {
            this.state.updatedFiles.length > 0 &&
            <div className={styles.ccStatusIcon}>
              <span className={styles.undeployedCircle}></span> <small>Files pending deploy ({this.state.updatedFiles.length})</small>
            </div>
          }
        </div>
        <div className={styles.footerContainer}>
          <Button
            onClick={this.onLogClick}
            value={
              <div>
                <span style={{ color: '#218BEC' }}>Logs</span>
              </div>}
            primary={true}
            width='20'
            additionalStyles={{ minWidth: '70px', background: 'transparent', color: 'dimgray!important' }}
          />
          <Button
            value={<div className={styles['b4a-cc-deploy-btn']}><Icon name='icon-deploy' fill='#fff' width={17} height={30} /> Deploy</div>}
            primary={true}
            onClick={this.uploadCode.bind(this)}
          />
        </div>
      </div>
    }

    return (
      <div className={`${styles.source} ${styles['b4a-source']}`} >
        {title}
        {content}
        {footer}
        {this.state.modal}
      </div>
    );
  }
}

export default withRouter(B4ACloudCode);
