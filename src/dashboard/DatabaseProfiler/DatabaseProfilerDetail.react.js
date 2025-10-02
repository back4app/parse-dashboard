/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import styles from './DatabaseProfiler.scss';

import Prism from 'prismjs';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/components/prism-json';
// eslint-disable-next-line no-unused-vars
import 'stylesheets/b4a-prisma.css';

const handleCopy = async (value) => {
  try {
    await navigator.clipboard.writeText(value.trim());
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const CodeBlock = ({ language, value }) => {
  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [value, language]);

  return (
    <div className={styles.codeBlockContainer}>
      <pre className="line-numbers"><code className={`language-${language}`}>{value.trim()}</code></pre>
    </div>
  );
};


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
    <div key={`detail-${label}`} className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );

  const renderBooleanValue = (value) => (
    <span className={`${styles.booleanTag} ${value ? styles.booleanTrue : styles.booleanFalse}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );

  const JsonCodeBlock = React.memo(({ title, data }) => {
    const memoizedJson = React.useMemo(() => JSON.stringify(data, null, 2), [data]);
    return (
    <div className={styles.queryContainer}>
      {title && 
        <> 
          <div className={styles.contentTitle}>
            <span>{title}</span>
            <button
              onClick={() => handleCopy(memoizedJson)}
              className={styles.copyButton}
              title="Copy to clipboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </>
      }
      <div className={styles.code}>
        <ReactMarkdown
          renderers={{
            code: CodeBlock
          }}
        >{`~~~json
${JSON.stringify(data, null, 2)}
~~~`}</ReactMarkdown>
      </div>
    </div>
  );
});

JsonCodeBlock.propTypes = {
  title: PropTypes.string,
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired
};

const DetailSection = React.memo(({ title, children }) => (
    <div className={styles.detailSection}>
      <h3>{title}</h3>
      <div className={styles.detailGrid}>
        {children}
      </div>
    </div>
  ));

DetailSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

  const renderOperationSpecificDetails = () => {
    if (!command || command === 'unknown') {
      return (
        <DetailSection title="Operation Details">
          <JsonCodeBlock data={data} />
        </DetailSection>
      );
    }

    switch (command) {
      case 'aggregate':
        return (
          <DetailSection title="Aggregation Pipeline">
            <JsonCodeBlock data={pipeline} />
          </DetailSection>
        );

      case 'count':
        return (
          <DetailSection title="Count Query">
            <JsonCodeBlock data={query} />
          </DetailSection>
        );

      case 'delete':
        return (
          <DetailSection title="Delete Operation">
            {renderDetailRow('Documents Removed', nRemoved || 0)}
            <JsonCodeBlock title="Delete Query" data={query} />
          </DetailSection>
        );

      case 'distinct':
        return (
          <DetailSection title="Distinct Operation">
            {renderDetailRow('Distinct Key', distinct?.key || '')}
            <JsonCodeBlock title="Distinct Query" data={query} />
          </DetailSection>
        );

      case 'find':
      case 'query':
        return (
          <DetailSection title="Query Details">
            <div style={{ display: 'flow', gap: '20px' }}>
              <JsonCodeBlock title="Find Query" data={query} />
              {Object.keys(sort).length > 0 && (
                <JsonCodeBlock title="Sort Criteria" data={sort} />
              )}
            </div>
          </DetailSection>
        );

      case 'findAndModify':
        return (
          <DetailSection title="Find and Modify Operation">
            {limit > 0 && renderDetailRow('Limit', limit)}
            <JsonCodeBlock title="Query Document" data={query} />
            {Object.keys(sort).length > 0 && (
              <JsonCodeBlock title="Sort Criteria" data={sort} />
            )}
            {update && (
              <JsonCodeBlock title="Update Operations" data={update} />
            )}
          </DetailSection>
        );

      case 'getMore':
        return (
          <DetailSection title="Get More Operation">
            {renderDetailRow('Documents Returned', docsReturned)}
          </DetailSection>
        );

      case 'insert':
        return (
          <DetailSection title="Insert Operation">
            {renderDetailRow('Documents Inserted', nInserted || 0)}
          </DetailSection>
        );

      case 'mapReduce':
        return (
          <DetailSection title="Map-Reduce Operation">
            {mapReduce && (
              <>
                <JsonCodeBlock title="Map Function" data={mapReduce.map} />
                <JsonCodeBlock title="Reduce Function" data={mapReduce.reduce} />
                {mapReduce.finalize && (
                  <JsonCodeBlock title="Finalize Function" data={mapReduce.finalize} />
                )}
              </>
            )}
          </DetailSection>
        );

      case 'update':
        return (
          <DetailSection title="Update Operation">
            {renderDetailRow('Documents Modified', nModified || 0)}
            <JsonCodeBlock title="Query" data={query} />
            <JsonCodeBlock title="Update" data={update} />
          </DetailSection>
        );

      case 'remove':
        return (
          <>
            <DetailSection title="Remove Operation">
              {renderDetailRow('Documents Removed', nRemoved || 0)}
              {renderDetailRow('Limit', limit || 0)}
            </DetailSection>
            <DetailSection title="Query Details">
              <JsonCodeBlock data={query} />
            </DetailSection>
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
    <div key="overview-section" className={styles.detailSection}>
      <h3>Operation Overview</h3>
      <div className={styles.detailGrid}>
        {renderDetailRow('Command Type', command)}
        {renderDetailRow('Class', className)}
        {(command === 'find' || command === 'query') && renderDetailRow('Limit', limit || 0)}
        {renderDetailRow('Duration', `${duration}ms`)}
        {renderDetailRow('Timestamp', formatDate(ts))}
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: '0px', paddingLeft: '80px', paddingRight: '80px' }}>
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