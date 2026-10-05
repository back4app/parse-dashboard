import React, { useContext, useEffect, useState } from 'react';
import { CurrentApp } from 'context/currentApp';
import { UpgradeGate, SUPPORT_TICKET_URL } from 'lib/upgradeEvents';
import { UpgradeGateButton } from 'components/UpgradeCheckout/UpgradeCheckout.react';
import styles from 'dashboard/Data/Logs/Logs.scss';

// End of a log list: only the most recent lines are shown and older ones come through
// support. On Access logs, Free also learns that MVP keeps a week instead of a day
// (the retention published on the pricing page).
const LogsFooter = ({ showRetention = false }) => {
  const context = useContext(CurrentApp);
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    let active = true;
    if (showRetention && context && context.getAppPlanData) {
      context
        .getAppPlanData()
        .then(plan => active && setIsFree(/^free/i.test((plan && plan.planName) || '')))
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [showRetention]);

  return (
    <div className={styles.logsFooter}>
      <span>
        These are the most recent logs. Need older ones?{' '}
        <a href={SUPPORT_TICKET_URL} target="_blank" rel="noopener noreferrer">Open a ticket</a>.
      </span>
      {showRetention && isFree ? (
        <span className={styles.logsFooterUpsell}>
          Free keeps access logs for 1 day; MVP keeps 7 days.{' '}
          <UpgradeGateButton
            gate={UpgradeGate.LOGS_RETENTION}
            renderTrigger={open => (
              <a href="#" onClick={open}>Upgrade to MVP</a>
            )}
          />
        </span>
      ) : null}
    </div>
  );
};

export default LogsFooter;
