import React from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/Icon/Icon.react';
import { UpgradeGate, planUsagePath } from 'lib/upgradeEvents';
import { UpgradeGateButton } from 'components/UpgradeCheckout/UpgradeCheckout.react';
import { getUsageAlert } from 'dashboard/Data/AppOverview/usageAlert';
import styles from 'components/UsageLimitBanner/UsageLimitBanner.scss';

// Near or over a plan limit (Overview and Plan Usage). Free opens the MVP checkout; other
// plans get a link to Plan Usage, unless they are already on it (showPlansLink={false}).
const UsageLimitBanner = ({ planData, blocked, slug, showPlansLink = true }) => {
  const alert = getUsageAlert(planData, blocked);
  if (!alert) {
    return null;
  }
  const isFree = planData && !(planData instanceof Error) && /^free/i.test(planData.planName || '');
  const cta = alert.level === 'blocked' ? 'Upgrade to bring it back' : 'Upgrade to MVP';
  let action = null;
  if (isFree) {
    action = <UpgradeGateButton gate={UpgradeGate.USAGE_LIMIT} value={cta} />;
  } else if (showPlansLink) {
    action = <Link className={styles.link} to={planUsagePath(slug, UpgradeGate.USAGE_LIMIT)}>See plans</Link>;
  }
  return (
    <div className={`${styles.banner} ${styles[alert.level]}`}>
      <Icon name="warn-triangle-outline" width={18} height={18} fill="currentColor" />
      <div className={styles.text}>{alert.message}</div>
      {action}
    </div>
  );
};

export default UsageLimitBanner;
