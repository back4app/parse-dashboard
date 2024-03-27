/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import B4AAlert from 'components/B4AAlert/B4AAlert.react';
import CategoryList from 'components/CategoryList/CategoryList.react';
import DashboardView from 'dashboard/DashboardView.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import React from 'react';
import ReleaseInfo from 'components/ReleaseInfo/ReleaseInfo';
import Toolbar from 'components/Toolbar/Toolbar.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import Icon from 'components/Icon/Icon.react';
import ServerLogsView  from 'components/ServerLogsView/ServerLogsView.react';
import { withRouter } from 'lib/withRouter';

import styles from 'dashboard/Data/Logs/Logs.scss';

const alertWhatIsMessage = (
  <div>
    <p style={{ height: 'auto' }}>
      Here you will find a detailed extract of all requests made to your server,
      including the request time, type, response time, size, and more. Check our{' '}
      <a
        href="https://www.back4app.com/docs/platform/parse-server-logs"
        target="_blank"
        rel="noopener noreferrer"
      >
        doc
      </a>{' '}
      to know more about the logs.
    </p>
  </div>
);

@withRouter
export default class AccessLogs extends DashboardView {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Logs';

    this.state = {
      loading: false,
      logs: '',
      release: undefined,
      showWhatIs: localStorage.getItem('showAccessLogsBox') !== 'false'
    };

    this.refreshLogs = this.refreshLogs.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
  }

  componentDidMount() {
    this.fetchLogs(this.context);
    // this.fetchRelease(this.context);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      // check if the changes are in currentApp serverInfo status
      // if not return without making any request
      if (this.props.apps !== nextProps.apps) {
        const updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.match.params.appId);
        const prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.match.params.appId);
        const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
        if (!shouldUpdate) {return;}
      }
      this.fetchLogs(nextContext);
      // this.fetchRelease(nextContext.currentApp);
    }
  }

  fetchLogs(app) {
    // set loading true
    this.setState({
      loading: true
    });
    app.fetchServerLogs().then(
      res => {
        this.setState({
          logs: res.access,
          loading: false
        });
      },
      err => this.setState({ logs: '', loading: false })
    );
  }

  refreshLogs(e) {
    e.preventDefault();
    this.fetchLogs(this.context);
  }

  // As parse-server doesn't support (yet?) versioning, we are disabling
  // this call in the meantime.

  /*
  fetchRelease(app) {
    app.getLatestRelease().then(
      ({ release }) => this.setState({ release }),
      () => this.setState({ release: null })
    );
  }
  */

  renderSidebar() {
    const { pathname } = this.props.location;
    const current = pathname.substr(pathname.lastIndexOf('/') + 1, pathname.length - 1);
    return (
      <CategoryList current={current} linkPrefix={'logs/'} categories={[
        { name: 'System', id: 'system' },
        { name: 'Info', id: 'info' },
        { name: 'Error', id: 'error' },
        { name: 'Access', id: 'access' },
      ]} />
    );
  }

  handleAlertClose() {
    localStorage.setItem('showAccessLogsBox', false);
    this.setState({
      showWhatIs: false
    });
  }

  renderContent() {

    let refreshIconStyles = styles.toolbarButton;
    if (this.state.loading) {
      refreshIconStyles += ` ${styles.toolbarButtonDisabled}`;
    }
    let toolbar = null;
    toolbar = (
      <Toolbar
        section='Cloud Code'
        subsection='Logs > Access'
        details={ReleaseInfo({ release: this.state.release })}
      >
        <a className={refreshIconStyles} onClick={!this.state.loading ? this.refreshLogs : undefined} title='Refresh'>
          <Icon name='b4a-refresh-icon' width={18} height={18} />
        </a>
      </Toolbar>
    );
    let content = null;
    const alertWhatIs = (
      <B4AAlert
        show={this.state.showWhatIs}
        handlerCloseEvent={this.handleAlertClose}
        title="What are Access Logs"
        description={alertWhatIsMessage}
      />
    );
    content = (
      <B4aLoaderContainer loading={this.state.loading} solid={false}>
        <div className={styles.content}>
          {!this.state.loading && this.state.logs === '' && (
            <div style={{ padding: '1.5rem 0' }}>
              <B4aEmptyState
                title="No Access logs in the last 30 days"
                description="Here you will find a detailed extract of all requests made to your server, including the request time, type, response time, size, and more."
                cta="Learn more"
                action={'https://www.back4app.com/docs/platform/parse-server-logs'}
              />
            </div>
          )}
          {!this.state.loading && this.state.logs !== '' && (
            <div>
              {alertWhatIs}
              <ServerLogsView type="access" logs={this.state.logs} />
            </div>
          )}
        </div>
      </B4aLoaderContainer>
    );

    return (
      <div>
        {content}
        {toolbar}
      </div>
    );
  }
}
