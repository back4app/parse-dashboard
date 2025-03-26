import React from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';

const statusCodes = {
  200: 'Success',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

const getStatusColor = (code) => {
  if (code.startsWith('2')) {return '#2AC769';}
  if (code.startsWith('4')) {return '#FF4444';}
  if (code.startsWith('5')) {return '#FF4444';}
  return '#ccc';
};

function formatNumber(num) {
  // Handle invalid inputs
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  // Define the suffixes and their corresponding divisors
  const units = [
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' }
  ];

  // Find the appropriate unit
  for (const { value, symbol } of units) {
    if (Math.abs(num) >= value) {
      // Round to 1 decimal place and remove trailing .0
      const formatted = (num / value).toFixed(1).replace(/\.0$/, '');
      return formatted + symbol;
    }
  }

  // Return the original number if less than 1000
  return num.toString();
}

function formatMilliseconds(ms) {
  // Handle invalid inputs
  if (ms === null || ms === undefined || isNaN(ms)) {
    return '0 s';
  }

  // Convert milliseconds to seconds
  const seconds = ms / 1000;

  // Define time units in seconds and their symbols
  const units = [
    { value: 86400, symbol: 'd' },   // days
    { value: 3600, symbol: 'h' },    // hours
    { value: 60, symbol: 'm' },      // minutes
    { value: 1, symbol: 's' }        // seconds
  ];

  // Find the appropriate unit
  for (const { value, symbol } of units) {
    if (Math.abs(seconds) >= value) {
      // Convert to the unit and round to 1 decimal place
      const converted = (seconds / value).toFixed(1).replace(/\.0$/, '');
      return `${converted}${symbol}`;
    }
  }

  return '0s';
}

const AvgResponseTimeCard = ({ isLoadingAvgResponseTime, avgResponseTime }) => {
  let content;
  if (isLoadingAvgResponseTime) {
    content = <div className={styles.loading}><Icon name="status-spinner" width="24px" height="24px" fill="#1377B8" className={styles.spinnerStatus} /></div>;
  } else if (!avgResponseTime) {
    content = <div className={styles.loading}>No data!</div>;
  } else if (avgResponseTime instanceof Error) {
    content = <div className={styles.loading}>Error loading average response time</div>;
  } else {
    content = <div className={styles.content}>
      <div className={styles.avgResponseTime}>{avgResponseTime}</div>
      <div className={styles.avgResponseTimeText}>ms</div>
    </div>;
  }
  return <div className={styles.avgResponseTimeCard}>
    <div className={styles.headerTextDiv}>
      <div className={styles.headerText}>Average Response Time</div>
      <div className={styles.rightText}>last 60 mins</div>
    </div>
    {content}
  </div>
}

const ResponseStatusCard = ({ isLoadingResponseStatus, responseStatus }) => {
  let content;
  if (isLoadingResponseStatus) {
    content = <div className={styles.loading}><Icon name="status-spinner" width="24px" height="24px" fill="#1377B8" className={styles.spinnerStatus} /></div>;
  }  else if (!Object.keys(responseStatus).length) { // empty
    content = <div className={styles.loading}>No data!</div>;
  } else if (responseStatus instanceof Error) {
    content = <div className={styles.loading}>Error loading response status</div>;
  } else {
    const totalRequests = Object.values(responseStatus || {}).reduce((sum, data) => sum + data.count, 0);
    content = <div className={styles.content}>
      {Object.entries(responseStatus || {}).map(([status, data]) => {
        return (
          <div key={status} className={styles.statsRow}>
            <div className={styles.statusCode}>{status} ({statusCodes[status]})</div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${data.percent}%`, background: getStatusColor(status) }} />
            </div>
            <div className={styles.requestCount}>{formatNumber(data.count)}</div>
            <div className={styles.percentage}>{data.percent}%</div>
          </div>
        );
      })}
      <div className={styles.statsRow}>
        <div className={styles.statusCode} style={{ fontWeight: 700}}>Total</div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: '100%', background: '#1377B8'}} />
        </div>
        <div className={styles.requestCount}>{formatNumber(totalRequests)}</div>
        <div className={styles.percentage}>100%</div>
      </div>
    </div>;
  }
  return <div className={styles.responseStatusCard}>
    <div className={styles.headerTextDiv}>
      <div className={styles.headerText}>Response Status</div>
      <div className={styles.rightText}>last 60 mins</div>
    </div>
    {content}
  </div>
}


const SlowQueriesCard = ({ isLoadingSlowQueries, slowQueries }) => {
  let content;
  if (isLoadingSlowQueries) {
    content = <div className={styles.loading}><Icon name="status-spinner" width="24px" height="24px" fill="#1377B8" className={styles.spinnerStatus} /></div>;
  } else if (!slowQueries) {
    content = <div className={styles.loading}>No data!</div>;
  } else if (slowQueries instanceof Error) {
    content = <div className={styles.loading}>Error loading slow queries</div>;
  } else {
    content = <div className={styles.content}>
      <div className={styles.slowQueriesText}>Count</div>
      <div className={styles.slowQueriesNumber}>{slowQueries.length}</div>
      <div className={styles.slowQueriesText}>Avg. duration</div>
      <div className={styles.avgSlowQueryTime}>{formatMilliseconds(slowQueries.reduce((sum, query) => sum + query[6], 0) / slowQueries.length)}</div>
    </div>;
  }
  return <div className={styles.slowQueriesCard}>
    <div className={styles.headerTextDiv}>
      <div className={styles.headerText}>Slow Queries</div>
    </div>
    {content}
  </div>
}


const AppPerformanceCard = ({ isLoadingAvgResponseTime, avgResponseTime, isLoadingResponseStatus, responseStatus, isLoadingSlowQueries, slowQueries }) => {
  return (
    <div className={styles.performanceCard}>
      <div className={styles.performanceCardHeader}>
        Response Performance
      </div>
      <div className={styles.performanceCardContent}>
        <AvgResponseTimeCard isLoadingAvgResponseTime={isLoadingAvgResponseTime} avgResponseTime={avgResponseTime} />
        <ResponseStatusCard isLoadingResponseStatus={isLoadingResponseStatus} responseStatus={responseStatus} />
        <SlowQueriesCard isLoadingSlowQueries={isLoadingSlowQueries} slowQueries={slowQueries} />
      </div>
    </div>
  )
}

export default AppPerformanceCard;
