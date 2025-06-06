/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import Icon from 'components/Icon/Icon.react';
import React from 'react';
import TableHeader from 'components/Table/TableHeader.react';
import TableView from 'dashboard/TableView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';
import { withRouter } from 'lib/withRouter';
import B4aNotification from 'dashboard/Data/Browser/B4aNotification.react';
import styles from './Deployments.scss';

@withRouter
class Deployments extends TableView {
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
      notification: null
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
    this.loadData();
  }

  loadData() {
    this.setState({ loading: true });
    this.context.fetchDeployments().then(data => {
      this.setState({ releases: data.data, loading: false, pagination: data.pagination, totalReturned: data.pagination.totalReturned, currentRelease: data.data[0] });
    }).catch(error => {
      console.error('Error fetching deployments:', error);
      this.setState({ loading: false, error: error.message });
    });
  }

  handleRollback(releaseId) {
    this.context.rollbackDeployment(releaseId).then((response) => {
      if (response.success) {
        this.setState({
          notification: {
            message: 'Rollback successful',
            isErrorNote: false
          }
        });
      } else {
        this.setState({
          notification: {
            message: 'Rollback failed!',
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
          message: 'Rollback failed!',
          isErrorNote: true
        }
      });
      setTimeout(() => {
        this.setState({
          notification: null
        });
      }, 3500);
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
      <>
        {value.releaseId === this.state.currentRelease.releaseId && (
          <tr>
            <td className={styles.subHeader} colSpan={3}>
              Current
            </td>
          </tr>
        )}
        <tr key={value.releaseId} className={styles.row}>
          <td style={{ width: '10%' }}>
            {value.releaseId}
          </td>
          <td style={{ width: '20%' }}>
            {new Date(value.deployedAt).toLocaleString()}
          </td>
          <td style={{ width: '70%' }}>
            <div className={styles.descriptionContainer}>
              <div className={styles.description}>{value.description}</div>
              <button
                className={styles.rollbackButton}
                onClick={() => this.handleRollback(value._id)}
              >
                Rollback
              </button>
            </div>
          </td>
        </tr>

        {value.releaseId === this.state.currentRelease.releaseId && this.state.releases.length > 1 &&  (
          <tr>
            <td className={styles.subHeader} colSpan={3}>
              History
            </td>
          </tr>
        )}
      </>
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
        action={() => this.props.navigate(`/apps/${this.props.match.params.appId}/cloud_code`)}
      />
    );
  }

  renderExtras() {
    return (
      <B4aNotification
        message={this.state.notification?.message}
        isErrorNote={this.state.notification?.isErrorNote}
      />
    );
  }

  tableData() {
    return this.state.releases;
  }
}

export default Deployments;
