/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager from 'lib/AccountManager'; // user workaround
// import AccountOverview from './Account/AccountOverview.react';
import ApiConsole from './Data/ApiConsole/ApiConsole.react';
import AppData from './AppData.react';
import AppsIndex from './Apps/AppsIndex.react';
import AppsManager from 'lib/AppsManager';
import Browser from './Data/Browser/Browser.react';
import CloudCode from './Data/CloudCode/B4ACloudCode.react';
// import CloudCode from './Data/CloudCode/CloudCode.react';
import Config from './Data/Config/Config.react';
import Explorer from './Analytics/Explorer/Explorer.react';
import FourOhFour from 'components/FourOhFour/FourOhFour.react';
import GeneralSettings from './Settings/GeneralSettings.react';
import GraphQLConsole from './Data/ApiConsole/GraphQLConsole.react';
import HostingSettings from './Settings/HostingSettings.react';
import HubConnections from './Hub/HubConnections.react';
// import Icon from 'components/Icon/Icon.react';
import IndexManager from './IndexManager/IndexManager.react'
import JobEdit from 'dashboard/Data/Jobs/JobEdit.react';
import Jobs from './Data/Jobs/Jobs.react';
import JobsData from 'dashboard/Data/Jobs/JobsData.react';
import B4aLoader from 'components/B4aLoader/B4aLoader.react';
import InfoLogs from './Data/Logs/InfoLogs.react';
import ErrorLogs from './Data/Logs/ErrorLogs.react';
import AccessLogs from './Data/Logs/AccessLogs.react';
import SystemLogs from './Data/Logs/SystemLogs.react';
// import B4aHubPublishPage from './B4aHubPublishPage/B4aHubPublishPage.react';
import B4aAdminPage from './B4aAdminPage/B4aAdminPage.react';
import B4aAppTemplates from './B4aAppTemplates/B4aAppTemplates.react';
import { AsyncStatus } from 'lib/Constants';
import { get } from 'lib/AJAX';
import { setBasePath } from 'lib/AJAX';
import ServerSettings from 'dashboard/ServerSettings/ServerSettings.react';
// // import createClass from 'create-react-class';
import { Helmet } from 'react-helmet';
import Playground from './Data/Playground/Playground.react';
import axios from 'lib/axios';
import moment from 'moment';
import B4aConnectPage from './B4aConnectPage/B4aConnectPage.react';
// // import EmptyState from 'components/EmptyState/EmptyState.react';
import BlockchainPage from './BlockchainPage/BlockChainPage.react';
import AccountView from './AccountView.react';
import AnalyticsOverview from './Analytics/Overview/Overview.react';

import Migration from './Data/Migration/Migration.react';
import ParseApp from 'lib/ParseApp';
import Performance from './Analytics/Performance/Performance.react';
import PushAudiencesIndex from './Push/PushAudiencesIndex.react';
import PushDetails from './Push/PushDetails.react';
import PushIndex from './Push/PushIndex.react';
import PushNew from './Push/PushNew.react';
import PushSettings from './Settings/PushSettings.react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RestConsole from './Data/ApiConsole/RestConsole.react';
import Retention from './Analytics/Retention/Retention.react';
import SchemaOverview from './Data/Browser/SchemaOverview.react';
import SecuritySettings from './Settings/SecuritySettings.react';
import SettingsData from './Settings/SettingsData.react';
import SlowQueries from './Analytics/SlowQueries/SlowQueries.react';
import styles from 'dashboard/Apps/AppsIndex.scss';
import UsersSettings from './Settings/UsersSettings.react';
import Webhooks from './Data/Webhooks/Webhooks.react';
import baseStyles from 'stylesheets/base.scss';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import DashboardSettings from './Settings/DashboardSettings/DashboardSettings.react';
import Security from './Settings/Security/Security.react';
import { Navbar } from '@back4app2/react-components';
import back4app2 from '../lib/back4app2';
import { initializeAmplitude, initializeLogRocketSession } from 'lib/amplitudeEvents';

const ShowSchemaOverview = false; //In progress features. Change false to true to work on this feature.

class Empty extends React.Component {
  render() {
    return <div>Not yet implemented</div>;
  }
}

const AccountSettingsPage = () => (
  <AccountView section="Account Settings">
    <AccountOverview />
  </AccountView>
);

async function fetchHubUser() {
  try {
    // eslint-disable-next-line no-undef
    return (await axios.get(`${b4aSettings.BACK4APP_API_PATH}/me/hub`, { withCredentials: true })).data;
  } catch (err) {
    throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
  }
}

const PARSE_DOT_COM_SERVER_INFO = {
  features: {
    schemas: {
      addField: true,
      removeField: true,
      addClass: true,
      removeClass: true,
      clearAllDataFromClass: false, //This still goes through ruby
      exportClass: false, //Still goes through ruby
    },
    cloudCode: {
      viewCode: true,
    },
    hooks: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    logs: {
      info: true,
      error: true,
    },
    globalConfig: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    playground: {
      evalCode: true,
    },
  },
  parseServerVersion: 'Parse.com',
  status: 'SUCCESS',
}

const monthQuarter = {
  '0': 'Q1',
  '1': 'Q2',
  '2': 'Q3',
  '3': 'Q4'
};

const waitForScriptToLoad = async conditionFn => {
  for (let i = 1; i <= 20; i++) {
    if (conditionFn()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, i * 50));
  }
  throw new Error('Script not loaded yet!');
};

class Dashboard extends React.Component {
  constructor(props) {
    super();
    this.state = {
      configLoadingError: '',
      configLoadingState: AsyncStatus.PROGRESS,
      newFeaturesInLatestVersion: [],
      apps: []
    };
    // eslint-disable-next-line react/prop-types
    setBasePath(props.path);
    this.updateApp = this.updateApp.bind(this);
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('password');
  }

  componentDidMount() {
    get('/parse-dashboard-config.json').then(({ apps, newFeaturesInLatestVersion = [], user }) => {
      fetchHubUser().then(userDetail => {
        const now = moment();
        const hourDiff = now.diff(userDetail.createdAt, 'hours');
        if(hourDiff === 0){
          return;
        }
        if (userDetail.disableSolucxForm) {
          return;
        }
        // Flow1 are users who signed up less than 30 days ago (720 hours)
        const isFlow1 = hourDiff <= 720 ? true : false;
        let transactionId = userDetail.id;
        if(!isFlow1){
          const quarter = monthQuarter[parseInt(now.month() / 3)];
          transactionId += `${now.year()}${quarter}`;
        }
        const options = {
          transaction_id: transactionId,
          store_id: isFlow1 ? '1001' : '1002',
          name: userDetail.username,
          email: userDetail.username,
          journey: isFlow1 ? 'csat-back4app' : 'nps-back4app',
        };
        const retryInterval = isFlow1 ? 5 : 45;
        const collectInterval = isFlow1 ? 30 : 90;
        options.param_requestdata = encodeURIComponent(JSON.stringify({
          userDetail,
          options,
          localStorage: localStorage.getItem('solucxWidgetLog-' + userDetail.username)
        }));
        // eslint-disable-next-line no-undef
        waitForScriptToLoad(() => typeof createSoluCXWidget === 'function').then(() => {
          // eslint-disable-next-line no-undef
          createSoluCXWidget(
            process.env.SOLUCX_API_KEY,
            'bottomBoxLeft',
            options,
            { collectInterval, retryAttempts: 1, retryInterval }
          );
        }).catch(err => console.log(err));
      });

      const stateApps = [];
      apps.forEach(app => {
        app.serverInfo = { status: 'LOADING' };
        AppsManager.addApp(app);
        stateApps.push(new ParseApp(app));
      });

      AccountManager.setCurrentUser({ user });
      this.setState({ newFeaturesInLatestVersion, apps: stateApps, configLoadingState: AsyncStatus.SUCCESS });

      if (!user.backendBetaUser && b4aSettings.BACKEND_DASHBOARD_IS_BETA) {
        window.location.replace(b4aSettings.PARSE_DASHBOARD_PATH);
      }

      initializeAmplitude(user.email);
      waitForScriptToLoad(() => typeof window.LogRocket !== 'undefined').then(() => {
        // eslint-disable-next-line no-undef
        initializeLogRocketSession(user.email);
      }).catch(err => console.log(err));

      // fetch serverInfo request for each app
      apps.forEach(async (app) => {
        // Set master key as a default string to avoid undefined value access issues
        if (!app.masterKey) {app.masterKey = '******'}
        if (app.serverURL.startsWith('https://api.parse.com/1')) {
          //api.parse.com doesn't have feature availability endpoint, fortunately we know which features
          //it supports and can hard code them
          app.serverInfo = PARSE_DOT_COM_SERVER_INFO;
          AppsManager.updateApp(app);
        } else {
          let updatedApp;
          try {
            const serverInfo = await (new ParseApp(app).apiRequest('GET', 'serverInfo', {}, { useMasterKey: true }));
            app.serverInfo = { ...serverInfo, status: 'SUCCESS' };
            updatedApp = AppsManager.updateApp(app);
            this.updateApp(updatedApp);
          } catch (error) {
            if (error.code === 100) {
              app.serverInfo = {
                error: 'unable to connect to server',
                enabledFeatures: {},
                parseServerVersion: 'unknown',
                status: 'ERROR'
              }
            } else if (error.code === 107) {
              app.serverInfo = {
                error: 'server version too low',
                enabledFeatures: {},
                parseServerVersion: 'unknown',
                status: 'ERROR'
              }
            } else {
              app.serverInfo = {
                error: error.message || 'unknown error',
                enabledFeatures: {},
                parseServerVersion: 'unknown',
                status: 'ERROR'
              }
            }
            updatedApp = AppsManager.updateApp(app);
            this.updateApp(updatedApp);
          }
        }
      });
    }).catch((error) => {
      console.log(error);
      this.setState({
        configLoadingError: error.message,
        configLoadingState: AsyncStatus.FAILED
      });
    });
  }

  updateApp(app) {
    const updatedApps = [...this.state.apps];
    const appIdx = updatedApps.findIndex(ap => ap.applicationId === app.applicationId);
    if (appIdx === -1) {return;}
    updatedApps[appIdx] = app;
    this.setState({
      apps: updatedApps
    });
  }

  render() {
    if (this.state.configLoadingState === AsyncStatus.PROGRESS) {
      return (
        <div className={baseStyles.center} style={{ background: '#0F1C32' }}>
          <B4aLoader />
        </div>
      );
    }

    if (this.state.configLoadingError && this.state.configLoadingError.length > 0) {
      return (
        <div className={styles.empty}>
          <div className={baseStyles.center}>
            <div className={styles.cloud}>
              <Icon width={110} height={110} name="cloud-surprise" fill="#1e3b4d" />
            </div>
            {/* use non-breaking hyphen for the error message to keep the filename on one line */}
            <div className={styles.loadingError}>
              {this.state.configLoadingError.replace(/-/g, '\u2011')}
            </div>
          </div>
        </div>
      );
    }

    const AppsIndexPage = (
      <AccountView section="Your Apps" style={{top: '0px'}}>
        <AppsIndex apps={this.state.apps} updateApp={this.updateApp} newFeaturesInLatestVersion={this.state.newFeaturesInLatestVersion} />
      </AccountView>
    );

    const SettingsRoute = (
      <Route element={<SettingsData />}>
        {/* <Route path='dashboard' element={<DashboardSettings />} /> */}
        <Route path='security' element={<Security />} />
        <Route path='general' element={<GeneralSettings />} />
        <Route path='keys' element={<SecuritySettings />} />
        <Route path='users' element={<UsersSettings />} />
        <Route path='push' element={<PushSettings />} />
        <Route path='hosting' element={<HostingSettings />} />
        <Route index element={<Navigate replace to='general' />} />
      </Route>
    );

    const JobsRoute = (
      <Route element={<JobsData />}>
        <Route path="new" element={<JobEdit />} />
        <Route path="edit/:jobId" element={<JobEdit />} />
        <Route path=":section" element={<Jobs />} />
        <Route index element={<Navigate replace to="all" />} />
      </Route>
    );

    const AnalyticsRoute = (
      <Route>
        {/* <Route path="overview" element={<AnalyticsOverview />} />
        <Route path="explorer/:displayType" element={<Explorer />} />
        <Route path="retention" element={<Retention />} />
        <Route path="performance" element={<Performance />} /> */}
        {/* <Route path="slow_queries" element={<SlowQueries />} /> */}
        <Route path="slow_requests" element={<SlowQueries />} />
        <Route index element={<Navigate replace to="slow_requests" />} />
        {/* <Route index element={<Navigate replace to="performance" />} /> */}
        {/* <Route path="explorer" element={<Navigate replace to="chart" />} /> */}
      </Route>
    );

    const LogsRoute = (
      <Route>
        <Route path="info" element={<InfoLogs />} />
        <Route path="error" element={<ErrorLogs />} />
        <Route index element={<Navigate replace to="system" />} />
        <Route path="system" element={<SystemLogs />} />
        <Route path="access" element={<AccessLogs /> } />
      </Route>
    );

    const BrowserRoute = ShowSchemaOverview ? SchemaOverview : Browser;

    const ApiConsoleRoute = (
      <Route element={<ApiConsole />}>
        <Route path="rest" element={<RestConsole />} />
        <Route path="graphql" element={<GraphQLConsole />} />
        <Route path="js_console" element={<Playground />} />
        <Route index element={<Navigate replace to="rest" />} />
      </Route>
    );

    const AppRoute = (
      <Route element={<AppData />}>
        <Route index element={<Navigate replace to="browser" />} />

        <Route path="getting_started" element={<Empty />} />

        <Route path="browser/:className/:entityId/:relationName" element={<BrowserRoute />} />
        <Route path="browser/:className" element={<BrowserRoute />} />
        <Route path="browser" element={<BrowserRoute />} />

        <Route path="cloud_code" element={<CloudCode />} />
        <Route path="webhooks" element={<Webhooks />} />

        <Route path="jobs">{JobsRoute}</Route>
        <Route path="logs">{LogsRoute}</Route>

        <Route path="config" element={<Config />} />

        <Route path="api_console">{ApiConsoleRoute}</Route>

        <Route path="migration" element={<Migration />} />

        <Route path="push" element={<Navigate replace to="new" />} />
        <Route path="push/activity" element={<Navigate replace to="all" />} />

        <Route path="push/activity/:category" element={<PushIndex />} />
        <Route path="push/audiences" element={<PushAudiencesIndex />} />
        <Route path="push/new" element={<PushNew />} />
        <Route path="push/:pushId" element={<PushDetails />} />

        <Route path="connect" element={<B4aConnectPage />} />
        <Route path="admin" element={<B4aAdminPage />} />
        {/* <Route path="app-templates" element={<B4aAppTemplates />} /> */}

        <Route path="server-settings/" element={<ServerSettings />} />
        <Route path="server-settings/:targetPage" element={<ServerSettings />} />

        <Route path="index/:className" element={<IndexManager />} />
        <Route path="index" element={<IndexManager />} />

        {/* <Route path="blockchain" element={<BlockchainPage /> } /> */}

        <Route path="connections" element={<HubConnections />} />
        <Route path="analytics">{AnalyticsRoute}</Route>
        <Route path="settings">{SettingsRoute}</Route>
        {/* {user.allowHubPublish && <Route path="hub-publish" element={<B4aHubPublishPage />} />} */}
      </Route>
    );

    const Index = (
      <Route>
        <Route index element={AppsIndexPage} />
        <Route path=":appId">{AppRoute}</Route>
      </Route>
    );

    return (
      <Routes>
        <Route path="/apps">{Index}</Route>
        <Route path="account/overview" element={<AccountSettingsPage />} />
        <Route path="account" element={<Navigate replace to="overview" />} />
        <Route index element={<Navigate replace to="/apps" />} />
        <Route path="*" element={<FourOhFour />} />
      </Routes>
    );
  }
}

const parseHref = (href) => {
  if (href.startsWith(window.location.origin)) {
    return href.replace(window.location.origin, '');
  } else {
    return href;
  }
}

const LinkImpl = ({ href, className, children }) => {
  href = parseHref(href);

  if (href.startsWith('http')) {
    return <a href={href} className={className}>
      {children}
    </a>;
  } else {
    return <Link to={href} className={className}>
      {children}
    </Link>;
  }
}

const NavbarWrapper = () => {
  const [user, setUser] = useState();
  const [appsPlans, setAppsPlans] = useState();

  useEffect(() => {
    (async () => {
      let user;

      try {
        user = await back4app2.me();
      } catch (e) {
        console.error('unexpected error when getting user', e);

        window.location.replace(`${b4aSettings.BACK4APP_SITE_PATH}/login?return-url=${encodeURIComponent(window.location.href)}`);

        return;
      };

      setUser(user);

      let appsPlans;

      try {
        appsPlans = await back4app2.findAppsPlans();
      } catch (e) {
        console.error('unexpected error when finding apps plans', e);

        return;
      };

      setAppsPlans(appsPlans);
    })();
  }, []);

  const location = useLocation();
  const pathname = location.pathname;

  const navigate = useNavigate();
  const push = useCallback((url) => {
    url = parseHref(url);

    if (url.startsWith('http')) {
      window.location.assign(url);
    } else {
      navigate(url);
    }
  }, [navigate]);
  const replace = useCallback((url) => {
    url = parseHref(url);

    if (url.startsWith('http')) {
      window.location.replace(url);
    } else {
      navigate(url, { replace: true });
    }
  }, [navigate]);

  const router = useMemo(() => ({
    pathname,
    push,
    replace
  }), [pathname, push, replace]);

  return <Navbar
    user={user}
    overLimitAppsPlansCount={(appsPlans && appsPlans.filter(appPlan => appPlan.status === 'OVER_LIMITS').length) || undefined}
    router={router}
    Link={LinkImpl}
    parseDashboardURL={b4aSettings.BACKEND_DASHBOARD_PATH}
    containersDashboardURL={b4aSettings.CONTAINERS_DASHBOARD_PATH}
    back4appDotComSiteURL={b4aSettings.BACK4APP_SITE_PATH}
    back4appDotComOldSiteURL={b4aSettings.BACK4APP_SITE_PATH}
    back4appDotComDashboardURL={b4aSettings.DASHBOARD_PATH}
  />
}

const DashboardWrapper = () => {
  return (
    <BrowserRouter basename={window.PARSE_DASHBOARD_PATH || '/'}>
      <Helmet>
        <title>Backend Dashboard</title>
      </Helmet>
      <NavbarWrapper />
      <Dashboard />
    </BrowserRouter>
  );
}

export default DashboardWrapper;
