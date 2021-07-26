/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import B4AAlert        from 'components/B4AAlert/B4AAlert.react';
import CategoryList    from 'components/CategoryList/CategoryList.react';
import DashboardView   from 'dashboard/DashboardView.react';
import EmptyState      from 'components/EmptyState/EmptyState.react';
import LogView         from 'components/LogView/LogView.react';
import LogViewEntry    from 'components/LogView/LogViewEntry.react';
import React           from 'react';
import ReleaseInfo     from 'components/ReleaseInfo/ReleaseInfo';
import Toolbar         from 'components/Toolbar/Toolbar.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import Icon            from 'components/Icon/Icon.react';

import styles          from 'dashboard/Data/Logs/Logs.scss';

let subsections = {
  access: 'Access',
  info: 'Info',
  error: 'Error',
  system: 'System'
};

let alertWhatIsMessage = (
  <div>
    <p style={{ height: "auto" }}>
      In this section, you will track general Parse Server errors. For example,
      when the user hasn’t defined its password correctly, Parse Server will log
      an error message here. Check our{" "}
      <a
        href="https://www.back4app.com/docs/platform/parse-server-logs"
        target="_blank"
        rel="noopener noreferrer"
      >
        doc
      </a>{" "}
      to know more about the logs.
    </p>
  </div>
);
export default class InfoLogs extends DashboardView {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Logs';

    this.state = {
      loading: false,
      logs: [],
      release: undefined,
      showWhatIs: localStorage.getItem('showErrorLogsBox') !== 'false'
    };

    this.refreshLogs = this.refreshLogs.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
  }

  componentDidMount() {
    this.fetchLogs(this.context.currentApp);
    // this.fetchRelease(this.context.currentApp);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      this.fetchLogs(nextContext.currentApp);
      // this.fetchRelease(nextContext.currentApp);
    }
  }

  fetchLogs(app) {
    // set loading true
    this.setState({
      loading: true
    });
    
    app.getLogs('ERROR').then(
      (logs) => {
        this.setState({ logs, loading: false });
      },
      () => this.setState({ logs: [], loading: false })
    );
  }

  refreshLogs(e) {
    e.preventDefault();
    this.fetchLogs(this.context.currentApp);
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
    let { path } = this.props.match;
    const current = path.substr(path.lastIndexOf("/") + 1, path.length - 1);
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
    localStorage.setItem('showErrorLogsBox', false);
    this.setState({
      showWhatIs: false
    });
  }

  renderContent() {
    // Send track event
    back4AppNavigation && back4AppNavigation.atParseLogsEvent()

    let refreshIconStyles = styles.toolbarButton;
    if (this.state.loading) {
      refreshIconStyles += ` ${styles.toolbarButtonDisabled}`;
    }
    let toolbar = null;
    toolbar = (
      <Toolbar
        section='Logs'
        subsection='Error'
        details={ReleaseInfo({ release: this.state.release })}
        >
        <a className={refreshIconStyles} onClick={!this.state.loading ? this.refreshLogs : undefined} title='Refresh'>
          <Icon name='refresh' width={30} height={26} />
        </a>
      </Toolbar>
    );
    let content = null;
    let alertWhatIs = (
      <B4AAlert
        show={this.state.showWhatIs}
        handlerCloseEvent={this.handleAlertClose}
        title="What are Error Logs"
        description={alertWhatIsMessage}
      />
    );
    content = (
      <LoaderContainer loading={this.state.loading} solid={false}>
        <div className={styles.content}>
          {!this.state.loading && this.state.logs.length === 0 && (
            <EmptyState
              icon="files-outline"
              title="No Error logs in the last 30 days"
              description="In this section, you will track general Parse Server errors. For example, when the user hasn’t defined its password correctly, Parse Server will log an error message here."
              cta="Learn more"
              action={"https://www.back4app.com/docs/platform/parse-server-logs"}
            />
          )}
          {!this.state.loading && this.state.logs.length !== 0 && (
            <div>
              {alertWhatIs}
              <LogView>
                {this.state.logs.map(({ message, timestamp }) => (
                  <LogViewEntry
                    key={timestamp}
                    text={message}
                    timestamp={timestamp}
                  />
                ))}
              </LogView>
            </div>
          )}
        </div>
      </LoaderContainer>
    );
    
    return (
      <div>
        {content}
        {toolbar}
      </div>
    );
  }
}
