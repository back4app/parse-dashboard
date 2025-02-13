/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import $ from 'jquery';
import axios from 'axios';
import Button from 'components/Button/Button.react';
import B4ACodeTree from 'components/B4ACodeTree/B4ACodeTree.react';
import { updateTreeContent } from 'components/B4ACodeTree/B4ATreeActions';
import B4ACloudCodeToolbar from 'dashboard/Data/CloudCode/B4ACloudCodeToolbar.react';
import CloudCode from 'dashboard/Data/CloudCode/CloudCode.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import LoaderDots from 'components/LoaderDots/LoaderDots.react';
import styles from 'dashboard/Data/CloudCode/CloudCode.scss';
import Icon from 'components/Icon/Icon.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import { withRouter } from 'lib/withRouter';
import CloudCodeChanges from 'lib/CloudCodeChanges';
import { pushGTMEvent } from 'lib/gtm.js';

@withRouter
class B4ACloudCode extends CloudCode {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Functions & Web Hosting';

    this.appsPath = 'parse-app'

    // Parameters used to on/off alerts
    this.alertTips = 'showTips'
    this.alertWhatIs = 'showWhatIs'

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
    this.cloudCodeChanges = new CloudCodeChanges();
  }

  // Method used to handler the B4AAlerts closed (that divs with some tips) and
  // save this action at Local Storage to persist data.
  handlerCloseAlert(alertTitle) {
    // identify the alert name based on received alert title
    const alertName = (alertTitle.indexOf('Tips') >= 0 ? this.alertTips : this.alertWhatIs)
    localStorage.setItem(alertName, 'false')
  }

  // Return the cloud code API path
  getPath() {
    // eslint-disable-next-line no-undef
    return `${b4aSettings.BACK4APP_API_PATH}/${this.appsPath}/${this.props.params.appId}/cloud`
  }

  blocker(tx) {
    const warningModal = <B4aModal
      type={B4aModal.Types.DANGER}
      icon='b4a-warn-fill-icon'
      iconFill="#cccccc"
      title="Undeployed changes!"
      buttonsInCenter={true}
      confirmText='Continue anyway'
      onConfirm={() => {
        tx.retry();
      }}
      onCancel={() => { this.setState({ modal: null }); }}
    ><span className={styles.subtitleModal}>There are undeployed changes, if you leave the page you will lose it.</span></B4aModal>;
    this.setState({ modal: warningModal });
  }

  async componentWillMount() {
    // eslint-disable-next-line no-undef
    // typeof back4AppNavigation === 'object' && back4AppNavigation.atCloudCodePageEvent()
    await this.fetchSource();
    // define the parameters to show unsaved changes warning modal
    this.unblock = this.props.navigator.block(tx => {
      if (this.state.unsavedChanges || this.state.updatedFiles.length > 0) {
        const unblock = this.unblock.bind(this);
        const autoUnblockingTx = {
          ...tx,
          retry() {
            unblock();
            tx.retry();
          }
        };
        this.blocker(autoUnblockingTx);
      } else {
        this.unblock();
        tx.retry();
      }
    });
  }

  componentDidUpdate() {
    if (this.state.updatedFiles.length > 0 || this.state.unsavedChanges === true) {
      window.onbeforeunload = function() {
        this.onBeforeUnloadSaveCode = window.onbeforeunload = function() {
          return '';
        }
      }
    } else {
      window.removeEventListener('beforeunload', this.onBeforeUnloadSaveCode);
    }
  }

  componentWillUnmount() {
    if (this.unblock) {
      this.unblock();
    }
    if (this.onBeforeUnloadSaveCode) {
      window.removeEventListener('beforeunload',this.onBeforeUnloadSaveCode);
    }
  }

  // Format object to expected backend pattern
  formatFiles(nodes, parent) {
    nodes.forEach(node => {
      const file = node;

      // Remove 'new-' prefix from files that will be deployed
      const currentFile = { text: file.text, type: file.type.split('new-').pop() };
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
    pushGTMEvent('create_app_backend', true);
    const tree = [];
    // Get current files on tree
    const currentCode = $('#tree').jstree().get_json();
    const missingFileModal = (
      <B4aModal
        type={B4aModal.Types.DANGER}
        icon='b4a-warn-fill-icon'
        iconFill="#cccccc"
        title='Missing required file'
        showCancel={false}
        textModal={true}
        confirmText='Ok, got it'
        buttonsInCenter={true}
        onConfirm={() => {
          this.setState({ modal: null });
        }}>
        <span className={styles.subtitleModal}>The cloud folder must contain either main.js or app.js file, and must be placed on the root of the folder.</span>
      </B4aModal>
    );

    // get files in cloud folder
    const cloudCode = currentCode?.find(code => code.text === 'cloud');
    if (!cloudCode) {
      // show modal for missing main.js or app.js
      return this.setState({ modal: missingFileModal });
    }
    // check main.js or app.js file on cloud folder
    const fileIdx = cloudCode.children.findIndex(file => file.text === 'main.js' || file.text === 'app.js');
    if (fileIdx === -1) {
      // show modal for missing main.js or app.js
      return this.setState({ modal: missingFileModal });
    }

    this.formatFiles(currentCode, tree);
    const loadingModal = <B4aModal
      type={B4aModal.Types.DEFAULT}
      icon='files-outline'
      iconFill="#15A9FF"
      title='Deploying...'
      showCancel={false}
      customFooter={<div style={{ padding: '10px 0 20px' }}></div>}>
      <div style={{ textAlign: 'center', color: '#0F1C32' }}>
        <LoaderDots />
        <div className={styles.subtitleModal}>
          Please wait, deploying in progress...
        </div>
      </div>
    </B4aModal>;
    // show 'loading' modal
    this.setState({ modal: loadingModal });
    try {
      await axios(this.getPath(), {
        method: 'post',
        data: { tree },
        withCredentials: true
      })
      // eslint-disable-next-line no-undef
      // back4AppNavigation && back4AppNavigation.deployCloudCodeEvent()
      await this.fetchSource();
      // force jstree component to upload
      await updateTreeContent(this.state.files);
      const successModal = <B4aModal
        type={B4aModal.Types.VALID}
        icon='b4a-success-check'
        iconFill="#27AE60"
        title='Success on deploying your changes!'
        showCancel={false}
        buttonsInCenter={true}
        confirmText='Ok, got it'
        onConfirm={() => this.setState({ modal: null })}
      />;
      this.setState({updatedFiles: [], unsavedChanges: false, modal: successModal });
      this.cloudCodeChanges.clearChanges();
      $('#tree').jstree(true).redraw(true);
      this.fetchSource();
    } catch (err) {
      console.log(err);
      const errorModal = <B4aModal
        type={B4aModal.Types.DANGER}
        icon='b4a-warn-fill-icon'
        iconFill="#cccccc"
        title='Something went wrong'
        showCancel={false}
        textModal={true}
        confirmText='Ok, got it'
        buttonsInCenter={true}
        onConfirm={() => {
          this.setState({ modal: null });
        }}>
        <span style={{ opacity: '0.7' }}>Please try to deploy your changes again.</span>
      </B4aModal>;
      this.setState({
        modal: errorModal
      });
    }
  }

  // method used to fetch the cloud code from app
  async fetchSource() {
    try {
      const response = await axios.get(this.getPath(), { withCredentials: true })
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
    window.open(`/apps/${this.context.slug}/logs/system`, '_blank');
  }

  // override renderSidebar from cloud code to don't show the files name on sidebar
  renderSidebar() {
    return null
  }

  renderContent() {
    let content = null;
    let title = null;
    const footer = null;

    // Show loading page before fetch data
    if (this.state.loading) {
      content = <B4aLoaderContainer loading={true} solid={false}>
        <div className={styles.loading}></div>
      </B4aLoaderContainer>
    } else { // render cloud code page

      title = <B4ACloudCodeToolbar>
        {
          this.state.updatedFiles.length > 0 &&
          <div className={styles.ccStatusIcon}>
            <Icon name="b4a-info-circle" width={16} height={16} fill="#FBFF3B" /> <small>Files pending deploy ({this.state.updatedFiles.length})</small>
          </div>
        }
        <Button
          onClick={this.onLogClick}
          value="Logs"
          width='20'
          additionalStyles={{ minWidth: '70px', background: 'transparent', color: '#f9f9f9', marginRight: '20px', height: '40px', borderColor: 'rgba(249, 249, 249, 0.06)' }}
        />
        <Button
          onClick={this.uploadCode.bind(this)}
          value={
            <div className={styles['b4a-cc-deploy-btn']}>Deploy</div>
          }
          primary={true}
          width='20'
          additionalStyles={{ height: '40px' }}
          eventName='CloudCode Deploy'
        />
      </B4ACloudCodeToolbar>

      content = <B4ACodeTree
        setUpdatedFile={(updatedFiles) => this.setState({ updatedFiles })}
        files={this.state.files}
        parentState={this.setState.bind(this)}
        currentApp={this.context}
        cloudCodeChanges={this.cloudCodeChanges}
      />
    }

    return (
      <div className={`${styles.source} ${styles['b4a-source']}`} >
        {title}
        {content}
        {this.state.modal}
      </div>
    );
  }
}

export default B4ACloudCode;
