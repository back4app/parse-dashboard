import React, { useContext, useEffect, useState } from 'react';
import { CurrentApp } from 'context/currentApp';
import { getCachedPlanData } from 'lib/planDataCache';
import { getMostUrgentUsage } from 'dashboard/Data/AppOverview/usageAlert';
import styles from 'components/Sidebar/PlanUsageBadge.scss';

// "84%" next to Plan Usage in the sidebar when a limit is close: yellow above 70%,
// red above 90%. Uses the same limit as the Overview banner, so both show one number.
const PlanUsageBadge = () => {
  const context = useContext(CurrentApp);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    let active = true;
    if (context && context.getAppPlanData) {
      getCachedPlanData(context)
        .then(planData => active && setUsage(getMostUrgentUsage(planData)))
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [context && context.applicationId]);

  const worst = usage && usage.worst;
  if (!worst || worst.severity === 0) {
    return null;
  }
  const level = worst.severity >= 2 ? styles.danger : styles.warning;
  return (
    <span className={`${styles.badge} ${level}`} title={`${worst.label}: ${worst.used} of ${worst.limit}`}>
      {Math.min(100, Math.floor(worst.percent))}%
    </span>
  );
};

export default PlanUsageBadge;
