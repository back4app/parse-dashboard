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
import styles from './AppSecurityReport.scss';
import DashboardView from 'dashboard/DashboardView.react';
import stylesTable from 'dashboard/TableView.scss';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';


@withRouter
class AppSecurityReport extends DashboardView {
  constructor() {
    super();
    this.section = 'Reports';
    this.subsection = 'Security';
    this.state = {
      isLoadingSecurityReport: true,
      securityReport: null,
      securityReportError: null,
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
    this.context.getSecurityReport().then(res => {
      this.setState({
        securityReport: res,
      });
    }).catch(err => {
      this.setState({
        securityReportError: new Error(err.message || err.msg || 'Something went wrong'),
      });
    }).finally(() => {
      this.setState({ isLoadingSecurityReport: false });
    });
  }

  renderToolbar() {
    return (
      <Toolbar section="Reports" subsection="Security" >
        {/* <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a> */}
      </Toolbar>
    );
  }

  renderRow(data) {
    const value = data;

    return (
      <SecurityReportRow
        key={value._id || value.releaseId}
        value={value}
        appId={this.context.slug}
      />
    );
  }

  renderHeaders() {
    return [
      <TableHeader key="Issue Type" width={50}>
        Issue Type
      </TableHeader>,
      <TableHeader key="Description" width={50}>
        Description
      </TableHeader>
    ];
  }

  renderEmpty() {
    return (
      <B4aEmptyState
        title="No security issues found"
        description="No security issues found"
      />
    );
  }

  renderError() {
    return (
      <B4aEmptyState
        title="Error loading security report"
        description="Error loading security report"
      />
    );
  }


  renderContent() {
    const toolbar = this.renderToolbar();
    const data = this.state.securityReport;
    let content = null;
    let headers = null;
    if (data !== undefined) {
      if (!Array.isArray(data)) {
        console.warn('tableData() needs to return an array of objects');
        content = this.renderError();
      } else {
        if (data.length === 0 && !this.state.securityReport) {
          content = <div className={stylesTable.empty}>{this.renderEmpty()}</div>;
        } else {
          content = (
            <div className={stylesTable.rows}>
              <table>
                <tbody>
                  {data.map((row) => this.renderRow(row))}
                </tbody>
              </table>
            </div>
          );
          headers = this.renderHeaders();
        }
      }
    }
    if (this.state.securityReportError) {
      content = this.renderError();
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

export default AppSecurityReport;


const SecurityReportRow = ({ key, value }) => {
  const { title, message } = value;
  return (
    <>
      <tr
        key={key}
        className={`${styles.row}`}
      >
        <td style={{ width: '50%' }}>
          {title}
        </td>
        <td style={{ width: '50%', whiteSpace: 'normal', textOverflow: 'unset' }}>
          {message}
        </td>
      </tr>
    </>
  );
};
