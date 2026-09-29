import React, { useState } from 'react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import Icon from 'components/Icon/Icon.react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import { CONNECT_TABS } from './GetConnected.react';
import { LanguageDocMap, ConnectDoc } from './connectDocs.react';
import MCPSetup from './MCPSetup.react';

const origin = new Position(0, 0);

// REST and GraphQL have their own tabs; everything else in the map is an SDK.
const SDK_KEYS = ['js-browser', 'js-node', 'react', 'js-react-native', 'flutter', 'ios', 'android', 'php'];

const SdkTab = () => {
  const [sdk, setSdk] = useState(SDK_KEYS[0]);
  return (
    <>
      <div className={styles.connectChips}>
        {SDK_KEYS.map(key => {
          const doc = LanguageDocMap[key];
          return (
            <button
              key={key}
              type="button"
              className={`${styles.connectChip} ${sdk === key ? styles.selected : ''}`}
              onClick={() => setSdk(key)}
            >
              <Icon name={doc.icon} fill={doc.iconColor || ''} width={16} height={16} />
              {doc.name}
            </button>
          );
        })}
      </div>
      <ConnectDoc key={sdk} doc={LanguageDocMap[sdk]} />
    </>
  );
};

// Same labels as the key picker on the Overview card.
function keyLabel(key) {
  if (key === 'windowsKey') {
    return '.NET Key';
  }
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
}

const KeyRow = ({ label, value }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={styles.connectKeyRow}>
      <span className={styles.connectKeyLabel}>{label}</span>
      <code className={styles.connectKeyValue}>{value}</code>
      <button type="button" className={styles.connectKeyCopy} onClick={copy} title={copied ? 'Copied!' : 'Copy'}>
        <Icon name={copied ? 'b4a-check-icon' : 'b4a-copy-icon'} fill={copied ? '#27AE60' : '#15A9FF'} width={14} height={14} />
      </button>
    </div>
  );
};

// The app's keys, the same set the Overview card offers (every *Key that has a
// value), each copyable.
const KeysTab = ({ context }) => {
  const keys = Object.entries(context).filter(([k, v]) => k.includes('Key') && v);
  return (
    <div className={styles.connectKeys}>
      <KeyRow label="App ID" value={context.applicationId} />
      {keys.map(([key, value]) => <KeyRow key={key} label={keyLabel(key)} value={value} />)}
    </div>
  );
};

/**
 * Connect: every way into this app from outside, one tab each (MCP, SDK, REST,
 * GraphQL, Keys) — opened on the tab the user clicked in Get connected.
 */
const ConnectModal = ({ closeModal, context, initialTab = 'mcp' }) => {
  const [tab, setTab] = useState(initialTab);

  let body;
  if (tab === 'mcp') {
    body = <MCPSetup context={context} />;
  } else if (tab === 'sdk') {
    body = <SdkTab />;
  } else if (tab === 'keys') {
    body = <KeysTab context={context} />;
  } else {
    body = <ConnectDoc key={tab} doc={LanguageDocMap[tab]} />;
  }

  return (
    <Popover fadeIn={true} fixed={true} position={origin} modal={true} color="rgba(17,13,17,0.8)">
      <div className={`${styles.connectAppModal} ${styles.connectModal}`}>
        <div className={styles.connectAppModalHeader}>
          <div>
            <div className={styles.connectAppModalTitle}>Connect</div>
            <div className={styles.connectModalServer}>{context.serverURL}</div>
          </div>
          <div className={styles.closeIcon} onClick={closeModal}>
            <Icon name="close" fill="#f9f9f9" width={14} height={14} />
          </div>
        </div>
        <div className={styles.connectTabs}>
          {CONNECT_TABS.map(option => (
            <button
              key={option.key}
              type="button"
              className={`${styles.connectTab} ${tab === option.key ? styles.selected : ''}`}
              onClick={() => setTab(option.key)}
            >
              <span>{option.label}</span>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
        <div className={styles.connectAppModalContent}>{body}</div>
      </div>
    </Popover>
  );
};

export default ConnectModal;
