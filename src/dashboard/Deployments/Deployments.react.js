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
      console.log('data', data);
      this.setState({ releases: data.data, loading: false, pagination: data.pagination, totalReturned: data.pagination.totalReturned });
    }).catch(error => {
      console.error('Error fetching deployments:', error);
      this.setState({ loading: false, error: error.message });
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
      <tr key={value.releaseId}>
        <td style={{ width: '10%' }}>
          {value.releaseId}
        </td>
        <td style={{ width: '20%' }}>
          {new Date(value.deployedAt).toLocaleString()}
        </td>
        <td style={{ width: '70%' }}>
          <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{value.description}</div>
        </td>
      </tr>
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

  tableData() {
    return this.state.releases;
  }
}

export default Deployments;
