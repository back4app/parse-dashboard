import React from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';

const AppSecurityCard = ({ appId, loading, securityReport }) => {
  let content = null;
  if (loading) {
    content = <div className={styles.loading}><Icon name="status-spinner" width="24px" height="24px" fill="#1377B8" className={styles.spinnerStatus} /></div>;
  } else if (securityReport instanceof Error) {
    content = <div className={styles.loading}>Something went wrong</div>;
  } else {
    content = <div className={styles.securityContainer}>
      <div className={styles.securityHeader}>
        Errors & Warnings
      </div>
      {securityReport.length === 0 ? <div className={styles.noSecurity}>No security issues found</div> :
        securityReport.slice(0, 2).map((item, index) => (
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
  }
  return (
    <div className={styles.serverLogsWrapper}>
      <div className={styles.header}>
        <div className={styles.headerText}>Security</div>
        <a href={`${b4aSettings.BACK4APP_API_PATH}/apps/status/${appId}`} role='button' className={styles.logsLink}>Go to Security</a>
      </div>
      <div className={styles.securityReport}>
        {content}
      </div>
    </div>
  )
}

export default AppSecurityCard;
