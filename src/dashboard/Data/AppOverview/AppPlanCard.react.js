import React from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import { Button } from '@back4app2/react-components';

const AppPlanCard = ({ loading, planData, appId }) => {
  return (
    <div className={styles.serverLogsWrapper}>
      <div className={styles.header}>
        <div className={styles.headerText}>Plan Usage</div>
        <Button type="primary" value="Upgrade" onClick={() => window.location.href = `${b4aSettings.BACK4APP_SITE_PATH}/pricing/backend-as-a-service?appId=${appId}&type=parse`} />
      </div>
      <div className={styles.planDataBox}>
        {loading ? ('loading....') : (<>
          <div className={styles.planUsageContainer}>
            <div className={styles.planUsageHeader}>
              <div className={styles.planBadge}>
                <span>{planData.planName.replace(' Plan', '')}</span>
              </div>
              <div className={styles.planExpiry}>
                {planData.planLastUpdate && <div>Last Update <span className={styles.planExpiryDate}>{new Date(planData.planLastUpdate).toLocaleDateString()}</span></div>}
                {planData.planPeriod?.expires && <div>Expires <span className={styles.planExpiryDate}>{new Date(planData.planPeriod.expires).toLocaleDateString()}</span></div>}
              </div>
            </div>

            <hr />

            <UsageBar name="Requests / Month" usage={planData.apiCallUsed} limit={planData.apiCallLimit} />
            <UsageBar name="Storage" usage={planData.fileStorageUsed} limit={planData.fileStorageLimit} />
            <UsageBar name="Database Storage" usage={planData.dataStorageUsed} limit={planData.dataStorageLimit} />
          </div>
        </>)}
      </div>
    </div>
  )
}

export default AppPlanCard;


const UsageBar = ({ name, usage, limit }) => {
  // Convert values to bytes/numbers for calculation
  const convertToNumber = (value) => {
    const num = parseFloat(value);
    const unit = value.replace(/[0-9.]/g, '').trim().toUpperCase();

    switch(unit) {
      case 'KB':
        return num * 1024;
      case 'MB':
        return num * 1024 * 1024;
      case 'GB':
        return num * 1024 * 1024 * 1024;
      case 'M':
        return num * 1000000;
      case 'K':
        return num * 1000;
      default:
        return num;
    }
  };

  const usageNum = convertToNumber(usage);
  const limitNum = convertToNumber(limit);
  const percentage = (usageNum / limitNum) * 100;
  const fillColor = percentage > 90 ? '#E85C3E' : percentage > 70 ? '#FBFF3B' : '#27AE60';

  return (
    <div className={styles.planUsageRow}>
      <div className={styles.planUsageLabel}>{name}</div>
      <div className={styles.planUsageBarContainer}>
        <div className={styles.planUsageBar}>
          <div className={styles.usageBarFill} style={{width: `${percentage}%`, background: fillColor}} />
        </div>
        <div className={styles.planUsageValue}>{usage} / {limit}</div>
      </div>
    </div>
  )
}

