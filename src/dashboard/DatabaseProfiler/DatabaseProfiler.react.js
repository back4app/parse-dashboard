/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import React from 'react';
import TableHeader from 'components/Table/TableHeader.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { withRouter } from 'lib/withRouter';
import styles from './DatabaseProfiler.scss';
import DashboardView from 'dashboard/DashboardView.react';
import stylesTable from 'dashboard/TableView.scss';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import Icon from 'components/Icon/Icon.react';
import DatabaseProfilerDetail from './DatabaseProfilerDetail.react';
import { prices } from 'dashboard/AppPlan/AppPlan.react';
import { UpgradeGate } from 'lib/upgradeEvents';
import { UpgradeGateButton } from 'components/UpgradeCheckout/UpgradeCheckout.react';

@withRouter
class DatabaseProfile extends DashboardView {
  constructor() {
    super();
    this.section = 'Advisors';
    this.subsection = 'Database Profiler';
    this.state = {
      isLoadingDatabaseProfiler: true,
      databaseProfiler: [],
      databaseProfilerError: null,
      selectedRowId: null,
      showBackButton: false,
      applicationId: null,
    };
  }

  componentWillMount() {
    this.setState({
      isLoadingDatabaseProfiler: true,
    });
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
        if (!shouldUpdate) { return; }
      }
      // nextProps.config.dispatch(ActionTypes.FETCH);
    }
  }

  onRefresh() {
    this.setState({
      isLoadingDatabaseProfiler: true,
    });
    this.loadData();
  }

  handleRowSelect(id) {
    this.setState(prevState => ({
      selectedRowId: prevState.selectedRowId === id ? null : id,
      showBackButton: true,
    }));
  }

  async loadData() {
    try {
      const queries = await this.context.getDatabaseProfiler();
      this.setState({
        databaseProfiler: queries,
        isLoadingDatabaseProfiler: false,
      });
    } catch (err) {
      this.setState({
        databaseProfilerError: new Error(err.message || err.msg || err || 'Something went wrong'),
      });
    } finally {
      this.setState({ isLoadingDatabaseProfiler: false });
    }
  }

  handleBackClick = () => {
    this.setState({
      selectedRowId: null,
      showBackButton: false
    });
  };

  renderToolbar() {
    const { showBackButton } = this.state;
    return (
      <Toolbar
        section={this.section}
        subsection={this.subsection}
        showBackButton={showBackButton}
        onBackClick={this.handleBackClick}
      >
        <a
          className={styles.toolbarButton}
          onClick={this.onRefresh.bind(this)}
          title="Refresh"
        >
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>
      </Toolbar>
    );
  }

  renderHeaders() {
    return [
      <TableHeader key="OperationType" width={25}>
        Operation Type
      </TableHeader>,
      <TableHeader key="Class" width={25}>
        Class
      </TableHeader>,
      <TableHeader key="ExecutionTime" width={25}>
        Execution Time (ms)
      </TableHeader>,
      <TableHeader key="ExecutedAt" width={25}>
        Executed At (UTC)
      </TableHeader>
    ];
  }

  renderEmpty() {
    return (
      <B4aEmptyState
        title="No Query Data Available"
        description="No database queries have been recorded yet. The Query Performance Monitor will display query metrics once database operations are performed."
      />
    );
  }

  handleComparePlansClick = (applicationId) => {
    window.location.href = `${b4aSettings.BACKEND_DASHBOARD_PATH}/apps/${applicationId}/plan-usage?gate=${UpgradeGate.DB_PROFILER}`;
  };

  renderError() {
    const { databaseProfilerError } = this.state;
    if (databaseProfilerError?.message.includes('not found')) {
      return (
        <B4aEmptyState
          title="App Not Found"
          description="The app was not found."
        />
      );
    } else if (databaseProfilerError?.message === 'PLAN_NOT_SUPPORTED') {
      const dedicatedPlan = prices.find(plan => plan.name === 'Dedicated');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' , marginBottom: '40px'}}>
          <B4aEmptyState
            imgSrc={null}
            title="Upgrade Required"
            description="Query Performance Monitor is available exclusively on Dedicated plans."
          />
          {/* Dedicated plan highlight card */}
          <div style={{
            width: '100%',
            maxWidth: '440px',
            marginTop: 16,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            padding: 24,
          }}>
            {/* Header row: plan name + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                fontWeight: 600,
                color: 'var(--text-primary, #fff)'
              }}>Dedicated</div>
              <span style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(16,185,129,0.15)',
                color: 'rgb(16,185,129)'
              }}>Unlimited requests</span>
            </div>

            {/* Price block */}
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color: 'var(--text-primary, #fff)' }}>${dedicatedPlan.pricePerYear}</div>
              <div style={{ color: 'var(--text-secondary, #a0aec0)', marginTop: 4 }}>per App / Month</div>
              <div style={{ color: 'var(--text-tertiary, #718096)', fontSize: 12 }}>Billed yearly · ${dedicatedPlan.pricePerMonth} monthly</div>
            </div>

            {/* Features list */}
            <div style={{ display: 'grid', rowGap: 8, marginBottom: 16 }}>
              {[
                'Unlimited Requests',
                '10 CPUs / 14 GB',
                '8 GB Data Storage',
                '2 TB Data Transfer',
                '1 TB File Storage',
                'Point-in-Time Backups',
                'SOC 2 and ISO 27001',
              ].map((text, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary, #fff)' }}>
                  <Icon name='b4a-check-icon' width={14} height={14} fill='rgb(16,185,129)' />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Choose plan to entire div with button */}
            <div style={{ display: 'flex', justifyContent: 'center' }} className={styles.upgradeCard}>
              <UpgradeGateButton gate={UpgradeGate.DB_PROFILER} value="Buy now" />
            </div>
          </div>

          {/* Compare plans link */}
          <div style={{ marginTop: 16, color: 'var(--text-tertiary, #a0aec0)' }}>
            Upgrade now to unlock production-grade infrastructure
          </div>
          <div style={{ marginTop: 8 }}>
            <a onClick={() => this.handleComparePlansClick(this.context.slug)} style={{ cursor: 'pointer', color: 'var(--link-color, #60a5fa)' }}>
              Compare all plans
            </a>
          </div>
        </div>
      );
    } else if (databaseProfilerError?.message === 'DATABASE_OUTSIDE_B4A') {
      return (
        <B4aEmptyState
          title="Database Outside Back4app"
          description="The database is not hosted with us, so we can't provide the query performance monitor."
        />
      );
    }
    return (
      <B4aEmptyState
        title="Error loading query monitor"
        description={databaseProfilerError?.message || 'An error occurred while loading the query performance data'}
      />
    );
  }

  renderListView() {
    const { databaseProfiler: data } = this.state;
    return (
      <div className={stylesTable.rows}>
        <table>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                onClick={() => this.handleRowSelect(index)}
                className={styles.row}
              >
                <td style={{ width: '25%' }}>{row.command}</td>
                <td style={{ width: '25%', whiteSpace: 'normal', textOverflow: 'unset' }}>{row.className}</td>
                <td style={{ width: '25%', whiteSpace: 'normal', textOverflow: 'unset' }}>{row.duration}</td>
                <td style={{ width: '25%', whiteSpace: 'normal', textOverflow: 'unset' }}>
                  {new Date(row.ts).toISOString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderDetailView() {
    const { databaseProfiler: data, selectedRowId } = this.state;
    const selectedOperation = data[selectedRowId];

    return (
      <>
        <DatabaseProfilerDetail data={selectedOperation} />
      </>
    );
  }

  renderContent() {
    const { databaseProfilerError, isLoadingDatabaseProfiler, selectedRowId, databaseProfiler: data } = this.state;
    const toolbar = this.renderToolbar();
    let content = null;
    let headers = null;

    // Handle error state
    if (databaseProfilerError) {
      content = this.renderError();
    } else if (!isLoadingDatabaseProfiler) {
      if (!data || !Array.isArray(data) || data.length === 0) {
        content = <div className={stylesTable.empty}>{this.renderEmpty()}</div>;
      } else {
        if (selectedRowId !== null) {
          content = this.renderDetailView();
        } else {
          content = this.renderListView();
          headers = <div className={stylesTable.headers}>{this.renderHeaders()}</div>;
        }
      }
    }

    const extras = this.renderExtras ? this.renderExtras() : null;

    return (
      <div>
        <B4aLoaderContainer loading={isLoadingDatabaseProfiler}>
          <div className={stylesTable.content}>
            {headers}
            {content}
            {extras}
          </div>
        </B4aLoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default DatabaseProfile;
