import React from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from './AppOverview.scss';
import { KeyIcon, McpIcon, SdkIcon } from './connectIcons.react';

// The ways into this app from outside, MCP first. Each one opens the Connect
// modal on its own tab; ConnectModal lists the same keys in the same order.
// `icon` is an inline icon component or a sprite name.
export const CONNECT_TABS = [
  { key: 'mcp', label: 'MCP', description: 'Connect your AI agent', icon: McpIcon },
  { key: 'sdk', label: 'SDK', description: 'Client libraries', icon: SdkIcon },
  { key: 'rest', label: 'REST', description: 'Server to server', icon: 'b4a-api-icon' },
  { key: 'graphql', label: 'GraphQL', description: 'Typed queries', icon: 'graphql' },
  { key: 'keys', label: 'Keys', description: 'Which key goes where', icon: KeyIcon },
];

const TabIcon = ({ icon: InlineIcon }) =>
  typeof InlineIcon === 'string'
    ? <Icon name={InlineIcon} width={22} height={22} fill="currentColor" />
    : <InlineIcon />;

const GetConnected = ({ onOpen }) => (
  <div className={styles.getConnected}>
    <span>Get connected</span>
    <div className={styles.getConnectedList}>
      {CONNECT_TABS.map(tab => (
        <button key={tab.key} type="button" className={styles.getConnectedItem} onClick={() => onOpen(tab.key)}>
          <span className={styles.getConnectedIcon}><TabIcon icon={tab.icon} /></span>
          <span className={styles.getConnectedLabel}>{tab.label}</span>
          <span className={styles.getConnectedDescription}>{tab.description}</span>
        </button>
      ))}
    </div>
  </div>
);

export default GetConnected;
