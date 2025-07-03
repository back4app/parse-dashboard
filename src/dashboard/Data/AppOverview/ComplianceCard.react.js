import React from 'react';
import styles from './AppOverview.scss';

const complianceTypes = {
  'HIPAA': {
    name: 'HIPAA',
    description: 'Healthcare data privacy and security',
  },
  'SOC 2': {
    name: 'SOC 2',
    description: 'Trust-based controls for data handling',
  },
  'ISO 27001': {
    name: 'ISO 27001',
    description: 'International information security management standard',
  },
}

const ComplianceCard = ({ loading, planData, appId }) => {
  let content = null;
  if (loading) {
    content = <div className={styles.loading}><Icon name="status-spinner" width="24px" height="24px" fill="#1377B8" className={styles.spinnerStatus} /></div>;
  } else if (planData instanceof Error) {
    content = <div className={styles.loading}>Something went wrong</div>;
  } else {
    content = (
      <div className={styles.complianceContent}>
        <ComplianceItem type="HIPAA" planName={planData.planName} appId={appId} />
        <ComplianceItem type="SOC 2" planName={planData.planName} appId={appId} />
        <ComplianceItem type="ISO 27001" planName={planData.planName} appId={appId} />
      </div>
    )
  }

  return (
    <div className={styles.complianceContainer}>
      <div className={styles.complianceHeader}>Compliance</div>
      {content}
    </div>
  )
}

const ComplianceItem = ({ type, planName, appId }) => {
  let showUpgrade = false; let showSignBAA = false;
  if (/Free/i.test(planName)) {
    showUpgrade = true;
  } else if (/MVP/i.test(planName)) {
    showUpgrade = true;
  } else if (/Pay As You Go/i.test(planName)) {
    showSignBAA = true;
  } else { // check if BAA signed
    showSignBAA = true;
  }

  return <div className={styles.complianceItem}>
    <div className={styles.complianceItemHeader}>
      <div className={styles.complianceText}>{complianceTypes[type].name}</div>
      {showUpgrade ? <div className={styles.complianceStatus}>
       Change Plan
      </div> : (
        <div className={styles.complianceStatus}> <Icon name="b4a-check-icon" width="18px" height="20px" fill="#27AE60" /> Enabled</div>
      )}
    </div>

    <div className={styles.complianceItemDescription}>
      <div className={styles.complianceItemDescriptionText}>
        {complianceTypes[type].description}
      </div>
      {showUpgrade && <a href={`${b4aSettings.BACK4APP_SITE_PATH}/pricing/backend-as-a-service?appId=${appId}&type=parse}`} target="_blank" rel="noopener noreferrer"><button className={styles.complianceItemUpgradeBtn}>Upgrade</button></a>}
      {showSignBAA && <a href={`https://back4app.typeform.com/to/qagI6LKi?appId=${appId}`} target="_blank" rel="noopener noreferrer"><button className={styles.complianceItemSignBtn}>Sign BAA</button></a>}
    </div>
  </div>
}

export default ComplianceCard;
