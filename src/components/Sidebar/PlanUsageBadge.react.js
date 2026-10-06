import React, { useContext, useEffect, useState } from 'react';
import { CurrentApp } from 'context/currentApp';
import { getCachedPlanData } from 'lib/planDataCache';
import { getUsageBadge } from 'dashboard/Data/AppOverview/usageAlert';
import styles from 'components/Sidebar/PlanUsageBadge.scss';

// "84%" next to Plan Usage in the sidebar, following the banner's rules: Free yellow above 70%
// and red above 90%; MVP yellow above 70%; Pay As You Go neutral once over its included usage.
const PlanUsageBadge = () => {
  const context = useContext(CurrentApp);
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    let active = true;
    if (context && context.getAppPlanData) {
      getCachedPlanData(context)
        .then(planData => active && setBadge(getUsageBadge(planData)))
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [context && context.applicationId]);

  if (!badge) {
    return null;
  }
  return <span className={`${styles.badge} ${styles[badge.level]}`}>{badge.percent}%</span>;
};

export default PlanUsageBadge;
