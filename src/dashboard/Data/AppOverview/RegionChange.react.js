import React, { useContext, useState } from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import { CurrentApp } from 'context/currentApp';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import { UpgradeGate, UpgradeGateView, logGateClicked, regionChangeFormUrl } from 'lib/upgradeEvents';
import { UpgradeCheckoutModal } from 'components/UpgradeCheckout/UpgradeCheckout.react';
import styles from 'dashboard/Data/AppOverview/RegionChange.scss';

// Regions the migration form offers. Europe is available on Free; the rest need a paid plan.
const REGIONS = [
  { name: 'Europe', flag: '🇪🇺', free: true },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Singapore', flag: '🇸🇬' },
];

// "Change" under Hosting Region. Paid apps go straight to the migration form, as before.
// On Free, a paid region opens the MVP checkout first; Europe goes to the form.
const RegionChange = ({ isFree, className }) => {
  const context = useContext(CurrentApp);
  const [step, setStep] = useState(null); // null | 'pick' | 'checkout'
  const formUrl = regionChangeFormUrl(context.applicationId);

  if (!isFree) {
    return (
      <a
        className={className}
        onClick={() => amplitudeLogEvent('On Click - Change Hosting Region Button')}
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Change
      </a>
    );
  }

  const choose = region => {
    if (region.free) {
      window.open(formUrl, '_blank', 'noopener,noreferrer');
      setStep(null);
      return;
    }
    logGateClicked(UpgradeGate.REGION_CHANGE, context.applicationId);
    setStep('checkout');
  };

  return (
    <>
      <a
        className={className}
        href="#"
        onClick={event => {
          event.preventDefault();
          amplitudeLogEvent('On Click - Change Hosting Region Button');
          setStep('pick');
        }}
      >
        Change
      </a>
      {step === 'pick' ? (
        <B4aModal
          title="Move your app to another region"
          subtitle="Europe is available on Free. Other regions need a paid plan."
          showCancel={true}
          onCancel={() => setStep(null)}
          customFooter={<div></div>}
        >
          <UpgradeGateView gate={UpgradeGate.REGION_CHANGE} appId={context.applicationId} />
          <div className={styles.regions}>
            {REGIONS.map(region => (
              <button key={region.name} type="button" className={styles.region} onClick={() => choose(region)}>
                <span className={styles.flag}>{region.flag}</span>
                <span className={styles.name}>{region.name}</span>
                <span className={region.free ? styles.free : styles.paid}>{region.free ? 'Free' : 'Paid plans'}</span>
              </button>
            ))}
          </div>
        </B4aModal>
      ) : null}
      {step === 'checkout' ? <UpgradeCheckoutModal gate={UpgradeGate.REGION_CHANGE} onClose={() => setStep(null)} /> : null}
    </>
  );
};

export default RegionChange;
