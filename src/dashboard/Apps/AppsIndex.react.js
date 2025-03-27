/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AppsManager from 'lib/AppsManager';
import FlowFooter from 'components/FlowFooter/FlowFooter.react';
import html from 'lib/htmlString';
import Icon from 'components/Icon/Icon.react';
import joinWithFinal from 'lib/joinWithFinal';
import EmptyGhostState from '../../components/EmptyGhostState/EmptyGhostState.react';
import loadingImg from './loadingIcon.png';
import LiveReload from 'components/LiveReload/LiveReload.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import styles from 'dashboard/Apps/AppsIndex.scss';
import { withRouter } from 'lib/withRouter';
import { useNavigate } from 'react-router-dom';

function dash(value, content) {
  if (value === undefined) {
    return '-';
  }
  if (content === undefined) {
    return value;
  }
  return content;
}
/* eslint-disable no-unused-vars */
const CloningNote = ({ app, clone_status, clone_progress }) => {
  /* eslint-enable */
  if (clone_status === 'failed') {
    //TODO: add a way to delete failed clones, like in old dash
    return <div>Clone failed</div>;
  }
  const progress = (
    <LiveReload
      initialData={[{ appId: app.applicationId, progress: clone_progress }]}
      source="/apps/cloning_progress"
      render={data => {
        const currentAppProgress = data.find(({ appId }) => appId === app.applicationId);
        const progressStr = currentAppProgress ? currentAppProgress.progress.toString() : '0';
        return <span>{progressStr}</span>;
      }}
    />
  );
  return <div>Cloning is {progress}% complete</div>;
};

const CountsSection = ({ className, title, children }) => (
  <div className={className}>
    <div className={styles.section}>{title}</div>
    {children}
  </div>
);

const Metric = props => {
  return (
    <div className={styles.count}>
      <div className={styles.label}>{props.label}: </div>
      <div className={styles.number}>{props.number}</div>
    </div>
  );
};

const AppCard = ({ app, icon }) => {
  const navigate = useNavigate();
  // const canBrowse = app.serverInfo.error ? null : () => navigate(html`/apps/${app.slug}/overview`);
  const canBrowse = () => navigate(html`/apps/${app.slug}/overview`);
  const versionMessage = app.serverInfo.error ?
    <div className={styles.serverVersion}>Server not reachable: <span className={styles.ago}>{app.serverInfo.error.toString()}</span></div>
    :
    <div className={styles.serverVersion}>
      Server URL: <span className={styles.ago}>{app.serverURL || 'unknown'}</span>
      Server version: <span className={styles.ago}>{app.serverInfo.parseServerVersion || 'unknown'}</span>
    </div>;

  let appStatusIcon;
  const appNameStyles = [styles.appname];
  const appIconStyle = [styles.icon];

  // if (app.serverInfo.status === 'LOADING') {
  //   appStatusIcon = <img src={loadingImg} alt="loading..." className={styles.loadingIcon} />
  //   appNameStyles.push(styles.loading);
  // }

  if (app.serverInfo.status === 'ERROR') {
    appStatusIcon = <Icon name='warn-triangle-outline' fill='#FBFF3B' width={16} height={16} />
    appNameStyles.push(styles.disabled);
    appIconStyle.push(styles.disabled);
  }

  return (
    <li onClick={canBrowse} style={{ background: app.primaryBackgroundColor }}>
      <div className={styles.details}>
        <a className={styles.appname}>{app.name} {appStatusIcon}</a>
        {versionMessage}
      </div>
      <CountsSection className={styles.glance} title="Stats">
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Metric number={dash(app.users, prettyNumber(app.users))} label="Total Users" />
          <Metric
            number={dash(app.installations, prettyNumber(app.installations))}
            label="Installations"
          />
        </div>
      </CountsSection>
    </li>
  );
};

@withRouter
class AppsIndex extends React.Component {
  constructor() {
    super();
    this.state = { search: '' };
    this.focusField = this.focusField.bind(this);
    this.getAppsIndexStats = this.getAppsIndexStats.bind(this);
    this.searchRef = React.createRef();
  }

  componentWillMount() {
    document.body.addEventListener('keydown', this.focusField);
    // AppsManager.getAllAppsIndexStats().then(() => {
    //   this.forceUpdate();
    // });
  }

  componentWillReceiveProps(nextProps) {
    // If single app, then redirect to browser
    if (AppsManager.apps().length === 1) {
      const [app] = AppsManager.apps();
      this.props.navigate(`/apps/${app.slug}/overview`);
      return;
    }
    // compare nextProps with prevProps to know for which app's serverInfo changed
    // to SUCCESS then, make _User & _Installation class count request
    // and update that app
    for (let idx = 0; idx < nextProps.apps.length; idx++) {
      const nextApp = nextProps.apps[idx];
      const prevApp = this.props.apps.find(ap => ap.applicationId === nextApp.applicationId);

      if (nextApp.serverInfo.status !== prevApp.serverInfo.status && nextApp.serverInfo.status === 'SUCCESS') {
        // app's status changed
        this.getAppsIndexStats(nextApp);
        this.forceUpdate();
      }
    }

  }

  componentWillUnmount() {
    document.body.removeEventListener('keydown', this.focusField);
  }

  // Fetch the latest usage and request info for the apps index
  async getAppsIndexStats(app) {
    const installationCount = await app.getClassCount('_Installation');
    const userCount = await app.getClassCount('_User');
    app.installations = installationCount;
    app.users = userCount;
    this.props.updateApp(app);
  }

  updateSearch(e) {
    this.setState({ search: e.target.value });
  }

  focusField() {
    if (this.searchRef.current) {
      this.searchRef.current.focus();
    }
  }

  render() {
    const search = this.state.search.toLowerCase();
    const apps = AppsManager.apps();
    const sortedApps = apps.sort(function (app1, app2) {
      return app1.name.localeCompare(app2.name);
    });

    if (apps.length === 0) {
      return (
        <div className={styles.empty}>
          <EmptyGhostState
            title="You don't have any apps"
            description='Create a new app or clone a database from database hub'
            cta="Create a new app"
            // eslint-disable-next-line no-undef
            action={() => window.location = `${b4aSettings.DASHBOARD_PATH}/apps/new`}
            secondaryCta="Go to database hub"
            // eslint-disable-next-line no-undef
            secondaryAction={() => window.location = b4aSettings.HUB_URL} />
        </div>
      );
    }
    let upgradePrompt = null;
    if (this.props.newFeaturesInLatestVersion.length > 0) {
      const newFeaturesNodes = this.props.newFeaturesInLatestVersion.map(feature => (
        <strong>{feature}</strong>
      ));
      upgradePrompt = (
        <FlowFooter>
          Upgrade to the{' '}
          <a href="https://www.npmjs.com/package/parse-dashboard" target="_blank">
            latest version
          </a>{' '}
          of Backend Dashboard to get access to: {joinWithFinal('', newFeaturesNodes, ', ', ' and ')}.
        </FlowFooter>
      );
    }
    return (
      <div className={styles.index}>
        <div className={styles.header}>
          <div className={styles.headingText}>
            <Icon width={24} height={24} name="apps-icon" fill="#f9f9f9" />
            <span>Backend Apps</span>
          </div>
          <div className={styles.searchInput}>
            <Icon width={18} height={18} name="b4a-browser-filter-icon" fill="#f9f9f9" />
            <input
              ref={this.searchRef}
              className={styles.search}
              onChange={this.updateSearch.bind(this)}
              value={this.state.search}
              placeholder="Start typing to filter&hellip;"
            />
          </div>
        </div>
        <ul className={styles.apps}>
          {sortedApps.map(app =>
            app.name.toLowerCase().indexOf(search) > -1 ? (
              <AppCard key={app.slug} app={app} icon={app.icon ? app.icon : null} />
            ) : null
          )}
        </ul>
        {upgradePrompt}
      </div>
    );
  }
}

export default AppsIndex;
