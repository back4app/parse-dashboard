/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import styles from 'dashboard/Dashboard.scss';

export default class AccountView extends React.Component {
  render() {
    return (
      <div className={styles.apps}>
        <div className={styles.appContent}>{this.props.children}</div>
      </div>
    );
  }
}
