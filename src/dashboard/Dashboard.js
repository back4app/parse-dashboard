/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager from 'lib/AccountManager'; // user workaround
// import AccountOverview from './Account/AccountOverview.react';
import AppData from './AppData.react';
import AppsIndex from './Apps/AppsIndex.react';
import AppsManager from 'lib/AppsManager';
import AppOverview from './Data/AppOverview/AppOverview.react';
import FourOhFour from 'components/FourOhFour/FourOhFour.react';
import B4aLoader from 'components/B4aLoader/B4aLoader.react';
import { AsyncStatus } from 'lib/Constants';
import { get } from 'lib/AJAX';
import { setBasePath } from 'lib/AJAX';
import { Helmet } from 'react-helmet';
import axios from 'lib/axios';
import moment from 'moment';
import AccountView from './AccountView.react';
import ParseApp from 'lib/ParseApp';
import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import styles from 'dashboard/Apps/AppsIndex.scss';
import baseStyles from 'stylesheets/base.scss';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@back4app2/react-components';
import back4app2 from '../lib/back4app2';
import { initializeAmplitude } from 'lib/amplitudeEvents';
import { setUser as setSentryUser } from '@sentry/react';

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

// Lazy load components that aren't needed for the overview route
const ApiConsoleLazy = React.lazy(() => import('./Data/ApiConsole/ApiConsole.react'));
const BrowserLazy = React.lazy(() => import('./Data/Browser/Browser.react'));
const CloudCodeLazy = React.lazy(() => import('./Data/CloudCode/B4ACloudCode.react'));
const ConfigLazy = React.lazy(() => import('./Data/Config/Config.react'));
const GeneralSettingsLazy = React.lazy(() => import('./Settings/GeneralSettings.react'));
const GraphQLConsoleLazy = React.lazy(() => import('./Data/ApiConsole/GraphQLConsole.react'));
const HostingSettingsLazy = React.lazy(() => import('./Settings/HostingSettings.react'));
const HubConnectionsLazy = React.lazy(() => import('./Hub/HubConnections.react'));
const IndexManagerLazy = React.lazy(() => import('./IndexManager/IndexManager.react'));
const JobEditLazy = React.lazy(() => import('dashboard/Data/Jobs/JobEdit.react'));
const JobsLazy = React.lazy(() => import('./Data/Jobs/Jobs.react'));
const JobsDataLazy = React.lazy(() => import('dashboard/Data/Jobs/JobsData.react'));
const InfoLogsLazy = React.lazy(() => import('./Data/Logs/InfoLogs.react'));
const ErrorLogsLazy = React.lazy(() => import('./Data/Logs/ErrorLogs.react'));
const AccessLogsLazy = React.lazy(() => import('./Data/Logs/AccessLogs.react'));
const SystemLogsLazy = React.lazy(() => import('./Data/Logs/SystemLogs.react'));
const B4aAdminPageLazy = React.lazy(() => import('./B4aAdminPage/B4aAdminPage.react'));
const B4aWebDeploymentLazy = React.lazy(() => import('./B4aWebDeployment/B4aWebDeployment.react'));
const ServerSettingsLazy = React.lazy(() => import('dashboard/ServerSettings/ServerSettings.react'));
const PlaygroundLazy = React.lazy(() => import('./Data/Playground/Playground.react'));
const B4aConnectPageLazy = React.lazy(() => import('./B4aConnectPage/B4aConnectPage.react'));
const MigrationLazy = React.lazy(() => import('./Data/Migration/Migration.react'));
const PushAudiencesIndexLazy = React.lazy(() => import('./Push/PushAudiencesIndex.react'));
const PushDetailsLazy = React.lazy(() => import('./Push/PushDetails.react'));
const PushIndexLazy = React.lazy(() => import('./Push/PushIndex.react'));
const PushNewLazy = React.lazy(() => import('./Push/PushNew.react'));
const PushSettingsLazy = React.lazy(() => import('./Settings/PushSettings.react'));
const RestConsoleLazy = React.lazy(() => import('./Data/ApiConsole/RestConsole.react'));
const SchemaOverviewLazy = React.lazy(() => import('./Data/Browser/SchemaOverview.react'));
const SecuritySettingsLazy = React.lazy(() => import('./Settings/SecuritySettings.react'));
const SettingsDataLazy = React.lazy(() => import('./Settings/SettingsData.react'));
const SlowQueriesLazy = React.lazy(() => import('./Analytics/SlowQueries/SlowQueries.react'));
const UsersSettingsLazy = React.lazy(() => import('./Settings/UsersSettings.react'));
const WebhooksLazy = React.lazy(() => import('./Data/Webhooks/Webhooks.react'));
const SecurityLazy = React.lazy(() => import('./Settings/Security/Security.react'));

// Add a loading component for Suspense fallback
const LoadingComponent = () => (
  <div className={baseStyles.center}>
    <B4aLoader />
  </div>
);

// Wrap the component that needs code splitting with Suspense
const LazyComponentWrapper = ({ children }) => (
  <Suspense fallback={<LoadingComponent />}>
    {children}
  </Suspense>
);

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
        user.createdAt = userDetail.createdAt;
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
      setSentryUser({
        id: user.email,
        email: user.email,
        username: user.email,
        ip_address: '{{auto}}',
      });


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
            } else if (error.code === 402) {
              app.serverInfo = {
                error: 'This application has exceeded the plan\'s limits and payment is required.',
                enabledFeatures: {},
                parseServerVersion: 'unknown',
                status: 'ERROR',
                code: 402
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
      <Route element={<LazyComponentWrapper><SettingsDataLazy /></LazyComponentWrapper>}>
        <Route path='security' element={<LazyComponentWrapper><SecurityLazy /></LazyComponentWrapper>} />
        <Route path='general' element={<LazyComponentWrapper><GeneralSettingsLazy /></LazyComponentWrapper>} />
        <Route path='keys' element={<LazyComponentWrapper><SecuritySettingsLazy /></LazyComponentWrapper>} />
        <Route path='users' element={<LazyComponentWrapper><UsersSettingsLazy /></LazyComponentWrapper>} />
        <Route path='push' element={<LazyComponentWrapper><PushSettingsLazy /></LazyComponentWrapper>} />
        <Route path='hosting' element={<LazyComponentWrapper><HostingSettingsLazy /></LazyComponentWrapper>} />
        <Route index element={<Navigate replace to='general' />} />
      </Route>
    );

    const JobsRoute = (
      <Route element={<LazyComponentWrapper><JobsDataLazy /></LazyComponentWrapper>}>
        <Route path="new" element={<LazyComponentWrapper><JobEditLazy /></LazyComponentWrapper>} />
        <Route path="edit/:jobId" element={<LazyComponentWrapper><JobEditLazy /></LazyComponentWrapper>} />
        <Route path=":section" element={<LazyComponentWrapper><JobsLazy /></LazyComponentWrapper>} />
        <Route index element={<Navigate replace to="all" />} />
      </Route>
    );

    const AnalyticsRoute = (
      <Route>
        <Route path="slow_requests" element={<LazyComponentWrapper><SlowQueriesLazy /></LazyComponentWrapper>} />
        <Route index element={<Navigate replace to="slow_requests" />} />
      </Route>
    );

    const LogsRoute = (
      <Route>
        <Route path="info" element={<LazyComponentWrapper><InfoLogsLazy /></LazyComponentWrapper>} />
        <Route path="error" element={<LazyComponentWrapper><ErrorLogsLazy /></LazyComponentWrapper>} />
        <Route path="system" element={<LazyComponentWrapper><SystemLogsLazy /></LazyComponentWrapper>} />
        <Route path="access" element={<LazyComponentWrapper><AccessLogsLazy /></LazyComponentWrapper>} />
        <Route index element={<Navigate replace to="system" />} />
      </Route>
    );

    const BrowserRoute = ShowSchemaOverview ? 
      <LazyComponentWrapper><SchemaOverviewLazy /></LazyComponentWrapper> : 
      <LazyComponentWrapper><BrowserLazy /></LazyComponentWrapper>;

    const ApiConsoleRoute = (
      <Route element={<LazyComponentWrapper><ApiConsoleLazy /></LazyComponentWrapper>}>
        <Route path="rest" element={<LazyComponentWrapper><RestConsoleLazy /></LazyComponentWrapper>} />
        <Route path="graphql" element={<LazyComponentWrapper><GraphQLConsoleLazy /></LazyComponentWrapper>} />
        <Route path="js_console" element={<LazyComponentWrapper><PlaygroundLazy /></LazyComponentWrapper>} />
        <Route index element={<Navigate replace to="rest" />} />
      </Route>
    );

    const AppRoute = (
      <Route element={<AppData />}>
        <Route index element={<Navigate replace to="overview" />} />
        <Route path="overview" element={<AppOverview />} />

        <Route path="browser/:className/:entityId/:relationName" element={BrowserRoute} />
        <Route path="browser/:className" element={BrowserRoute} />
        <Route path="browser" element={BrowserRoute} />

        <Route path="cloud_code" element={<LazyComponentWrapper><CloudCodeLazy /></LazyComponentWrapper>} />
        <Route path="webhooks" element={<LazyComponentWrapper><WebhooksLazy /></LazyComponentWrapper>} />
        <Route path="config" element={<LazyComponentWrapper><ConfigLazy /></LazyComponentWrapper>} />

        <Route path="jobs">{JobsRoute}</Route>
        <Route path="logs">{LogsRoute}</Route>
        <Route path="api_console">{ApiConsoleRoute}</Route>

        <Route path="migration" element={<LazyComponentWrapper><MigrationLazy /></LazyComponentWrapper>} />

        <Route path="push" element={<Navigate replace to="new" />} />
        <Route path="push/activity" element={<Navigate replace to="all" />} />
        <Route path="push/activity/:category" element={<LazyComponentWrapper><PushIndexLazy /></LazyComponentWrapper>} />
        <Route path="push/audiences" element={<LazyComponentWrapper><PushAudiencesIndexLazy /></LazyComponentWrapper>} />
        <Route path="push/new" element={<LazyComponentWrapper><PushNewLazy /></LazyComponentWrapper>} />
        <Route path="push/:pushId" element={<LazyComponentWrapper><PushDetailsLazy /></LazyComponentWrapper>} />

        <Route path="connect" element={<LazyComponentWrapper><B4aConnectPageLazy /></LazyComponentWrapper>} />
        <Route path="admin" element={<LazyComponentWrapper><B4aAdminPageLazy /></LazyComponentWrapper>} />

        <Route path="server-settings/" element={<LazyComponentWrapper><ServerSettingsLazy /></LazyComponentWrapper>} />
        <Route path="server-settings/:targetPage" element={<LazyComponentWrapper><ServerSettingsLazy /></LazyComponentWrapper>} />

        <Route path="index/:className" element={<LazyComponentWrapper><IndexManagerLazy /></LazyComponentWrapper>} />
        <Route path="index" element={<LazyComponentWrapper><IndexManagerLazy /></LazyComponentWrapper>} />

        <Route path="connections" element={<LazyComponentWrapper><HubConnectionsLazy /></LazyComponentWrapper>} />
        <Route path="analytics">{AnalyticsRoute}</Route>
        <Route path="settings">{SettingsRoute}</Route>
        <Route path="web-deployment" element={<LazyComponentWrapper><B4aWebDeploymentLazy /></LazyComponentWrapper>} />
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
      }

      setUser(user);

      let appsPlans;

      try {
        appsPlans = await back4app2.findAppsPlans();
      } catch (e) {
        console.error('unexpected error when finding apps plans', e);

        return;
      }

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
    back4appContainersApiURL={b4aSettings.CONTAINERS_API_PATH}
  />
}

const DashboardWrapper = () => {
  return (
    <BrowserRouter basename={window.PARSE_DASHBOARD_PATH || '/'}>
      <Helmet>
        <title>Backend Dashboard</title>
      </Helmet>
      <div style={{ overflowX: 'clip' }}>
        <NavbarWrapper />
      </div>
      <Dashboard />
    </BrowserRouter>
  );
}

export default DashboardWrapper;
