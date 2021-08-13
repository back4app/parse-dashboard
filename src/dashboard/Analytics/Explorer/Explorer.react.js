/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import { ActionTypes }           from 'lib/stores/AnalyticsQueryStore';
import * as AnalyticsConstants   from 'dashboard/Analytics/AnalyticsConstants';
import Button                    from 'components/Button/Button.react';
import CategoryList              from 'components/CategoryList/CategoryList.react';
import Chart                     from 'components/Chart/Chart.react';
import { ChartColorSchemes }     from 'lib/Constants';
import DashboardView             from 'dashboard/DashboardView.react';
import DateRange                 from 'components/DateRange/DateRange.react';
import { Directions }            from 'lib/Constants';
import EmptyState                from 'components/EmptyState/EmptyState.react';
import ExplorerActiveChartButton from 'components/ExplorerActiveChartButton/ExplorerActiveChartButton.react';
import ExplorerMenuButton        from 'components/ExplorerMenuButton/ExplorerMenuButton.react';
import Icon                      from 'components/Icon/Icon.react';
import JsonPrinter               from 'components/JsonPrinter/JsonPrinter.react';
import LoaderContainer           from 'components/LoaderContainer/LoaderContainer.react';
import Parse                     from 'parse';
import prettyNumber              from 'lib/prettyNumber';
import React                     from 'react';
import ReactDOM                  from 'react-dom';
import styles                    from 'dashboard/Analytics/Explorer/Explorer.scss';
import stylesTable               from 'components/Table/Table.scss';
import subscribeTo               from 'lib/subscribeTo';
import Toolbar                   from 'components/Toolbar/Toolbar.react';
import { verticalCenter }        from 'stylesheets/base.scss';

let currentCustomQueryIndex = 1

let buildFriendlyName = (query) => {
  let name = [query.source];
  if (query.groups && query.groups.length > 0) {
    name.push('grouped by');
    name.push(...query.groups);
    name.unshift('#' + currentCustomQueryIndex++)
  }
  return name.join(' ');
};

let inverseMatrix = (matrix) => {
  let matrixInverted = [[]];
  matrix.forEach(
    (innerArray, indexOut) =>
      innerArray.forEach(
        (valueIn, indexIn) => {
          if(matrixInverted[indexIn] === undefined) matrixInverted[indexIn] = []  
          matrixInverted[indexIn][indexOut] = valueIn
        }
      )
  )
  return matrixInverted;
}

export default
@subscribeTo('AnalyticsQuery', 'customQueries')
class Explorer extends DashboardView {
  constructor() {
    super();
    this.section = 'More';
    this.subsection = 'Analytics';

    this.displaySize = {
      width: 800,
      height: 400
    };
    let date = new Date();
    this.state = {
      activeQueries: [],
      dateRange: {
        start: new Date(
          date.getFullYear(),
          date.getMonth() - 1,
          date.getDate()
        ),
        end: date
      },
      loading: false,
      mutated: false
    };
    this.xhrHandles = [];
  }

  componentDidMount() {
    back4AppNavigation && back4AppNavigation.atExplorerReportEvent()
    let display = ReactDOM.findDOMNode(this.refs.display);
    this.displaySize = {
      width: display.offsetWidth,
      height: display.offsetHeight
    };
  }

  componentWillMount() {
    this.props.customQueries.dispatch(ActionTypes.LIST);
    //this.props.customQueries.dispatch(ActionTypes.LIST_RECENT);
  }

  componentWillUnmount() {
    this.xhrHandles.forEach(xhr => xhr && xhr.abort());
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      // check if the changes are in currentApp serverInfo status
      // if not return without making any request
      if (this.props.apps !== nextProps.apps) {
        let updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.params.appId);
        let prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.params.appId);
        const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
        if (!shouldUpdate) return;
      }
      if (this.props.params.displayType !== nextProps.params.displayType) {
        this.setState({ activeQueries: [], mutated: false });
      }
      nextProps.customQueries.dispatch(ActionTypes.LIST);
      //nextProps.customQueries.dispatch(ActionTypes.LIST_RECENT);
    }
  }

  getCustomQueriesFromProps(props) {
    let customQueries = props.customQueries.data && props.customQueries.data.get('queries');
    return (customQueries && customQueries.toArray()) || [];
  }

  handleQueryToggle(index, active) {
    let activeQueries = this.state.activeQueries;
    activeQueries[index].enabled = active;
    this.setState({ activeQueries: activeQueries });
  }

  handleQuerySave(query, saveOnDatabase) {
    // Push new save result
    let activeQueries = this.state.activeQueries;
    let existingQueryIndex = activeQueries.findIndex((activeQuery) => {
      if (query.localId) {
        return query.localId === activeQuery.localId;
      }
      if (query.objectId) {
        return query.objectId === activeQuery.objectId;
      }
      return false;
    });

    query.isSaved = saveOnDatabase
    query.enabled = true;
    if (existingQueryIndex === -1) {
      // Push new
      // Make random ID
      query.localId = 'query' + new Date().getTime();
      activeQueries.push(query);
      if (!query.name) {
        query.name = buildFriendlyName(query);
      }
    } else {
      // Update
      activeQueries[existingQueryIndex] = query;
    }

    // save query
    if (saveOnDatabase) {
      query.isSaved = true
      this.props.customQueries.dispatch(ActionTypes.CREATE, {query}).then(query => {
        if (existingQueryIndex === -1) existingQueryIndex = activeQueries.length
        activeQueries[existingQueryIndex] = query
      })
    }

    // Update the state to trigger rendering pipeline.
    this.setState({
      activeQueries,
      mutated: true
    });
  }

  handleQuerySelect(query) {
    let activeQueries = this.state.activeQueries;
    query.enabled = true;
    activeQueries.push(query);
    this.setState({
      activeQueries,
      mutated: true
    });
  }

  handleQueryDelete(query) {
    this.props.customQueries.dispatch(ActionTypes.DELETE, {
      query: {
        objectId: query.objectId
      }
    });
  }

  handleRunQuery() {
    let promises = [];
    this.xhrHandles = [];
    this.setState({ loading: true });
    this.state.activeQueries.forEach((query, i) => {
      back4AppNavigation && back4AppNavigation.runExplorerQueryEvent(query)
      let promise = null;
      let xhr = null;
      if (query.preset && query.nonComposable) {
        // A preset query, DAU, MAU, DAI
        let payload = {
          ...query.query,
          from: this.state.dateRange.start.getTime() / 1000,
          to: this.state.dateRange.end.getTime() / 1000
        };

        let abortableRequest = this.context.currentApp.getAnalyticsTimeSeries(payload);
        promise = abortableRequest.promise.then((result) => {
          let activeQueries = this.state.activeQueries
          activeQueries[i].result = result.map((point) => (
            [Parse._decode('date', point[0]).getTime(), point[1]]
          ));
          this.setState({ activeQueries });
        });
        xhr = abortableRequest.xhr;
      } else {
        // Custom query
        let payload = this.buildCustomQueryPayload(query);
        promise = this.props.customQueries.dispatch(ActionTypes.FETCH, payload).then(() => {
          let activeQueries = this.state.activeQueries;
          // Update the result based on store in background.
          let customQueries = this.getCustomQueriesFromProps(this.props);
          activeQueries = activeQueries.map((query) => {
            let serverResult = null;
            if (query.objectId) {
              // We have predefined custom query.
              serverResult = customQueries.find((customQuery) => {
                return customQuery[1].objectId === query.objectId;
              })[1];
            } else if (query.localId) {
              // We're in the middle of custom query creation.
              serverResult = customQueries.find((customQuery) => {
                return customQuery[1].localId === query.localId;
              })[1];
            }
            // If we can't find it in the result, let's use the old one.
            if (!serverResult) {
              serverResult = query;
            }
            return {
              ...query,
              result: serverResult.result
            };
          });

          // Trigger rendering pipeline
          this.setState({ activeQueries });
        });
      }

      promises.push(promise);
      this.xhrHandles.push(xhr);
    });
    Promise.all(promises).then(() => this.setState({
      loading: false,
      mutated: false
    }));
  }

  handleDownload() {
    const csvDeclaration = 'data:text/csv;charset=utf-8,';
    switch (this.props.params.displayType) {
      case 'chart': {
        // Transform to [[Time, a, b], [name1, c, f], [name2, d, r]]
        let rows = [];
        // create time column, since time will be same for all queries
        // we can take time from first query
        let timeArr = ['Time'];
        this.state.activeQueries[0].result.forEach(val => {
          timeArr.push(new Date(val[0]).toDateString());
        });
        rows.push(timeArr);

        // now the request queries 
        this.state.activeQueries.forEach(q => {
          let arr = [];
          arr.push(q.name);
          for (let val of q.result) {
            arr.push(val[1]);
          }
          rows.push(arr);
        });
        
        // now transform [[Time, a, b], [name1, c, d], [name2, e, f]]
        // to [[Time, name1, name2], [a, c, e], [b, d, f]]
        // to get vertical columns in csv file
        let csvContent = '';
        inverseMatrix(rows).forEach(function(rowArray) {
          let row = rowArray.join(',');
          csvContent += row + '\r\n';
        });

        window.open(encodeURI( csvDeclaration + csvContent));
        return;
      }
      case 'table': {
        let csvRows = this.state.activeQueries.map((query) => {
          return query.result.join('\n');
        });
        window.open(encodeURI(csvDeclaration + csvRows.join('\n\n')));
        return;
      }
      case 'json': {
        let csvRows = this.state.activeQueries.map((query) => {
          let keys = [];
          if (query.result.length > 0) {
            keys = Object.keys(query.result[0]);
          }
          let csvArray = [keys];
          // Transform:
          // [
          //   { foo: bar, a: b }
          //   { foo: baz, a: c }
          // ]
          // into
          // [[foo, a], [bar, b], [baz, c]]
          csvArray = csvArray.concat(
            query.result.map(result => keys.map(key => result[key]))
          );

          return csvArray.join("\n");
        });
        window.open(encodeURI(csvDeclaration + csvRows.join('\n\n')));
        return;
      }
    }    
  }

  buildCustomQueryPayload(query) {
    let queryWithoutResult = { ...query };
    queryWithoutResult.result = undefined;

    let payload = {
      ...queryWithoutResult,
      type: this.props.params.displayType,
      from: this.state.dateRange.start.getTime(),
      to: this.state.dateRange.end.getTime()
    }

    return {
      query: {
        ...payload
      }
    };
  }

  renderSidebar() {
    let currentDisplay = this.props.params.displayType || '';
    const { path } = this.props.match;
    const current = path.substr(path.lastIndexOf("/") + 1, path.length - 1);
    let subCategory = (
      <CategoryList
        current={currentDisplay}
        linkPrefix={"analytics/explorer/"}
        categories={[
          { name: "Chart", id: "chart" }
          // TODO: Enable table and json as data representation model
          //{ name: 'Table', id: 'table' },
          //{ name: 'JSON', id: 'json' }
        ]}
      />
    );
    return (
      <CategoryList
        current={current}
        linkPrefix={"analytics/"}
        categories={[
          {
            name: "Explorer",
            id: "explorer",
            currentActive: current === ":displayType",
            subCategories: subCategory
          },
          { name: "Performance", id: "performance" },
          { name: "Slow Requests", id: "slow_requests" }
        ]}
      />
    );
  }

  renderContent() {
    let { displayType } = this.props.params;
    let isTimeSeries = displayType === 'chart';
    let explorerQueries = this.getCustomQueriesFromProps(this.props);
    let savedQueries = explorerQueries.filter((query) => {
      return (query.type === displayType || true) && query.isSaved
    });
    //let recentQueries = explorerQueries.filter((query) => query.type === displayType && !query.isSaved);

    let queries = [];
    if (isTimeSeries) {
      // We don't allow preset queries on Table/JSON
      queries = queries.concat(AnalyticsConstants.PresetQueries);
    }
    queries = queries.concat({
      name: 'Saved Queries',
      children: savedQueries,
      emptyMessage: 'You have not saved any queries yet.'
    }
    // {
    //   name: 'Recent Queries',
    //   children: recentQueries,
    //   emptyMessage: 'You have no recent custom queries yet.'
    // }
    );

    let toolbar = (
      <Toolbar
        section='Analytics'
        subsection='Explorer'>
        <a
          href='javascript:;'
          role='button'
          onClick={() => window.open('https://www.back4app.com/docs/parse-dashboard/analytics/mobile-app-analytics', '_blank') }
          className={styles.toolbarAction}
          style={{ borderRight: '1px solid #66637a' }}>
          <Icon name='question-solid' width={14} height={14} fill='#66637a' />
          FAQ
        </a>
        <a
          href='javascript:;'
          role='button'
          onClick={this.handleDownload.bind(this)}
          className={styles.toolbarAction}>
          <Icon name='download' width={14} height={14} fill='#66637a' />
          Download
        </a>
      </Toolbar>
    );

    let activeQueryViews = this.state.activeQueries.map((query, i) => (
      <div className={styles.activeQueryWrap} key={`query${i}`}>
        <ExplorerActiveChartButton
          onSave={this.handleQuerySave.bind(this)}
          onToggle={this.handleQueryToggle.bind(this, i)}
          onDismiss={() => {
            let activeQueries = this.state.activeQueries;
            activeQueries.splice(i, 1);
            this.setState({ activeQueries, mutated: true });
          }}
          isTimeSeries={isTimeSeries}
          query={query}
          color={ChartColorSchemes[i]}
          queries={queries}
          index={i}/>
      </div>
    ));

    activeQueryViews.push(
      <div className={styles.menuButtonWrap} key='addbutton'>
        <ExplorerMenuButton
          onSave={this.handleQuerySave.bind(this)}
          onSelect={this.handleQuerySelect.bind(this)}
          onDelete={this.handleQueryDelete.bind(this)}
          isTimeSeries={isTimeSeries}
          value='Add query'
          queries={queries}
          index={this.state.activeQueries.length}/>
      </div>
    );

    let header = (
      <div className={styles.header}>
        {activeQueryViews}
      </div>
    );

    let footer = (
      <div className={styles.footer}>
        <div className={[styles.right, verticalCenter].join(' ')}>
          <span style={{ marginRight: '10px' }}>
            <DateRange
              value={this.state.dateRange}
              onChange={(newValue) => (this.setState({ dateRange: newValue, mutated: true }))}
              align={Directions.RIGHT} />
          </span>
          <Button
            primary={true}
            disabled={this.state.activeQueries.length === 0 || !this.state.mutated}
            onClick={this.handleRunQuery.bind(this)}
            value='Run query' />
        </div>
      </div>
    );

    let currentDisplay = null;
    if (this.state.activeQueries.length === 0) {
      currentDisplay = (
        <EmptyState
          title={'No queries to display.'}
          icon='analytics-outline'
          description={'Use the "Add query" button above to visualize your data.'} />
      );
    } else {
      switch (displayType) {
        case 'chart':
          let chartData = {};
          this.state.activeQueries.forEach((query, i) => {
            if (!query.result || Object.keys(query.result).length === 0) {
              return;
            }
            if (!query.enabled) {
              return;
            }

            if (Array.isArray(query.result)) {
              chartData[query.name] = {
                color: ChartColorSchemes[i],
                points: query.result
              }
            } else {
              let index = 0;
              for (let key in query.result) {
                chartData[query.name + ' ' + key] = {
                  color: ChartColorSchemes[i],
                  points: query.result[key],
                  index: index++
                }
              }
            }
          });

          // Only render if we have data
          if (Object.keys(chartData).length > 0) {
            currentDisplay = (
              <Chart
                width={this.displaySize.width}
                height={this.displaySize.height}
                data={chartData}
                formatter={(value, label) => (`${label} ${prettyNumber(value, 3)}`)} />
            );
          }
          else if (!this.state.mutated)
            currentDisplay = (
              <EmptyState
                title={'No data to display.'}
                icon='analytics-outline'
                description={'These queries didn\'t retrieve any result.'}
                cta='Get started with Analytics Explorer'
                action={() => window.open('https://www.back4app.com/docs/parse-dashboard/analytics/mobile-app-analytics', '_blank') } />
            );
          break;
        case 'table':
          // Render table
          currentDisplay = this.state.activeQueries.map((query, i) => {
            if (!query.result) {
              return null;
            }
            if (!query.enabled) {
              return null;
            }
            if (!Array.isArray(query.result)) {
              return null;
            }

            let width = Math.floor(100 / query.result[0].length);
            let headers = query.result[0].map((header) => (
              <th
                key={header}
                className={[stylesTable.header, styles.td].join(' ')}
                style={{ display: 'table-cell' }}>
                {header}
              </th>
            ));
            let rows = [];
            for (let i = 1; i < query.result.length; ++i) {
              rows.push(
                <tr className={stylesTable.tr} key={`row${i - 1}`}>
                  {query.result[i].map((value, j) => (
                    <td
                      key={`row${i - 1}col${j}`}
                      className={[stylesTable.td, styles.td].join(' ')}
                      width={`${width}%`}>
                      {value}
                    </td>
                  ))}
                </tr>
              );
            }

            return (
              <div key={`chart${i}`}>
                <div className={stylesTable.rows}>
                  <table className={styles.table}>
                    <thead className={stylesTable.headers} style={{ position: 'initial' }}>
                      <tr>
                        {headers}
                      </tr>
                    </thead>
                    <tbody>
                      {rows}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          });
          break;
        case 'json':
          // Render JSON
          currentDisplay = this.state.activeQueries.map((query, i) => {
            if (!query.result) {
              return null;
            }
            if (!query.enabled) {
              return null;
            }

            return (
              <JsonPrinter
                key={`chart${i}`}
                object={query.result} />
            );
          });
          break;
      }
    }

    let content = (
      <div className={styles.content}>
        <div ref='display' className={styles.display}>
          {currentDisplay}
        </div>
        {header}
        {footer}
      </div>
    );

    return (
      <div>
        <LoaderContainer loading={this.state.loading} solid={false}>
          {content}
        </LoaderContainer>
        {toolbar}
      </div>
    );
  }
}
