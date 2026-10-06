import React, { useContext, useEffect, useState } from 'react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import { CurrentApp } from 'context/currentApp';
import { UpgradeGateButton } from 'components/UpgradeCheckout/UpgradeCheckout.react';

// Inside a delete confirmation: Free apps have no backups, so tell the user before
// they confirm and offer MVP's daily backups. Renders nothing on paid plans.
// Same row layout as the dialog's "Confirm this action" field, with the green upgrade button.
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
    <Field
      labelPadding={24}
      label={
        <Label
          text="No backups on Free"
          description="Deleted data can't be recovered. MVP keeps a daily backup for 7 days."
        />
      }
      input={
        <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
          <UpgradeGateButton gate={gate} value="Get daily backups" />
        </div>
      }
    />
  );
};

export default BackupUpsell;
