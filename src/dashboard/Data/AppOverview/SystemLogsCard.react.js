import React from 'react';
import { Link } from 'react-router-dom';
import ServerLogsView from 'components/ServerLogsView/ServerLogsView.react';

import styles from 'dashboard/Data/AppOverview/AppOverview.scss';

const SystemLogsCard = ({ loading, logs = '', appSlug = '' }) => {
  return (
    <div className={styles.serverLogsWrapper}>
      <div className={styles.header}>
        <div className={styles.headerText}>System Logs</div>
        <Link to={`/apps/${appSlug}/logs/system`} role='button' className={styles.logsLink}>Go to Logs</Link>
      </div>
      <div className={styles.logsBox}>
        {loading ? ('loading....') : (<ServerLogsView type="system" logs={logs} />)}
      </div>
    </div>
  )
}

export default SystemLogsCard;
