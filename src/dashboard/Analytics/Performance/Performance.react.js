/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import CategoryList from 'components/CategoryList/CategoryList.react';
import Chart from 'components/Chart/Chart.react';
import { ChartColorSchemes } from 'lib/Constants';
import DashboardView from 'dashboard/DashboardView.react';
import DateRange from 'components/DateRange/DateRange.react';
import { Directions } from 'lib/Constants';
import ExplorerActiveChartButton from 'components/ExplorerActiveChartButton/ExplorerActiveChartButton.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import Parse from 'parse';
import React from 'react';
import styles from 'dashboard/Analytics/Performance/Performance.scss';
import Toolbar from 'components/Toolbar/Toolbar.react';
import baseStyles from 'stylesheets/base.scss';
import { withRouter } from 'lib/withRouter';

const PERFORMANCE_QUERIES = [
  {
    name: 'Total Requests',
    query: {
      endpoint: 'performance',
      performanceType: 'total_requests',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
  {
    name: 'Request Limit',
    query: {
      endpoint: 'performance',
      performanceType: 'request_limit',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
  {
    name: 'Dropped Requests',
    query: {
      endpoint: 'performance',
      performanceType: 'dropped_requests',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
  {
    name: 'Served Requests',
    query: {
      endpoint: 'performance',
      performanceType: 'served_requests',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
];

@withRouter
export default class Performance extends DashboardView {
  constructor() {
    super();
    this.section = 'More';
    this.subsection = 'Analytics'

    this.displaySize = {
      width: 800,
      height: 400,
    };
    const date = new Date();
    this.state = {
      dateRange: {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
        end: date,
      },
      loading: true,
      performanceData: PERFORMANCE_QUERIES.map(() => ({})),
      activeQueries: PERFORMANCE_QUERIES.map(() => true),
      // If dateRange is modified, we should set mutated to true
      // and re-style "Run query" button
      mutated: false,
    };
    this.xhrHandles = [];
    this.displayRef = React.createRef();
  }

  componentDidMount() {
    const display = this.displayRef;
    this.displaySize = {
      width: display.current.offsetWidth,
      height: display.current.offsetHeight,
    };
  }

  componentWillMount() {
    // Send track event
    if (typeof back4AppNavigation !== 'undefined' && typeof back4AppNavigation.atAnalyticsPerformanceEvent === 'function')
      back4AppNavigation.atAnalyticsPerformanceEvent()
    this.handleRunQuery(this.context);
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
        if (!shouldUpdate) return;
      }
      this.handleRunQuery(nextContext);
    }
  }

  handleQueryToggle(index, active) {
    const activeQueries = this.state.activeQueries;
    activeQueries[index] = active;
    this.setState({ activeQueries: activeQueries });
  }

  handleRunQuery(app) {
    this.setState({
      loading: true,
    });
    const promises = [];
    this.xhrHandles = [];
    PERFORMANCE_QUERIES.forEach((query, index) => {
      const res = app.getAnalyticsTimeSeries({
        ...query.query,
        from: this.state.dateRange.start.getTime() / 1000,
        to: this.state.dateRange.end.getTime() / 1000,
      });

      let promise = res.promise;
      const xhr = res.xhr;
      promise = promise.then(result => {
        const performanceData = this.state.performanceData;
        performanceData[index] = result;
        this.setState({
          performanceData: performanceData,
        });
      });

      promises.push(promise);
      this.xhrHandles.push(xhr);
    });
    Promise.all(promises).then(() => {
      this.setState({
        loading: false,
        mutated: false,
      });
    });
  }

  renderSidebar() {
    const { pathname } = this.props.location;
    const current = pathname.substr(pathname.lastIndexOf("/") + 1, pathname.length - 1);
    return (
      <CategoryList current={current} linkPrefix={'analytics/'} categories={[
        { name: 'Explorer', id: 'explorer' },
        { name: 'Performance', id: 'performance' },
        { name: 'Slow Requests', id: 'slow_requests' },
      ]} />
    );
  }

  renderContent() {
    const toolbar = <Toolbar section="Analytics" subsection="Performance" />;

    const header = (
      <div className={styles.header}>
        {PERFORMANCE_QUERIES.map((query, i) => (
          <div className={styles.activeQueryWrap} key={`query${i}`}>
            <ExplorerActiveChartButton
              onToggle={this.handleQueryToggle.bind(this, i)}
              query={query}
              color={ChartColorSchemes[i]}
              queries={[]}
              disableDropdown={true}
            />
          </div>
        ))}
      </div>
    );

    const footer = (
      <div className={styles.footer}>
        <div className={[styles.right, baseStyles.verticalCenter].join(' ')}>
          <span style={{ marginRight: '10px' }}>
            <DateRange
              value={this.state.dateRange}
              onChange={newValue => this.setState({ dateRange: newValue, mutated: true })}
              align={Directions.RIGHT}
              maxRange={30}
            />
          </span>
          <Button
            primary={true}
            disabled={!this.state.mutated}
            onClick={this.handleRunQuery.bind(this, this.context)}
            value="Run query"
          />
        </div>
      </div>
    );

    const chartData = {};
    this.state.performanceData.forEach((data, i) => {
      if (!this.state.activeQueries[i]) {
        return null;
      }

      if (Array.isArray(data)) {
        // Handle Request Limit
        const points = data.map(point => [Parse._decode('date', point[0]).getTime(), point[1]]);

        chartData[PERFORMANCE_QUERIES[i].name] = {
          color: ChartColorSchemes[i],
          points: points,
        };
      } else {
        let points = [];
        for (const key in data.cached) {
          const cachedPoints = data.cached[key];
          points = points.concat(
            cachedPoints.map(point => [Parse._decode('date', point[0]).getTime(), point[1]])
          );
        }

        if (points.length > 0) {
          chartData[PERFORMANCE_QUERIES[i].name] = {
            color: ChartColorSchemes[i],
            points: points,
          };
        }
      }
    });
    let chart = null;
    if (Object.keys(chartData).length > 0) {
      chart = (
        <Chart 
          width={this.displaySize.width} 
          height={this.displaySize.height} 
          data={chartData} 
          formatter={(value) => value + ' requests/min'} 
        />
      );
    }

    const content = (
      <LoaderContainer loading={this.state.loading} solid={false}>
        <div className={styles.content}>
          <div ref={this.displayRef} className={styles.display}>
            {chart}
          </div>
          {header}
          {footer}
        </div>
      </LoaderContainer>
    );

    return (
      <div>
        {content}
        {toolbar}
      </div>
    );
  }
}
