/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import Icon from 'components/Icon/Icon.react';
import React, { useState } from 'react';
import TableHeader from 'components/Table/TableHeader.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';
import { withRouter } from 'lib/withRouter';
import B4aNotification from 'dashboard/Data/Browser/B4aNotification.react';
import styles from './Deployments.scss';
import DashboardView from 'dashboard/DashboardView.react';
import stylesTable from 'dashboard/TableView.scss';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';


@withRouter
class Deployments extends DashboardView {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Deployments';
    this.state = {
      loading: true,
      releases: [],
      pagination: {
        limit: 10,
        hasMore: false,
        nextCursor: null,
        prevCursor: null,
        sort: 'desc',
      },
      totalReturned: 0,
      notification: null,
      isRollingBack: false,
      loadingMore: false,
    };
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
    this.loadData(true);
  }

  loadData(refresh = false) {
    const isRefresh = refresh || this.state.releases.length === 0;
    this.setState({ loading: isRefresh, loadingMore: !isRefresh });

    const cursor = isRefresh ? null : this.state.pagination.nextCursor;
    const limit = this.state.pagination.limit;
    const sort = this.state.pagination.sort;

    this.context.fetchDeployments(limit, cursor, sort).then(data => {
      const newReleases = isRefresh ? data.data : [...this.state.releases, ...data.data];

      this.setState({
        releases: newReleases,
        loading: false,
        loadingMore: false,
        pagination: {
          ...this.state.pagination,
          hasMore: data.pagination?.hasMore || false,
          nextCursor: data.pagination?.nextCursor || null,
        },
        totalReturned: data.pagination?.totalReturned || newReleases.length,
        currentRelease: data.currentDeployment,
      });
    }).catch(error => {
      console.error('Error fetching deployments:', error);
      this.setState({ loading: false, loadingMore: false, error: error.message });
    });
  }

  loadMore() {
    if (!this.state.loadingMore && this.state.pagination.hasMore) {
      this.loadData(false);
    }
  }

  handleRollback(releaseId) {
    this.setState({ isRollingBack: true });
    return this.context.rollbackDeployment(releaseId).then((response) => {
      if (response.success) {
        this.setState({
          notification: {
            message: 'Rollback successful!',
            isErrorNote: false
          }
        });
      } else {
        this.setState({
          notification: {
            message: response.message || response.error || 'Rollback failed!',
            isErrorNote: true
          }
        });
      }
      this.loadData();
      setTimeout(() => {
        this.setState({
          notification: null
        });
      }, 3500);
    }).catch(error => {
      console.error('Rollback failed:', error);
      this.setState({
        notification: {
          message: error || 'Rollback failed!',
          isErrorNote: true
        }
      });
      setTimeout(() => {
        this.setState({
          notification: null
        });
      }, 3500);
    }).finally(() => {
      this.setState({ isRollingBack: false });
    });
  }

  renderToolbar() {
    return (
      <Toolbar section="Cloud Code" subsection="Deployments" >
        <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>
      </Toolbar>
    );
  }

  renderRow(data) {
    const value = data;
    return (
      <ReleaseRow
        value={value}
        isCurrentRelease={value.releaseId === this.state.currentRelease.releaseId}
        isHistory={value.releaseId === this.state.currentRelease.releaseId && this.state.releases.length > 1}
        handleRollback={this.handleRollback.bind(this)}
        isLoading={this.state.isRollingBack}
      />
    );
  }

  renderHeaders() {
    return [
      <TableHeader key="Version" width={10}>
        Version
      </TableHeader>,
      <TableHeader key="Date" width={20}>
        Date
      </TableHeader>,
      <TableHeader key="Description" width={70}>
        Description
      </TableHeader>,
    ];
  }

  renderEmpty() {
    return (
      <B4aEmptyState
        title="No deployments found"
        description="Deploy your code to the cloud"
        icon="b4a-app-settings-icon"
        cta="Create your first deployment"
        action={() => this.props.navigate(`/apps/${this.props.params.appId}/cloud_code`)}
      />
    );
  }

  renderExtras() {
    const loadMoreButton = this.state.pagination.hasMore && (
      <button
        className={styles.loadMoreButton}
        onClick={() => this.loadMore()}
        disabled={this.state.loadingMore}
      >
        {this.state.loadingMore ? 'Loading...' : 'Load More'}
      </button>
    );

    return (
      <>
        {this.state.notification?.message && (
          <B4aNotification
            note={this.state.notification.message}
            isErrorNote={this.state.notification.isErrorNote}
          />
        )}
        {loadMoreButton}
      </>
    );
  }

  tableData() {
    return this.state.releases;
  }

  renderContent() {
    const toolbar = this.renderToolbar();
    const data = this.tableData();
    let content = null;
    let headers = null;
    if (data !== undefined) {
      if (!Array.isArray(data)) {
        console.warn('tableData() needs to return an array of objects');
      } else {
        if (data.length === 0) {
          content = <div className={stylesTable.empty}>{this.renderEmpty()}</div>;
        } else {
          content = (
            <div className={stylesTable.rows}>
              <table>
                <tbody>{data.map(row => this.renderRow(row))}</tbody>
              </table>
            </div>
          );
          headers = this.renderHeaders();
        }
      }
    }
    const extras = this.renderExtras ? this.renderExtras() : null;
    const loading = this.state ? this.state.loading : false;
    return (
      <div>
        <B4aLoaderContainer loading={loading}>
          <div className={stylesTable.content}>
            {content}
            {extras}
          </div>
        </B4aLoaderContainer>
        {toolbar}
        <div className={stylesTable.headers}>{headers}</div>
      </div>
    );
  }
}

export default Deployments;


const ReleaseRow = ({ value, isCurrentRelease, isHistory, handleRollback, isLoading }) => {
  const [startRollingBack, setStartRollingBack] = useState(false);
  const onClick = () => {
    setStartRollingBack(true);
    handleRollback(value._id).finally(() => {
      // setStartRollingBack(false);
    });
  };
  return (
    <>
      {isCurrentRelease && (
        <tr key={`${Math.random()}`}>
          <td className={styles.subHeader} colSpan={3}>
              Current
          </td>
        </tr>
      )}
      <tr key={value.releaseId} className={`${styles.row} ${startRollingBack ? styles.rollingBack : ''}`  }>
        <td style={{ width: '10%' }}>
          {value.releaseId}
        </td>
        <td style={{ width: '20%' }}>
          {new Date(value.deployedAt).toLocaleString()}
        </td>
        <td style={{ width: '70%' }}>
          <div className={styles.descriptionContainer}>
            <div className={styles.description}>{value.description}</div>
            {!isCurrentRelease && (
              <button
                className={`${styles.rollbackButton} ${startRollingBack || isLoading ? styles.disabledRollbackButton : ''}`}
                onClick={onClick}
                disabled={startRollingBack || isLoading}
              >
                {startRollingBack ? 'Rolling back...' : 'Rollback'}
              </button>
            )}
          </div>
        </td>
      </tr>

      {isHistory && (
        <tr key={`${Math.random()}`}>
          <td className={styles.subHeader} colSpan={3}>
              History
          </td>
        </tr>
      )}
    </>
  );
};
