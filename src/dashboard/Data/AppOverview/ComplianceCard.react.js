import React from 'react';
import styles from './AppOverview.scss';

const ComplianceCard = () => {
  return (
    <div className={styles.complianceContainer}>
      <div className={styles.complianceHeader}>Compliance</div>
      <div className={styles.complianceContent}>

        <div className={styles.complianceItem}>
          <div className={styles.complianceItemHeader}>
            <div className={styles.complianceText}>HIPAA</div>
            <div className={styles.complianceStatus}>
            Change Plan
            </div>
          </div>

          <div className={styles.complianceItemDescription}>
            <div className={styles.complianceItemDescriptionText}>
          Healthcare data privacy and security
            </div>
            <button className={styles.complianceItemSignBtn}>Sign BAA</button>
          </div>
        </div>

        <div className={styles.complianceItem}>
          <div className={styles.complianceItemHeader}>
            <div className={styles.complianceText}>SOC 2</div>
            <div className={styles.complianceStatus}>
            Change Plan
            </div>
          </div>

          <div className={styles.complianceItemDescription}>
            <div className={styles.complianceItemDescriptionText}>
              Trust-based controls for data handling
            </div>
            <button className={styles.complianceItemUpgradeBtn}>Upgrade</button>
          </div>
        </div>

        <div className={styles.complianceItem}>
          <div className={styles.complianceItemHeader}>
            <div className={styles.complianceText}>ISO 27001</div>
            <div className={styles.complianceStatus}>
            Change Plan
            </div>
          </div>

          <div className={styles.complianceItemDescription}>
            <div className={styles.complianceItemDescriptionText}>
              International information security management standard
            </div>
            <button className={styles.complianceItemUpgradeBtn}>Upgrade</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplianceCard;
