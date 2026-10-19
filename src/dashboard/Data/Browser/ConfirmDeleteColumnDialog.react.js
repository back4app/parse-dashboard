/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Modal     from 'components/Modal/Modal.react';
import React     from 'react';
import BackupUpsell from 'components/UpgradeCheckout/BackupUpsell.react';
import { UpgradeGate } from 'lib/upgradeEvents';

export default class ConfirmDeleteColumnDialog extends React.Component {

  render() {
    const content = <BackupUpsell gate={UpgradeGate.BACKUP_DELETE_COLUMN} />;

    return (
      <Modal
        type={Modal.Types.DANGER}
        icon='warn-outline'
        title='Delete this column?'
        subtitle='This action cannot be undone!'
        confirmText='Yes, delete'
        cancelText={'Never mind, don\u2019t.'}
        onCancel={this.props.onCancel}
        onConfirm={this.props.onConfirm}>
        {content}
      </Modal>
    );
  }
}
