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

  renderError() {
    const { databaseProfilerError } = this.state;
    if (databaseProfilerError?.message.includes('not found')) {
      return (
        <B4aEmptyState
          title="App Not Found"
          description="The app was not found."
        />
      );
    } else if (databaseProfilerError?.message === 'FREE_PLAN_NOT_SUPPORTED') {
      return (
        <B4aEmptyState
          title="Free Plan Not Supported"
          description="Query Performance Monitor is currently only available for paid plans. Please upgrade to a paid plan to use this feature."
        />
      );
    } else if (databaseProfilerError?.message === 'NOT_SUPPORTED_DATABASE') {
      return (
        <B4aEmptyState
          title="Database Not Supported"
          description="Query Performance Monitor is currently only available for MongoDB databases. Support for other database types will be added in future updates."
        />
      );
    } else if (databaseProfilerError?.message === 'UNAUTHORIZED') {
      return (
        <B4aEmptyState
          title="Unauthorized"
          description="You are not authorized to access the Query Performance Monitor."
        />
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
