import React, { useContext, useEffect, useState } from 'react';
import { CurrentApp } from 'context/currentApp';
import { UpgradeGateButton } from 'components/UpgradeCheckout/UpgradeCheckout.react';
import styles from './UpgradeCheckout.scss';

// Inside a delete confirmation: Free apps have no backups, so tell the user before
// they confirm and offer MVP's daily backups. Renders nothing on paid plans.
const BackupUpsell = ({ gate }) => {
  const context = useContext(CurrentApp);
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    let active = true;
    if (context && context.getAppPlanData) {
      context
        .getAppPlanData()
        .then(plan => active && setIsFree(/^free/i.test((plan && plan.planName) || '')))
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, []);

  if (!isFree) {
    return null;
  }
  return (
    <div className={styles.backupUpsell}>
      <span>
        Free apps don&apos;t keep backups, so this can&apos;t be recovered. MVP keeps a daily backup for 7 days.
      </span>
      <UpgradeGateButton
        gate={gate}
        renderTrigger={open => (
          <a href="#" className={styles.backupUpsellLink} onClick={open}>
            Get daily backups
          </a>
        )}
      />
    </div>
  );
};

export default BackupUpsell;
