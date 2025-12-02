import React from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from './AppOverview.scss';

const MCPIntegrationIDE = ({ handleSelectedIDE }) => {
  return (
    <div className={styles.mcpSelectIDEContainer}>
      <span>IDE integrations</span>
      <div className={styles.mcpChoiceIDEList}>
        <div className={styles.mcpChoiceIDE}>
            <Icon name="b4a-cursor-icon" width={60} height={60} />
            <div className={styles.mcpChoiceTitle}>
              <span>Cursor</span>
              <span>AI-powered editor to code faster and smarter.</span>
            </div>
            <button className={styles.mcpConnectBtn} onClick={() => handleSelectedIDE('cursor')}>Connect</button>
        </div>
        <div className={styles.mcpChoiceIDE}>
            <Icon name="b4a-vscode-icon" width={60} height={60} />
            <div className={styles.mcpChoiceTitle}>
              <span>VSCode</span>
              <span>Open-source editor for modern web and cloud development.</span>
            </div>
            <button className={styles.mcpConnectBtn} onClick={() => handleSelectedIDE('vscode')}>Connect</button>
        </div>
        <div className={styles.mcpChoiceIDE}>
            <Icon name="b4a-windsurf-icon" width={60} height={60} />
            <div className={styles.mcpChoiceTitle}>
              <span>Windsurf</span>
              <span>AI-native IDE built to keep developers in flow.</span>
            </div>
            <button className={styles.mcpConnectBtn} onClick={() => handleSelectedIDE('windsurf')}>Connect</button>
        </div>
      </div>
    </div>
  )
}

export default MCPIntegrationIDE;