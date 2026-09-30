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
import AppPlanCard from './AppPlanCard.react';
import AppSecurityCard from './AppSecurityCard.react';
import AppPerformanceCard from './AppPerformanceCard.react';
import AppLoadingText from './AppLoadingText.react';
import B4aTooltip from 'components/Tooltip/B4aTooltip.react';
import OnboardingBoxes from './OnboardingBoxes.react';
import AccountManager from 'lib/AccountManager';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import AppOverviewActions from './AppOverviewActions.react';
import ComplianceCard from './ComplianceCard.react';
import { Link } from 'react-router-dom';

import GetConnected from './GetConnected.react';
import { openConnect } from './connectEvents';

// Copy button with a "Copied!" tooltip, for the App ID and the API URL.
const CopyValue = ({ value }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <B4aTooltip value={'Copied!'} visible={copied} placement='top' theme='dark'>
      <div className={styles.copyValue} onClick={copy}>
        <Icon name={copied ? 'b4a-check-icon' : 'b4a-copy-icon'} fill={copied ? '#27AE60' : '#15A9FF'} width={14} height={14} />
      </div>
    </B4aTooltip>
  );
};

// One column of the facts row: small label, the value, and an optional action
// or note under it.
// A missing value shows as a dash rather than an empty column.
const AppFact = ({ label, children, extra, copy }) => (
  <div className={styles.appFact}>
    <div className={styles.appFactLabel}>{label}</div>
    <div className={styles.appFactValue} title={typeof children === 'string' ? children : undefined}>
      <span className={styles.appFactText}>{children || <span className={styles.greyText}>—</span>}</span>
      {copy ? <CopyValue value={copy} /> : null}
    </div>
    {extra ? <div className={styles.appFactExtra}>{extra}</div> : null}
  </div>
);

@withRouter
class AppOverview extends DashboardView {
  constructor() {
    super();
    this.section = 'Overview';
    this.noteTimeout = null;

    const user = AccountManager.currentUser();

    this.state = {
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

      // Performance card global time limit
      globalTimeLimit: '60',


      isLoadingWebhosting: true,
      webhosting: undefined,
      webhostingError: undefined,

      currentUser: user,
    };
    this.loadCardInformation = this.loadCardInformation.bind(this);
    this.pollSchemas = this.pollSchemas.bind(this);
    this.handleLimitChange = this.handleLimitChange.bind(this);
  }

  componentWillMount() {
    amplitudeLogEvent('At App Overview - Backend');
    this.loadCardInformation();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextContext.applicationId !== this.context.applicationId) {
      this.setState({
        isLoadingServerLogs: true,
        isLoadingAppPlanData: true,
        isLoadingSecurityReport: true,
        isLoadingAvgResponseTime: true,
        isLoadingResponseStatus: true,
        isLoadingSlowQueries: true,
      });
      this.loadCardInformation(nextContext);
    }
  }

  handleLimitChange(type, value) {
    console.log(`Changing global limit to ${value} minutes`);
    this.setState({
      globalTimeLimit: value
    }, () => {
      // Recarregar todos os dados com o novo limite
      this.loadAllPerformanceData(this.context, value);
    });
  }

  loadAllPerformanceData(currentApp, limit) {
    const minutes = parseInt(limit);

    // Load Average Response Time
    this.setState({ isLoadingAvgResponseTime: true });
    currentApp.fetchAvgResponseTime(minutes).then(res => this.setState({
      isLoadingAvgResponseTime: false,
      avgResponseTime: res.avgResTime
    })).catch(err => this.setState({
      isLoadingAvgResponseTime: false,
      avgResponseTime: new Error(err.message || err.msg || 'Something went wrong')
    }));

    // Load Response Status
    this.setState({ isLoadingResponseStatus: true });
    currentApp.fetchRequestStatus(minutes).then(res => this.setState({
      isLoadingResponseStatus: false,
      responseStatus: res
    })).catch(err => this.setState({
      isLoadingResponseStatus: false,
      responseStatus: new Error(err.message || err.msg || 'Something went wrong')
    }));

    // Load Slow Queries
    this.setState({ isLoadingSlowQueries: true });
    const fromDate = new Date(Date.now() - (minutes * 60 * 1000));
    const toDate = new Date();
    const { promise } = currentApp.getAnalyticsSlowQueries({
      path: '',
      method: '',
      respStatus: '',
      respTime: '',
      from: fromDate,
      to: toDate
    });
    promise.then(res => this.setState({
      isLoadingSlowQueries: false,
      slowQueries: res
    })).catch(err => this.setState({
      isLoadingSlowQueries: false,
      slowQueries: new Error(err.message || err.msg || 'Something went wrong')
    }));
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

    // Load performance data with current global limit
    this.loadAllPerformanceData(currentApp, this.state.globalTimeLimit);

    // load webhosting information
    currentApp.getCustomDomain().then(res => this.setState({
      isLoadingWebhosting: false,
      webhosting: res,
      webhostingError: undefined
    })).catch(err => this.setState({
      isLoadingWebhosting: false,
      webhosting: undefined,
      webhostingError: new Error(err.message || err.msg || 'Something went wrong')
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
    const { isLoadingAppPlanData, appPlanData } = this.state;
    // Same rule as before: the version shows on Free plans or once on MongoDB 8.0.
    const showDatabaseVersion = (!isLoadingAppPlanData && !(appPlanData instanceof Error) && /Free/i.test(appPlanData.planName))
      || this.context.databaseVersion === '8.0';
    const webhost = this.state.webhosting?.hostSettings?.webhost;
    const database = [this.context.databaseType, showDatabaseVersion && this.context.databaseVersion].filter(Boolean).join(' ');
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>Overview</div>
        </div>
        <div className={styles.content}>
          <AppLoadingText appName={this.context.name} appId={this.context.applicationId} pollSchemas={this.pollSchemas} />

          {/* The app at a glance: name + App ID + Actions on top, then one row
              of facts. The keys live in Get connected → Keys. */}
          <div className={styles.appSummary}>
            <div className={styles.appSummaryHead}>
              <div className={styles.appSummaryTitle}>
                <div className={styles.appSummaryName}>{this.context.name}</div>
                <div className={styles.appSummaryId}>
                  <span className={styles.greyText}>App ID</span>
                  <code>{this.context.applicationId}</code>
                  <CopyValue value={this.context.applicationId} />
                </div>
              </div>
              <AppOverviewActions
                appUrlName={this.context.slug}
                context={this.context}
              />
            </div>
            <div className={styles.appFacts}>
              <AppFact label="Parse Server">{this.context.parseVersion}</AppFact>
              <AppFact
                label="Database"
                extra={this.context.isMongoUpgradeAvailable && showDatabaseVersion ? (
                  // One button like the other facts' actions; the explanation
                  // moves to its tooltip so the column stays one line tall.
                  <a className={styles.changeRegionLink} title="MongoDB 8.0 is available when you upgrade your plan" onClick={() => amplitudeLogEvent('On Click - MongoDB 8.0 Upgrade Button')} href={`https://www.back4app.com/pricing/backend-as-a-service?appId=${this.context.applicationId}&type=parse`} target="_blank" rel="noopener noreferrer">Upgrade to 8.0</a>
                ) : null}
              >
                {database}
              </AppFact>
              <AppFact label="API URL" copy={this.context.serverURL}>{this.context.serverURL}</AppFact>
              <AppFact
                label="Hosting Region"
                extra={<a className={styles.changeRegionLink} onClick={() => amplitudeLogEvent('On Click - Change Hosting Region Button')} href={`https://back4app.typeform.com/to/kMjTovFj?appId=${this.context.applicationId}`} target="_blank" rel="noopener noreferrer">Change</a>}
              >
                {this.context.region}
              </AppFact>
              <AppFact
                label="Web Hosting"
                extra={this.state.isLoadingWebhosting ? null : (
                  <Link className={styles.changeRegionLink} to={`/apps/${this.context.slug}/domain-settings`}>
                    {webhost ? (this.state.webhosting.domains.length > 0 ? 'Domain Settings' : 'Add custom domain') : 'Configure'}
                  </Link>
                )}
              >
                {this.state.isLoadingWebhosting
                  ? <Icon name="status-spinner" width="16px" height="16px" fill="#1377B8" className={styles.spinnerStatus} />
                  : webhost
                    ? <a className={styles.webhostingLink} href={`https://${webhost}`} target="_blank" rel="noopener noreferrer">{webhost}</a>
                    : <span className={styles.greyText}>Not configured</span>}
              </AppFact>
            </div>
          </div>
          <GetConnected onOpen={openConnect} />

          <ComplianceCard loading={this.state.isLoadingAppPlanData} planData={this.state.appPlanData} appId={this.context.applicationId} isSignedBAA={this.context.custom.isSignedBAA} />

          <OnboardingBoxes  currentUser={AccountManager.currentUser()} slug={this.context.slug} appName={this.context.name} appId={this.context.applicationId} openConnectModal={() => openConnect('sdk')} />

          {/* System Logs Card */}
          <SystemLogsCard loading={this.state.isLoadingServerLogs} logs={this.state.serverLogs} appSlug={this.context.slug} />

          <AppPerformanceCard
            isLoadingAvgResponseTime={this.state.isLoadingAvgResponseTime}
            avgResponseTime={this.state.avgResponseTime}
            isLoadingResponseStatus={this.state.isLoadingResponseStatus}
            responseStatus={this.state.responseStatus}
            isLoadingSlowQueries={this.state.isLoadingSlowQueries}
            slowQueries={this.state.slowQueries}
            handleLimitChange={this.handleLimitChange}
            globalTimeLimit={this.state.globalTimeLimit}
          />

          <div className={styles.cardsContainer}>
            {/* App plan card */}
            <AppPlanCard loading={this.state.isLoadingAppPlanData} planData={this.state.appPlanData} appSlug={this.context.slug} />
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

              <a href={`https://dashboard.back4app.com/apidocs/${this.context.applicationId}`} target="_blank" rel="noopener noreferrer">
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

              <a href="https://join.slack.com/t/back4appcommunity/shared_invite/zt-32f7hyyz6-MB4DUQbqJ2QAdbFexKE9XA" target="_blank" rel="noopener noreferrer">
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
