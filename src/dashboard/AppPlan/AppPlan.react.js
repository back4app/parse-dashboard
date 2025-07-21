/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { withRouter } from 'lib/withRouter';
import DashboardView from 'dashboard/DashboardView.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import styles from './AppPlan.scss';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import Button from 'components/Button/Button.react';
import { getUsageClassName, formatDate } from './usageClassUtils';


@withRouter
class AppPlan extends DashboardView {
  constructor() {
    super();
    this.section = 'Plan Usage';
    this.state = {
      isLoadingAppPlanData: true,
      appPlanData: null,
      appPlanError: null,
    };
    this.onRefresh = this.onRefresh.bind(this);
  }

  componentWillMount() {
    this.loadData();
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
      // nextProps.config.dispatch(ActionTypes.FETCH);
    }
  }

  onRefresh() {
    this.loadData();
  }

  loadData() {
    this.context.getAppPlanData().then(res => this.setState({
      isLoadingAppPlanData: false,
      appPlanData: res
    })).catch(err => this.setState({
      isLoadingAppPlanData: false,
      appPlanData: new Error(err.message || err.msg || 'Something went wrong')
    }));
  }

  renderToolbar() {
    return (
      <Toolbar section="Plan Usage">
        {/* <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a> */}
      </Toolbar>
    );
  }

  renderContent() {
    const toolbar = this.renderToolbar();

    const loading = this.state.isLoadingAppPlanData;
    const planData = this.state.appPlanData;

    let content = null;
    if (loading) {
      content = null;
    } else if (planData instanceof Error || this.state.appPlanError) {
      content = <EmptyGhostState
        title="Something went wrong"
        description={'Please try again later.'}
        cta="Refresh"
        action={this.onRefresh}
      />
    } else {
      content = <div className={styles.mainContent}>
        <div className={styles.header}>Plan Usage</div>
        <div className={styles.headerSubText}>Track your resource utilization across all features to optimize your app and plan allocation.</div>
        <div className={styles.planUsage}>
          <div className={styles.planUsageHeader}>
            <div className={styles.planNameChip}>{planData.planName}</div>
            <div className={styles.planDates}>
              <div className={styles.planDate}>Valid until: <span className={styles.planDateValue}>{formatDate(planData.planValid)}</span></div>
              <div className={styles.planDate}>Last Update: <span className={styles.planDateValue}>{formatDate(planData.planLastUpdate)}</span></div>
            </div>
          </div>
          <div className={styles.planUsageDetails}>
            <div className={styles.usageLimitsCard}>
              <table className={styles.usageLimitsTable}>
                <thead>
                  <tr>
                    <th className={styles.usageLimitsHeader}>Usage & Limits</th>
                    <th className={styles.usageLimitsHeader}>Used</th>
                    <th className={styles.usageLimitsHeader}>Included</th>
                  </tr>
                </thead>
                <tbody>
                  {/* <tr>
                    <td>Requests/second</td>
                    <td>(N.A.)</td>
                    <td>{planData.apiCallPerSecondLimit}</td>
                  </tr> */}
                  <tr>
                    <td>Total Requests/Month</td>
                    <td className={getUsageClassName(planData.apiCallUsed, planData.apiCallLimit) ? styles[getUsageClassName(planData.apiCallUsed, planData.apiCallLimit)] : undefined}>{planData.apiCallUsed}</td>
                    <td>{planData.apiCallLimit}</td>
                  </tr>
                  <tr>
                    <td>File Storage</td>
                    <td className={getUsageClassName(planData.fileStorageUsed, planData.fileStorageLimit) ? styles[getUsageClassName(planData.fileStorageUsed, planData.fileStorageLimit)] : undefined}>{planData.fileStorageUsed}</td>
                    <td>{planData.fileStorageLimit}</td>
                  </tr>
                  <tr>
                    <td>Database Storage</td>
                    <td className={getUsageClassName(planData.dataStorageUsed, planData.dataStorageLimit) ? styles[getUsageClassName(planData.dataStorageUsed, planData.dataStorageLimit)] : undefined}>{planData.dataStorageUsed}</td>
                    <td>{planData.dataStorageLimit}</td>
                  </tr>
                  <tr>
                    <td>Cloud Code Jobs</td>
                    <td>(N.A.)</td>
                    <td>{planData.maxJobAmount == 1000 ? 'Unlimited' : planData.maxJobAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles.upgradeCard}>
              <div className={styles.upgradeCardHeader}>
                <div className={styles.upgradeCardTitle}>Ready to Scale?</div>
              </div>
              <div className={styles.upgradeCardSubText}>Upgrade for Backups, Resilience & Compliance</div>

              <div className={styles.upgradeFeatures}>
                <div className={styles.upgradeFeaturesTitle}>WHAT YOU GET:</div>
                <div className={styles.upgradeFeaturesList}>
                  <div className={styles.upgradeFeature}>
                    <span className={styles.planName}>MVP:</span> Daily automated backups
                  </div>
                  <div className={styles.upgradeFeature}>
                    <span className={styles.planName}>Pay-as-you-Go:</span> SOC 2 and ISO 27001-certified infrastructure
                  </div>
                  <div className={styles.upgradeFeature}>
                    <span className={styles.planName}>Dedicated:</span> Point-in-time restore & HIPAA-ready
                  </div>
                </div>
              </div>

              <Button primary value={
                <a href={`https://www.back4app.com/pricing/backend-as-a-service?appId=${this.context.applicationId}&type=parse`} style={{ display: 'block', width: '100%'}} target="_blank">Upgrade Now →</a>
              } additionalStyles={{ padding: 0 }} width="100%" />
            </div>
          </div>
        </div>
      </div>
    }

    return (
      <div>
        <B4aLoaderContainer loading={loading}>
          <div className={styles.content}>
            {content}
          </div>
        </B4aLoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default AppPlan;

