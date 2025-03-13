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
import Icon from 'components/Icon/Icon.react';
import { useState } from 'react';
import SystemLogsCard from './SystemLogsCard.react';


@withRouter
class AppOverview extends DashboardView {
  constructor() {
    super();
    this.section = 'Overview';
    this.noteTimeout = null;

    this.state = {
      appKeys: new Map(),
      isLoadingServerLogs: true,
      serverLogs: '',
    };
    this.copyText = this.copyText.bind(this);
    this.loadCardInformation = this.loadCardInformation.bind(this);
  }

  componentWillMount() {
    const currentApp = this.context;
    const appKeys = new Map(Object.entries(currentApp).filter(([k]) => k.includes('Key')));
    this.setState({
      appKeys,
    });
    if (currentApp.serverInfo.status === 'SUCCESS') {
      this.loadCardInformation();
    }
  }

  copyText(copyText = '') {
    if (navigator) {
      navigator.clipboard.writeText(copyText);
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextContext.serverInfo.status === 'SUCCESS') {
      this.loadCardInformation(nextContext);
    }
  }

  loadCardInformation(currentApp) {
    currentApp = currentApp ? currentApp : this.context

    // load server logs
    currentApp.fetchServerLogs().then(
      res => {
        this.setState({
          serverLogs: res.docker,
          isLoadingServerLogs: false
        });
      },
      err => this.setState({ serverLogs: '', isLoadingServerLogs: false })
    );

    // load app plan information
    // load app request informatio

  }


  renderContent() {
    // const isLoading = this.context.serverInfo.status !== 'SUCCESS';
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>Overview</div>
        </div>
        <div className={styles.content}>
          <div className={styles.appName}>Welcome to your App: <strong>{this.context.name}</strong></div>
          <div className={styles.appInfoCard}>
            <div className={styles.appKeysBox}>
              <div className={styles.appInfoCardHeader}>App Name</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#CCC'}}>App ID:</span> {' '}
                  {this.context.applicationId}
                </div>
                <div style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => this.copyText(this.context.applicationId)}>
                  <Icon name='b4a-copy-icon' fill="#15A9FF" width={14} height={14} />
                </div>
              </div>
              <hr />
              <AppKeysComponent appKeys={this.state.appKeys} copyText={this.copyText} />
              <hr />
              <button className={styles.appContentBtn}>Connect App</button>
            </div>
            <div className={styles.appInformationBox}>
              <div className={styles.appInfoCardHeader}>App Information</div>
              <div className="">
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>Parse Server Version: </span>{this.context.parseServerVersion}</div>
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>Database: </span>MongoDB</div>
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>API URL: </span>{this.context.serverURL}</div>
                <div style={{ marginBottom: '8px' }}><span className={styles.greyText}>Hosting Region: </span>North Virginia</div>
              </div>
            </div>
          </div>

          {/* System Logs Card */}
          <SystemLogsCard loading={this.state.isLoadingServerLogs} logs={this.state.serverLogs} appSlug={this.context.slug} />
        </div>
      </div>
    );
  }
}

export default AppOverview;


const AppKeysComponent = ({appKeys, copyText}) => {
  const [selectedKey, setSelectedKey] = useState('javascriptKey')

  return <div className={styles.appKeyWrapper}>
    <label htmlFor='appKeys'>Keys: </label>
    <div className="">
      <select name="appKeys" className={styles.appKeySelect} value={selectedKey} defaultValue={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
        {[...appKeys.entries()].map(([key]) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      <div style={{ paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {appKeys.get(selectedKey)}
        <div style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => copyText(appKeys.get(selectedKey))}>
          <Icon name='b4a-copy-icon' fill="#15A9FF" width={14} height={14} />
        </div>
      </div>
    </div>
  </div>
}
