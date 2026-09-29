import React from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from './AppOverview.scss';

// The ways into this app from outside, MCP first. Each one opens the Connect
// modal on its own tab; ConnectModal lists the same keys in the same order.
export const CONNECT_TABS = [
  { key: 'mcp', label: 'MCP', description: 'Connect your AI agent', icon: 'b4a-agent' },
  { key: 'sdk', label: 'SDK', description: 'Client libraries', icon: 'devices-outline' },
  { key: 'rest', label: 'REST', description: 'Server to server', icon: 'b4a-api-icon' },
  { key: 'graphql', label: 'GraphQL', description: 'Typed queries', icon: 'graphql' },
  { key: 'keys', label: 'Keys', description: 'Which key goes where', icon: 'keys-outline' },
];

const GetConnected = ({ onOpen }) => (
  <div className={styles.getConnected}>
    <span>Get connected</span>
    <div className={styles.getConnectedList}>
      {CONNECT_TABS.map(tab => (
        <button key={tab.key} type="button" className={styles.getConnectedItem} onClick={() => onOpen(tab.key)}>
          <Icon name={tab.icon} width={22} height={22} fill="#C1E2FF" />
          <span className={styles.getConnectedLabel}>{tab.label}</span>
          <span className={styles.getConnectedDescription}>{tab.description}</span>
        </button>
      ))}
    </div>
  </div>
);

export default GetConnected;
