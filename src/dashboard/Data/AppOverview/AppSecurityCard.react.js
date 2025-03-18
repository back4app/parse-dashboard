import React from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import { Link } from 'react-router-dom';
import Icon from 'components/Icon/Icon.react';

const AppSecurityCard = ({ loading, securityReport }) => {
  return (
    <div className={styles.serverLogsWrapper}>
      <div className={styles.header}>
        <div className={styles.headerText}>Security</div>
        <Link to="/" role='button' className={styles.logsLink}>Go to Security</Link>
      </div>
      <div className={styles.securityReport}>
        {loading ? ('loading....') : (<>
          <div className={styles.securityContainer}>
            <div className={styles.securityHeader}>
              Errors & Warnings
              <span className={styles.actionNeeded}>Action needed <Icon name="b4a-security-shield" width={16} height={16} fill="#E85C3E" /> </span>
            </div>
            {securityReport.slice(0, 2).map((item, index) => (
              <div key={index} className={styles.securityItem}>
                <div className={styles.securityText}>
                  {item.message}
                </div>
                <div className={styles.securityAction}>
                  <Icon name="b4a-right-arrrow-icon" width={16} height={16} fill="#f9f9f9" />
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}

export default AppSecurityCard;
