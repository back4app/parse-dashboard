/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import styles from './DatabaseProfiler.scss';

const DatabaseProfilerDetail = ({ data }) => {
  if (!data) {
    return <div className={styles.detailContent}>No data available</div>;
  }

  const {
    op,
    className,
    query = {},
    sort = {},
    pipeline = [],
    duration,
    ts,
    docsExamined = 0,
    keysExamined = 0,
    docsReturned = 0,
    responseLength = 0,
    hasSort = false,
    hasIndex = false,
    command = op || 'unknown',  // Fallback to op if command is not present
    limit = 0,
    update,
    nModified,
    nInserted,
    nRemoved,
    distinct,
    mapReduce
  } = data;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toISOString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const renderDetailRow = (label, value) => (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );

  const renderBooleanValue = (value) => (
    <span className={`${styles.booleanTag} ${value ? styles.booleanTrue : styles.booleanFalse}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );

  const renderOperationSpecificDetails = () => {
    if (!command || command === 'unknown') {
      return (
        <div className={styles.detailSection}>
          <h3>Operation Details</h3>
          <div className={styles.queryContainer}>
            <pre className="language-javascript">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      );
    }

    switch (command) {
      case 'aggregate':
        return (
          <div className={styles.detailSection}>
            <h3>Aggregation Pipeline</h3>
            <div className={styles.queryContainer}>
              <pre className="language-javascript">{JSON.stringify(pipeline, null, 2)}</pre>
            </div>
          </div>
        );

      case 'count':
        return (
          <div className={styles.detailSection}>
            <h3>Count Query</h3>
            <div className={styles.queryContainer}>
              <pre className="language-javascript">{JSON.stringify(query, null, 2)}</pre>
            </div>
          </div>
        );

      case 'delete':
        return (
          <div className={styles.detailSection}>
            <h3>Delete Operation</h3>
            <div className={styles.detailGrid}>
              {renderDetailRow('Documents Removed', nRemoved || 0)}
              <div className={styles.queryContainer}>
                <h4>Delete Query</h4>
                <pre className="language-javascript">{JSON.stringify(query, null, 2)}</pre>
              </div>
            </div>
          </div>
        );

      case 'distinct':
        return (
          <div className={styles.detailSection}>
            <h3>Distinct Operation</h3>
            <div className={styles.detailGrid}>
              {renderDetailRow('Distinct Key', distinct?.key || '')}
              <div className={styles.queryContainer}>
                <h4>Distinct Query</h4>
                <pre className="language-javascript">{JSON.stringify(query, null, 2)}</pre>
              </div>
            </div>
          </div>
        );

      case 'find':
      case 'query':
        return (
          <div className={styles.detailSection}>
            <h3>Query Details</h3>
            <div style={{ display: Object.keys(sort).length > 0 ? 'flex' : 'flow', gap: '20px' }}>
              <div className={styles.queryContainer}>
                <div className={styles.title}>Find Query</div>
                <div className={styles.code}>
                  <pre className="language-javascript">{JSON.stringify(query, null, 2)}</pre>
                </div>
              </div>

              {Object.keys(sort).length > 0 && (
                <div className={styles.queryContainer}>
                  <div className={styles.title}>Sort Criteria</div>
                  <div className={styles.code}>
                    <pre className="language-javascript">{JSON.stringify(sort, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'findAndModify':
        return (
          <div className={styles.detailSection}>
            <h3>Find and Modify Operation</h3>
            <div className={styles.detailGrid}>
              <div className={styles.queryContainer}>
                <h4>Query Document</h4>
                <pre className="language-javascript">{JSON.stringify(query, null, 2)}</pre>
              </div>
              {Object.keys(sort).length > 0 && (
                <>
                  <h4>Sort Criteria</h4>
                  <div className={styles.queryContainer}>
                    <pre className="language-javascript">{JSON.stringify(sort, null, 2)}</pre>
                  </div>
                </>
              )}
              {update && (
                <div className={styles.queryContainer}>
                  <h4>Update Operations</h4>
                  <pre className="language-javascript">{JSON.stringify(update, null, 2)}</pre>
                </div>
              )}
              {limit > 0 && renderDetailRow('Limit', limit)}
            </div>
          </div>
        );

      case 'getMore':
        return (
          <div className={styles.detailSection}>
            <h3>Get More Operation</h3>
            <div className={styles.detailGrid}>
              {renderDetailRow('Documents Returned', docsReturned)}
            </div>
          </div>
        );

      case 'insert':
        return (
          <div className={styles.detailSection}>
            <h3>Insert Operation</h3>
            <div className={styles.detailGrid}>
              {renderDetailRow('Documents Inserted', nInserted || 0)}
            </div>
          </div>
        );

      case 'mapReduce':
        return (
          <div className={styles.detailSection}>
            <h3>Map-Reduce Operation</h3>
            <div className={styles.detailGrid}>
              {mapReduce && (
                <>
                  <div className={styles.queryContainer}>
                    <h4>Map Function</h4>
                    <pre className="language-javascript">{mapReduce.map}</pre>
                  </div>
                  <div className={styles.queryContainer}>
                    <h4>Reduce Function</h4>
                    <pre className="language-javascript">{mapReduce.reduce}</pre>
                  </div>
                  {mapReduce.finalize && (
                    <div className={styles.queryContainer}>
                      <h4>Finalize Function</h4>
                      <pre className="language-javascript">{mapReduce.finalize}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case 'update':
        return (
          <div className={styles.detailSection}>
            <h3>Update Operation</h3>
            <div className={styles.detailGrid}>
              {renderDetailRow('Documents Modified', nModified || 0)}
              <div className={styles.queryContainer}>
                <h4>Query</h4>
                <pre className="language-javascript">{JSON.stringify(query, null, 2)}</pre>
              </div>
              <div className={styles.queryContainer}>
                <h4>Update</h4>
                <pre className="language-javascript">{JSON.stringify(update, null, 2)}</pre>
              </div>
            </div>
          </div>
        );

      case 'remove':
        return (
          <>
            <div className={styles.detailSection}>
              <h3>Remove Operation</h3>
              <div className={styles.detailGrid}>
                {renderDetailRow('Documents Removed', nRemoved || 0)}
                {renderDetailRow('Limit', limit || 0)}
              </div>
            </div>
            <div className={styles.detailSection}>
              <h3>Query Details</h3>
              <div className={styles.queryContainer}>
                <pre className="language-javascript">{JSON.stringify(query, null, 2)}</pre>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const shouldShowPerformanceMetrics = () => {
    // List of commands that should show performance metrics
    const commandsWithMetrics = ['find', 'query', 'aggregate', 'count', 'distinct', 'findAndModify'];
    return commandsWithMetrics.includes(command);
  };

  const renderOverview = () => (
    <div className={styles.detailSection}>
      <h3>Operation Overview</h3>
      <div className={styles.detailGrid}>
        {renderDetailRow('Command Type', command)}
        {renderDetailRow('Class', className)}
        {(command === 'find' || command === 'query') && renderDetailRow('Limit', limit || 0)}
        {renderDetailRow('Total Execution Time', `${duration}ms`)}
        {renderDetailRow('Last Execution Time', formatDate(ts))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      {renderOverview()}

      {shouldShowPerformanceMetrics() && (
        <div className={styles.detailSection}>
          <h3>Performance Metrics</h3>
          <div className={styles.detailGrid}>
            {renderDetailRow('Keys Examined', keysExamined)}
            {renderDetailRow('Docs Examined', docsExamined)}
            {renderDetailRow('Response Length', responseLength)}
          </div>
        </div>
      )}

      {shouldShowPerformanceMetrics() && (
        <div className={styles.detailSection}>
          <h3>Query Optimization</h3>
          <div className={styles.detailGrid}>
            {renderDetailRow('Has Sort Stage', renderBooleanValue(hasSort))}
            {renderDetailRow('Has Index Coverage', renderBooleanValue(hasIndex))}
          </div>
        </div>
      )}

      {renderOperationSpecificDetails()}
    </div>
  );
};

export default DatabaseProfilerDetail;