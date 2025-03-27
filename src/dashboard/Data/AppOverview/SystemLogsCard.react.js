import React from 'react';
import { Link } from 'react-router-dom';
import ServerLogsView from 'components/ServerLogsView/ServerLogsView.react';
import Icon from 'components/Icon/Icon.react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';


const SystemLogsCard = ({ loading, logs = '', appSlug = '' }) => {
  let content = null;
  if (loading) {
    content = <div className={styles.loading}><Icon name="status-spinner" width="24px" height="24px" fill="#1377B8" className={styles.spinnerStatus} /></div>;
  } else if (logs instanceof Error) {
    content = <div className={styles.loading}>Error loading logs</div>;
  } else if (logs === '') {
    content = <div className={styles.loading}>No logs found</div>;
  } else {
    content = <div className={styles.logsBox}><ServerLogsView type="system" logs={logs} /></div>;
  }
  return (
    <div className={styles.serverLogsWrapper}>
      <div className={styles.header}>
        <div className={styles.headerText}>System Logs</div>
        <Link to={`/apps/${appSlug}/logs/system`} role='button' className={styles.logsLink}>Go to Logs</Link>
      </div>
      {content}
    </div>
  )
}

export default SystemLogsCard;
