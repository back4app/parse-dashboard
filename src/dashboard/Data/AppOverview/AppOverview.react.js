/* eslint-disable no-undef */
/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import { withRouter } from 'lib/withRouter';
// import Icon from 'components/Icon/Icon.react';


@withRouter
class AppOverview extends DashboardView {
  constructor() {
    super();
    this.section = 'Overview';
    this.noteTimeout = null;

    this.state = {};
  }

  renderContent() {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>Overview</div>
        </div>
        <div className={styles.content}>
          <div className={styles.appName}>Welcome to your App: <strong>{this.context.name}</strong></div>
          <div className={styles.appInfoCard}>
            <div className="">
              <div className="">App Name</div>
              <div className="">App ID: {this.context.applicationId}</div>
              <hr />
              <div className="">
              </div>
            </div>
            <div className="">
              <div className="">App Information</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AppOverview;
