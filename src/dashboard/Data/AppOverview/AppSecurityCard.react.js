import React from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import { Link } from 'react-router-dom';

const AppSecurityCard = ({ loading, securityReport }) => {
  return (
    <div className={styles.serverLogsWrapper}>
      <div className={styles.header}>
        <div className={styles.headerText}>System Logs</div>
        <Link to="/" role='button' className={styles.logsLink}>Go to Security</Link>
      </div>
      <div className=''>
        {loading ? ('loading....') : (<>
          {/* {JSON.stringify(securityReport)} */}
        </>)}
      </div>
    </div>
  )
}

export default AppSecurityCard;
