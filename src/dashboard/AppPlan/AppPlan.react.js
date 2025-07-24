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
import B4aToggle from 'components/Toggle/B4aToggle.react';
import Icon from 'components/Icon/Icon.react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

const prices = [
  {
    id: 0,
    name: 'MVP',
    desc: 'Validate Ideas Quickly — Launch Fast on Our Managed Serverless Backend',
    pricePerMonth: '25',
    monthlyPlanId: 'gXGhzlMHZ6',
    pricePerYear: '15',
    annuallyPlanId: 'nUAySI815X',
    priceTag: 'Per App / Month',
    savePercent: '40%',
    details: [
      {
        number: '500 K',
        text: 'Requests',
      },
      {
        number: '1 GB',
        text: 'Data Storage',
      },
      {
        number: '250 GB',
        text: 'Data Transfer',
      },
      {
        number: '50 GB',
        text: 'File Storage',
      },
      {
        text: 'Daily Backups',
      },
    ],
    icon: 'b4a-security-shield'
  },
  {
    id: 1,
    name: 'Pay As You Go',
    desc: 'Run & Scale Applications on a Serverless Infrastructure',
    pricePerMonth: '100',
    monthlyPlanId: '7xWmyzNUvZ',
    pricePerYear: '80',
    annuallyPlanId: 'YfX9ryk4UH',
    priceTag: 'Per App / Month',
    savePercent: '20%',
    details: [
      {
        number: '5 M',
        text: 'Requests',
      },
      {
        number: '3 GB',
        text: 'Data Storage',
      },
      {
        number: '1 TB',
        text: 'Data Transfer',
      },
      {
        number: '250 GB',
        text: 'File Storage',
      },
      {
        text: 'Daily Backups',
      },
      {
        text: 'SOC 2 and ISO 27001',
      },
    ],
    icon: 'b4a-security-shield'
  },
  {
    id: 2,
    name: 'Dedicated',
    desc: 'Production-Grade Speed, Isolation & Flexibility on Dedicated Resources',
    pricePerMonth: '500',
    monthlyPlanId: 'VGaDTCDNbi',
    pricePerYear: '400',
    annuallyPlanId: 'U8nRA9rxdD',
    priceTag: 'Per App / Month',
    savePercent: '20%',
    details: [
      {
        text: 'Unlimited Requests',
      },
      {
        number: '10 CPUs / 14 GB',
      },
      {
        number: '8 GB',
        text: 'Data Storage',
      },
      {
        number: '2 TB',
        text: 'Data Transfer',
      },
      {
        number: '1 TB',
        text: 'File Storage',
      },
      {
        text: 'Point-in-Time Backups',
      },
      {
        text: 'SOC 2 and ISO 27001',
      },
      {
        text: 'HIPAA After BAA Signed',
      },
    ],
    icon: 'b4a-security-shield'
  },
];


@withRouter
class AppPlan extends DashboardView {
  constructor() {
    super();
    this.section = 'Plan Usage';
    this.state = {
      isLoadingAppPlanData: true,
      appPlanData: null,
      appPlanError: null,
      selectedPlan: prices[1],
      billingCycle: 0, // 0 --> monthly || 1 --> annually
      isLoadingPaddle: false,
      paddleError: null,
      paddle: null
    };
    this.onRefresh = this.onRefresh.bind(this);
    this.handleOnClickPlan = this.handleOnClickPlan.bind(this);
  }

  componentWillMount() {
    this.loadData();
    Paddle.Environment.set('sandbox');
    initializePaddle({ environment: 'sandbox', token: '' }).then(
      (paddleInstance) => {
        if (paddleInstance) {
          this.setState({ paddle: paddleInstance });
        }
      },
    );
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

  handleOnClickPlan(plan) {
    this.setState({ selectedPlan: plan });
    this.state.paddle?.Checkout.open({
      items: [{ priceId: this.state.billingCycle === 0 ? plan.monthlyPlanId : plan.annuallyPlanId, quantity: 1 }],
    });
  }

  renderContent() {
    const toolbar = this.renderToolbar();

    const loading = this.state.isLoadingAppPlanData;
    const planData = this.state.appPlanData;
    const { selectedPlan, billingCycle } = this.state;

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

        <div className={styles.prices}>
          <div className={styles.pricesHeader}>
            <div className={styles.pricesHeaderTitle}>Choose your plan</div>
            <div className={styles.priceDescription}>Compare all available plans and find the perfect fit for your application needs.</div>
            <B4aToggle
              type={B4aToggle.Types.CUSTOM}
              value={billingCycle === 0 ? 'Monthly' : 'Annually'}
              optionLeft="Annually"
              optionRight="Monthly"
              labelLeft="Annually"
              labelRight="Monthly"
              onChange={level => {
                this.setState({
                  billingCycle: level === 'Annually' ? 1 : 0,
                })
              }}
            />
          </div>
          <div className={styles.priceList}>
            {prices.map((plan, idx) => (
              <PriceCard key={idx} plan={plan} active={selectedPlan.id === plan.id} cycle={billingCycle} onClick={this.handleOnClickPlan.bind(this)} />
            ))}
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


const PriceCard = ({ plan, active, cycle, onClick }) => {
  const { name, pricePerMonth, pricePerYear, monthlyPlanId, annuallyPlanId, priceTag, details } = plan;

  const price = cycle === 0 ? pricePerMonth : pricePerYear;
  const planId = cycle === 0 ? monthlyPlanId : annuallyPlanId;

  return (
    <div className={`${styles.priceCard} ${active ? styles.activePriceCard : ''}`}>
      <div className={styles.priceName}> <Icon name={plan.icon} width={16} height={16} /> {name}</div>
      <div className={styles.planPrice}><span className={styles.planPriceValue}>${price}</span> <span className={styles.planPriceCycle}>/{cycle === 0 ? 'Monthly' : 'Annually'}</span></div>
      <div className={styles.planDetails}>
        {details.slice(0, 3).map((detail, idx) => (
          <div key={idx} className={styles.planDetailText}>{detail.text}</div>
        ))}
      </div>
      <Button className={active ? styles.activeButton : styles.inactiveButton} value={`Choose ${name}`} onClick={() => onClick(plan)} />
    </div>
  );
};
