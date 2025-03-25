/* eslint-disable no-undef */
/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import { withRouter } from 'lib/withRouter';
import Icon from 'components/Icon/Icon.react';
import SystemLogsCard from './SystemLogsCard.react';
import AppKeysComponent from './AppKeysComp.react';
import AppPlanCard from './AppPlanCard.react';
import AppSecurityCard from './AppSecurityCard.react';
import AppPerformanceCard from './AppPerformanceCard.react';
import AppLoadingText from './AppLoadingText.react';
import B4aTooltip from 'components/Tooltip/B4aTooltip.react';

@withRouter
class AppOverview extends DashboardView {
  constructor() {
    super();
    this.section = 'Overview';
    this.noteTimeout = null;

    this.state = {
      appKeys: new Map(),
      isLoadingServerLogs: true,
      serverLogs: '',

      isLoadingAppPlanData: true,
      appPlanData: undefined,

      isLoadingSecurityReport: true,
      securityReport: undefined,

      isLoadingAvgResponseTime: true,
      avgResponseTime: undefined,

      isLoadingResponseStatus: true,
      responseStatus: undefined,

      isLoadingSlowQueries: true,
      slowQueries: undefined,

      showCopiedTooltip: false,

    };
    this.copyText = this.copyText.bind(this);
    this.loadCardInformation = this.loadCardInformation.bind(this);
    this.pollSchemas = this.pollSchemas.bind(this);
  }

  componentWillMount() {
    const currentApp = this.context;
    const appKeys = new Map(Object.entries(currentApp).filter(([k]) => k.includes('Key')));
    this.setState({
      appKeys,
    });
    if (currentApp.serverInfo.status === 'SUCCESS') {
    this.loadCardInformation();
  }
  }

  copyText(copyText = '') {
    if (navigator) {
      navigator.clipboard.writeText(copyText);
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextContext.serverInfo.status === 'SUCCESS') {
      this.loadCardInformation(nextContext);
    }
  }

  loadCardInformation(currentApp) {
    currentApp = currentApp ? currentApp : this.context

    // load server logs
    currentApp.fetchServerLogs().then(
      res => {
        this.setState({
          serverLogs: res.docker,
          isLoadingServerLogs: false
        });
      },
      err => this.setState({ serverLogs: new Error(err.message || err.msg || 'Something went wrong'), isLoadingServerLogs: false })
    );

    // load app plan information
    currentApp.getAppPlanData().then(res => this.setState({
      isLoadingAppPlanData: false,
      appPlanData: res
    })).catch(err => this.setState({
      isLoadingAppPlanData: false,
      appPlanData: new Error(err.message || err.msg || 'Something went wrong')
    }));

    // load app security report
    currentApp.getSecurityReport().then(res => this.setState({
      isLoadingSecurityReport: false,
      securityReport: res
    })).catch(err => this.setState({
      isLoadingSecurityReport: false,
      securityReport: new Error(err.message || err.msg || 'Something went wrong')
    }));

    // load slow request count
    const date = new Date();
    const { promise } = currentApp.getAnalyticsSlowQueries({
      path: '',
      method: '',
      respStatus: '',
      respTime: '',
      from: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 31
      ),
      to: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      )
    });
    promise.then(res => this.setState({
      isLoadingSlowQueries: false,
      slowQueries: res
    })).catch(err => this.setState({
      isLoadingSlowQueries: false,
      slowQueries: new Error(err.message || err.msg || 'Something went wrong')
    }));

    currentApp.fetchRequestStatus().then(res => this.setState({
      isLoadingResponseStatus: false,
      responseStatus: res
    })).catch(err => this.setState({
      isLoadingResponseStatus: false,
      responseStatus: new Error(err.message || err.msg || 'Something went wrong')
    }));

    // currentApp.fetchAppHealthStatus().then(res => console.log(res));
    currentApp.fetchAvgResponseTime().then(res => this.setState({
      isLoadingAvgResponseTime: false,
      avgResponseTime: res.avgResTime
    })).catch(err => this.setState({
      isLoadingAvgResponseTime: false,
      avgResponseTime: new Error(err.message || err.msg || 'Something went wrong')
    }));
  }

  async pollSchemas() {
    try {
      const response = await this.context.apiRequest('GET', 'schemas', {}, { useMasterKey: true });
      if (Array.isArray(response.results)) {
        // await new Promise(resolve => setTimeout(resolve, 29_000));
        return true;
      }
    } catch (error) {
      console.error('Error polling schemas:', error);
    }
    return false;
  }

  renderContent() {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>Overview</div>
        </div>
        <div className={styles.content}>
          <AppLoadingText appName={this.context.name} appId={this.context.applicationId} pollSchemas={this.pollSchemas} />

          <div className={styles.appInfoCard}>
            <div className={styles.appKeysBox}>
              <div className={styles.appInfoCardHeader}>{this.context.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#CCC'}}>App ID:</span> {' '}
                  {this.context.applicationId}
                </div>
                <B4aTooltip value={'Copied!'} visible={this.state.showCopiedTooltip} placement='top' theme='dark'>
                  <div style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => {
                    this.copyText(this.context.applicationId);
                    this.setState({ showCopiedTooltip: true });
                    setTimeout(() => {
                      this.setState({ showCopiedTooltip: false });
                    }, 2_000);
                  }}>
                    <Icon name='b4a-copy-icon' fill="#15A9FF" width={14} height={14} />
                  </div>
                </B4aTooltip>
              </div>
              <hr />
              <AppKeysComponent appKeys={this.state.appKeys} copyText={this.copyText} />
              <hr />
              <button className={styles.appContentBtn}>Connect App</button>
            </div>
            <div className={styles.appInformationBox}>
              <div className={styles.appInfoCardHeader}>App Information</div>
              <div className="">
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>Parse Server Version: </span>{this.context.parseVersion}</div>
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>Database: </span>{this.context.databaseType}</div>
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>API URL: </span>{this.context.serverURL}</div>
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>Hosting Region: </span>{this.context.region}</div>
              </div>
            </div>
          </div>

          {/* System Logs Card */}
          <SystemLogsCard loading={this.state.isLoadingServerLogs} logs={this.state.serverLogs} appSlug={this.context.slug} />

          <AppPerformanceCard
            isLoadingAvgResponseTime={this.state.isLoadingAvgResponseTime}
            avgResponseTime={this.state.avgResponseTime}

            isLoadingResponseStatus={this.state.isLoadingResponseStatus}
            responseStatus={this.state.responseStatus}

            isLoadingSlowQueries={this.state.isLoadingSlowQueries}
            slowQueries={this.state.slowQueries}
          />

          <div className={styles.cardsContainer}>
            {/* App plan card */}
            <AppPlanCard loading={this.state.isLoadingAppPlanData} planData={this.state.appPlanData} appId={this.context.applicationId} />
            {/* App Secutiry Card */}
            <AppSecurityCard appId={this.context.slug} loading={this.state.isLoadingSecurityReport} securityReport={this.state.securityReport} />
          </div>

          <div className={styles.docsContainer}>
            <div className={styles.docsHeader}>Docs & Support</div>
            <div className={styles.docsContent}>
              <a href="https://www.back4app.com/docs/get-started/welcome" target="_blank" rel="noopener noreferrer">
                <div className={styles.docsCard}>
                  <div className={styles.docsCardTitle}>Documentation <Icon name="b4a-right-arrrow-icon" fill="#15A9FF" width={16} height={16} /></div>
                  <div className={styles.docsCardDescription}>Guides to help you solve any issues you find.</div>
                </div>
              </a>

              <a href="https://dashboard.back4app.com/apidocs" target="_blank" rel="noopener noreferrer">
                <div className={styles.docsCard}>
                  <div className={styles.docsCardTitle}>API Reference <Icon name="b4a-right-arrrow-icon" fill="#15A9FF" width={16} height={16} /></div>
                  <div className={styles.docsCardDescription}>Learn how to integrate our API.</div>
                </div>
              </a>

              <a href="https://help.back4app.com/hc/en-us/sections/115000201712-FAQ" target="_blank" rel="noopener noreferrer">
                <div className={styles.docsCard}>
                  <div className={styles.docsCardTitle}>FAQ <Icon name="b4a-right-arrrow-icon" fill="#15A9FF" width={16} height={16} /></div>
                  <div className={styles.docsCardDescription}>Most common questions and solutions.</div>
                </div>
              </a>

              <a href="https://join.slack.com/t/back4appcommunity/shared_invite/zt-mul3jkwn-ny7E_6yLIocOmVUjR3mFHQ" target="_blank" rel="noopener noreferrer">
                <div className={styles.docsCard}>
                  <div className={styles.docsCardTitle}>Join B4A Community <Icon name="b4a-right-arrrow-icon" fill="#15A9FF" width={16} height={16} /></div>
                  <div className={styles.docsCardDescription}>Most common questions and solutions.</div>
                </div>
              </a>

              <a href="https://help.back4app.com/hc/en-us/requests/new" target="_blank" rel="noopener noreferrer">
                <div className={styles.docsCard}>
                  <div className={styles.docsCardTitle}>Open a Ticket <Icon name="b4a-right-arrrow-icon" fill="#15A9FF" width={16} height={16} /></div>
                  <div className={styles.docsCardDescription}>Get back from our support team.</div>
                </div>
              </a>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AppOverview;
