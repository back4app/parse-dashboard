/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as AnalyticsQueryStore from 'lib/stores/AnalyticsQueryStore';
import * as SchemaStore from 'lib/stores/SchemaStore';
import Button from 'components/Button/Button.react';
import CategoryList from 'components/CategoryList/CategoryList.react';
import EmptyState from 'components/EmptyState/EmptyState.react';
import FlowFooter from 'components/FlowFooter/FlowFooter.react';
import Icon from 'components/Icon/Icon.react';
import React from 'react';
import SlowQueriesFilter from 'components/SlowQueriesFilter/SlowQueriesFilter.react';
import styles from 'dashboard/Analytics/SlowQueries/SlowQueries.scss';
import subscribeTo from 'lib/subscribeTo';
import TableHeader from 'components/Table/TableHeader.react';
import TableView from 'dashboard/TableView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { withRouter } from 'lib/withRouter';

const SLOW_QUERIES_HEADERS = ['#', 'Date Time', 'Method', 'Path', 'Parameters', 'Resp. Status', 'Resp. Time (ms)'];
const TABLE_WIDTH = [5, 17, 8, 25, 25, 10, 10];

const APP_VERSIONS_EXPLORER_QUERY = {
  type: 'json',
  limit: 1000,
  source: 'API Event',
  groups: ['OS', 'App Display Version'],
  localId: 'slow_query_app_version_query',
};

const formatQuery = query => {
  return query;
};

export default
@subscribeTo('Schema', 'schema')
@subscribeTo('AnalyticsQuery', 'customQueries')
@withRouter
class SlowQueries extends TableView {
  constructor() {
    super();
    this.section = 'More';
    this.subsection = 'Analytics';

    const date = new Date();
    this.state = {
      slowQueries: [],
      pathOptions: [],
      statusOptions: [],
      methodOptions: [],
      loading: true,
      mutated: false,
      dateRange: {
        start: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - 31
        ),
        end: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1
        )
      },
      className: undefined,
      os: undefined,
      version: undefined,
      method: undefined,
      path: undefined,
      respStatus: undefined,
      respTime: undefined
    };
    this.xhrHandles = [];
  }

  renderSidebar() {
    const { pathname } = this.props.location;
    const current = pathname.substr(pathname.lastIndexOf('/') + 1, pathname.length - 1);
    return (
      <CategoryList current={current} linkPrefix={'analytics/'} categories={[
        { name: 'Explorer', id: 'explorer' },
        { name: 'Performance', id: 'performance' },
        { name: 'Slow Requests', id: 'slow_requests' },
      ]} />
    );
  }

  componentWillMount() {
    this.fetchDropdownData(this.props);
    this.fetchSlowQueries(this.context);
  }

  componentWillUnmount() {
    this.xhrHandles.forEach(xhr => xhr.abort());
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
      this.fetchDropdownData(nextProps);
      this.fetchSlowQueries(nextContext);
    }
  }

  fetchDropdownData(props) {
    props.schema.dispatch(SchemaStore.ActionTypes.FETCH);
    const payload = {
      ...APP_VERSIONS_EXPLORER_QUERY,
      from: this.state.dateRange.start.getTime(),
      to: this.state.dateRange.end.getTime(),
    };
    if (window.DEVELOPMENT) {
      payload.appID = 16155;
    }
    props.customQueries.dispatch(AnalyticsQueryStore.ActionTypes.FETCH, {
      query: {
        ...payload,
      },
    });
  }

  fetchSlowQueries(app) {
    const { path, method, respStatus, respTime, dateRange } = this.state;

    this.setState({ loading: true }, () => {
      const { promise, xhr } = app.getAnalyticsSlowQueries({path, method, respStatus, respTime, from: dateRange.start, to: dateRange.end});
      const pathsResult = app.getAnalyticsSlowQueries({distinct: 'href', path, method, respStatus, respTime, from: dateRange.start, to: dateRange.end});
      const statusResult = app.getAnalyticsSlowQueries({distinct: 'statusCode', path, method, respStatus, respTime, from: dateRange.start, to: dateRange.end});
      const methodsResult = app.getAnalyticsSlowQueries({distinct: 'method', path, method, respStatus, respTime, from: dateRange.start, to: dateRange.end});
      promise.then(
        (result) => this.setState({ slowQueries: result && result.concat([[],[]]) || [] }),
        () => this.setState({ slowQueries: [] })
      );
      pathsResult.promise.then(
        result => this.setState({ pathOptions: result || [] }),
        () => this.setState({ pathOptions: [] })
      );
      statusResult.promise.then(
        result => this.setState({ statusOptions: result && result.map(r => `${r}`) || [] }),
        () => this.setState({ statusOptions: [] })
      );
      methodsResult.promise.then(
        result => this.setState({ methodOptions: result || [] }),
        () => this.setState({ methodOptions: [] })
      );
      Promise.all([promise, pathsResult.promise, statusResult.promise, methodsResult.promise])
        .finally(() => this.setState({ loading: false, mutated: false }))
      this.xhrHandles = [xhr, pathsResult.xhr, statusResult.xhr, methodsResult.xhr];
    });
  }

  handleDownload() {
    const csvDeclaration = 'data:text/csv;charset=utf-8,';
    let csvRows = [SLOW_QUERIES_HEADERS];
    csvRows[0][0] = 'Sno.'; // replace #
    csvRows = csvRows.concat(this.state.slowQueries);
    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    window.open(encodeURI(csvDeclaration + csvContent));
  }

  renderToolbar() {
    // Get app versions using Explorer endpoint
    // const queries = this.props.customQueries.data.get('queries') || [];
    // const appVersionExplorerQuery = queries.find(
    //   query => query.localId === APP_VERSIONS_EXPLORER_QUERY.localId
    // );
    // const appVersions = {};
    // if (appVersionExplorerQuery && appVersionExplorerQuery.result) {
    //   appVersionExplorerQuery.result.forEach(value => {
    //     const os = value['OS'];
    //     const version = value['App Display Version'];
    //     if (os === null || version === null) {
    //       return;
    //     }
    //     if (Object.prototype.hasOwnProperty.call(appVersions, os)) {
    //       appVersions[os].push(version);
    //     } else {
    //       appVersions[os] = [version];
    //     }
    //   });
    // }

    // let osOptions = ['OS'];
    // if (Object.keys(appVersions) && Object.keys(appVersions).length > 0) {
    //   osOptions = Object.keys(appVersions);
    // }

    // // Get class names using Schema endpoint
    // let classOptions = ['Class'];
    // const classList = this.props.schema.data.get('classes');
    // if (classList && !classList.isEmpty()) {
    //   classOptions = Object.keys(classList.toObject());
    // }

    let actions = null;
    if (!this.state.loading) {
      actions = (
        <div>
          <SlowQueriesFilter
            method={this.state.method}
            path={this.state.path}
            respStatus={this.state.respStatus}
            respTime={this.state.respTime}
            methodOptions={this.state.methodOptions}
            pathOptions={this.state.pathOptions}
            respStatusOptions={this.state.statusOptions}
            onChange={(newValue) => this.setState({
              ...newValue,
              mutated: true
            })} />
          <button
            type='button'
            onClick={this.handleDownload.bind(this)}
            className={styles.toolbarAction}
          >
            <Icon name="download" width={14} height={14} fill="#66637a" />
            Download
          </button>
        </div>
      );
    }

    return (
      <Toolbar section="Analytics" subsection="Slow Queries">
        {actions}
      </Toolbar>
    );
  }

  renderHeaders() {
    return SLOW_QUERIES_HEADERS.map((header, index) => (
      <TableHeader key={header} width={TABLE_WIDTH[index]}>
        {header}
      </TableHeader>
    ));
  }

  tableData() {
    return this.state.slowQueries;
  }

  renderRow(query) {
    return (
      <tr key={query[0]}>
        {TABLE_WIDTH.map((width, index) => (
          <td key={'column_' + index} width={width + '%'}>
            {index === 1 ? formatQuery(query[index]) : query[index]}
          </td>
        ))}
      </tr>
    );
  }

  renderEmpty() {
    return (
      <EmptyState
        title="Slow Queries"
        description={'You haven\'t executed any queries.'}
        icon="gears"
        cta="Get started with Query"
        action={() => window.open('https://www.back4app.com/docs/parse-dashboard/analytics/slow-query-tool', '_blank')}
      />
    );
  }

  renderExtras() {
    return (
      <FlowFooter
        borderTop='1px solid rgba(151, 151, 151, 0.27)'
        // secondary={(
        //   <span style={{ marginRight: '10px' }}>
        //     <DateRange
        //       value={this.state.dateRange}
        //       onChange={(newValue) => (this.setState({ dateRange: newValue, mutated: true }))}
        //       align={Directions.RIGHT} />
        //   </span>
        // )}
        primary={
          <Button
            primary={true}
            disabled={!this.state.mutated}
            onClick={this.fetchSlowQueries.bind(this, this.context)}
            value="Run query"
          />
        }
      />
    );
  }
}
