/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager     from 'lib/AccountManager'; // user workaround
import AccountOverview    from './Account/AccountOverview.react';
import AccountView        from './AccountView.react';
import AnalyticsOverview  from './Analytics/Overview/Overview.react';
import ApiConsole         from './Data/ApiConsole/ApiConsole.react';
import AppData            from './AppData.react';
import AppsIndex          from './Apps/AppsIndex.react';
import AppsManager        from 'lib/AppsManager';
import Browser            from './Data/Browser/Browser.react';
import CloudCode          from './Data/CloudCode/B4ACloudCode.react';
import Config             from './Data/Config/Config.react';
import Explorer           from './Analytics/Explorer/Explorer.react';
import FourOhFour         from 'components/FourOhFour/FourOhFour.react';
import GeneralSettings    from './Settings/GeneralSettings.react';
import GraphQLConsole     from './Data/ApiConsole/GraphQLConsole.react';
import history            from 'dashboard/history';
import HostingSettings    from './Settings/HostingSettings.react';
import HubConnections     from './Hub/HubConnections.react';
import Icon               from 'components/Icon/Icon.react';
import IndexManager       from './IndexManager/IndexManager.react'
import JobEdit            from 'dashboard/Data/Jobs/JobEdit.react';
import Jobs               from './Data/Jobs/Jobs.react';
import JobsData           from 'dashboard/Data/Jobs/JobsData.react';
import Loader             from 'components/Loader/Loader.react';
import Logs               from './Data/Logs/Logs.react';
import InfoLogs           from './Data/Logs/InfoLogs.react';
import ErrorLogs          from './Data/Logs/ErrorLogs.react';
import AccessLogs         from './Data/Logs/AccessLogs.react';
import SystemLogs         from './Data/Logs/SystemLogs.react';
import Migration          from './Data/Migration/Migration.react';
import ParseApp           from 'lib/ParseApp';
import Performance        from './Analytics/Performance/Performance.react';
import PushAudiencesIndex from './Push/PushAudiencesIndex.react';
import PushDetails        from './Push/PushDetails.react';
import PushIndex          from './Push/PushIndex.react';
import PushNew            from './Push/PushNew.react';
import PushSettings       from './Settings/PushSettings.react';
import React              from 'react';
import RestConsole        from './Data/ApiConsole/RestConsole.react';
import Retention          from './Analytics/Retention/Retention.react';
import SchemaOverview     from './Data/Browser/SchemaOverview.react';
import SecuritySettings   from './Settings/SecuritySettings.react';
import SettingsData       from './Settings/SettingsData.react';
import SlowQueries        from './Analytics/SlowQueries/SlowQueries.react';
import styles             from 'dashboard/Apps/AppsIndex.scss';
import UsersSettings      from './Settings/UsersSettings.react';
import Webhooks           from './Data/Webhooks/Webhooks.react';
import B4aHubPublishPage       from './B4aHubPublishPage/B4aHubPublishPage.react';
import B4aAdminPage       from './B4aAdminPage/B4aAdminPage.react';
import B4aAppTemplates    from './B4aAppTemplates/B4aAppTemplates.react';
import { AsyncStatus }    from 'lib/Constants';
import { center }         from 'stylesheets/base.scss';
import { get }            from 'lib/AJAX';
import { setBasePath }    from 'lib/AJAX';
import ServerSettings     from 'dashboard/ServerSettings/ServerSettings.react';
import {
  Router,
  Switch,
} from 'react-router';
import { Route, Redirect } from 'react-router-dom';
import createClass from 'create-react-class';
import { Helmet } from 'react-helmet';
import Playground from './Data/Playground/Playground.react';
import axios from "lib/axios";
import moment from 'moment';
import B4aConnectPage from './B4aConnectPage/B4aConnectPage.react';

const ShowSchemaOverview = false; //In progress features. Change false to true to work on this feature.

let Empty = createClass({
  render() {
    return <div>Not yet implemented</div>;
  }
});

const AccountSettingsPage = () => (
    <AccountView section='Account Settings'>
      <AccountOverview />
    </AccountView>
  );

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
      evalCode: true
    }
  },
  parseServerVersion: 'Parse.com',
}

export default class Dashboard extends React.Component {
  constructor(props) {
    super();
    this.state = {
      configLoadingError: '',
      configLoadingState: AsyncStatus.PROGRESS,
      newFeaturesInLatestVersion: [],
    };
    setBasePath(props.path);
  }

  componentDidMount() {
    get('/parse-dashboard-config.json').then(({ apps, newFeaturesInLatestVersion = [], user }) => {

      AccountManager.setCurrentUser({ user });
      this.setState({ newFeaturesInLatestVersion });
      let appInfoPromises = apps.map(app => {
        // Set master key as a default string to avoid undefined value access issues
        if (!app.masterKey) app.masterKey = "******"
        if (app.serverURL.startsWith('https://api.parse.com/1')) {
          //api.parse.com doesn't have feature availability endpoint, fortunately we know which features
          //it supports and can hard code them
          app.serverInfo = PARSE_DOT_COM_SERVER_INFO;
          return Promise.resolve(app);
        } else {
          app.serverInfo = {}
          return new ParseApp(app).apiRequest(
            'GET',
            'serverInfo',
            {},
            { useMasterKey: true }
          ).then(serverInfo => {
            app.serverInfo = serverInfo;
            return app;
          }, error => {
            if (error.code === 100) {
              app.serverInfo = {
                error: 'unable to connect to server',
                enabledFeatures: {},
                parseServerVersion: 'unknown'
              }
              return Promise.resolve(app);
            } else if (error.code === 107) {
              app.serverInfo = {
                error: 'server version too low',
                enabledFeatures: {},
                parseServerVersion: 'unknown'
              }
              return Promise.resolve(app);
            } else {
              app.serverInfo = {
                error: error.message || 'unknown error',
                enabledFeatures: {},
                parseServerVersion: 'unknown'
              }
              return Promise.resolve(app);
            }
          });
        }
      });
      return Promise.all(appInfoPromises);
    }).then(function(resolvedApps) {
      if(resolvedApps && Array.isArray(resolvedApps)) {
        resolvedApps.forEach(app => {
          AppsManager.addApp(app);
        });
      } else {
        Array.prototype.slice.call(arguments).forEach(app => {
          AppsManager.addApp(app);
        });
      }
      this.setState({ configLoadingState: AsyncStatus.SUCCESS });
    }.bind(this)).catch(({ error }) => {
      this.setState({
        configLoadingError: error,
        configLoadingState: AsyncStatus.FAILED
      });
    });
  }

  render() {
    if (this.state.configLoadingState === AsyncStatus.PROGRESS) {
      return <div className={center}><Loader/></div>;
    }

    if (this.state.configLoadingError && this.state.configLoadingError.length > 0) {
      return <div className={styles.empty}>
        <div className={center}>
          <div className={styles.cloud}>
            <Icon width={110} height={110} name='cloud-surprise' fill='#1e3b4d' />
          </div>
          {/* use non-breaking hyphen for the error message to keep the filename on one line */}
          <div className={styles.loadingError}>{this.state.configLoadingError.replace(/-/g, '\u2011')}</div>
        </div>
      </div>
    }

    const AppsIndexPage = () => (
      <AccountView section='Your Apps' style={{top: '0px'}}>
        <AppsIndex newFeaturesInLatestVersion={this.state.newFeaturesInLatestVersion}/>
      </AccountView>
    );

    const SettingsRoute = ({ match }) => (
      <SettingsData params={ match.params }>
        {settingsDataProps => (
          <>
            <Route path={ match.url + '/general' } render={props => (
              <GeneralSettings {...props} {...settingsDataProps} />
            )} />
            <Route path={ match.url + '/keys' } component={SecuritySettings} />
            <Route path={ match.url + '/users' } component={UsersSettings} />
            <Route path={ match.url + '/push' } component={PushSettings} />
            <Route path={ match.url + '/hosting' } component={HostingSettings} />
          </>
        )}
      </SettingsData>
    )

    const JobsRoute = (props) => (
      <Switch>
        <Route exact path={ props.match.path + '/new' } render={(props) => (
          <JobsData {...props} params={props.match.params}>
            <JobEdit params={props.match.params}/>
          </JobsData>
        )} />
        <Route path={ props.match.path + '/edit/:jobId' } render={(props) => (
          <JobsData {...props} params={props.match.params}>
            <JobEdit params={props.match.params}/>
          </JobsData>
        )} />
        <Route path={ props.match.path + '/:section' } render={(props) => (
          <JobsData {...props} params={props.match.params}>
            <Jobs {...props} params={props.match.params}/>
          </JobsData>
        )} />
        <Redirect from={ props.match.path } to='/apps/:appId/jobs/all' />
      </Switch>
    )

    const AnalyticsRoute = ({ match }) => (
      <Switch>
        <Route path={ match.path + '/overview' } component={AnalyticsOverview} />
        <Redirect exact from={ match.path + '/explorer' } to='/apps/:appId/analytics/explorer/chart' />
        <Route path={ match.path + '/explorer/:displayType' } render={props => (
          <Explorer {...props} params={props.match.params} />
        )} />
        <Route path={ match.path + '/retention' } component={Retention} />
        <Route path={ match.path + '/performance' } component={Performance} />
        <Route path={ match.path + '/slow_queries' } component={SlowQueries} />
        <Route path={ match.path + '/slow_requests' } component={SlowQueries} />
      </Switch>
    );

    const logsRoute = ({ match }) => (
      <Switch>
        <Route path={ match.path + '/info' } component={InfoLogs} />
        <Route path={ match.path + '/error' } component={ErrorLogs} />
        <Redirect exact from={ match.path } to='/apps/:appId/logs/Info' />
        <Route path={ match.path + '/system' } component={SystemLogs} />
        <Route path={ match.path + '/access' } component={AccessLogs} /> 
      </Switch>
    );

    const BrowserRoute = (props) => {
      if (ShowSchemaOverview) {
        return <SchemaOverview {...props} params={props.match.params} />
      }
      return <Browser {...props} params={ props.match.params } />
    }

    const ApiConsoleRoute = (props) => (
      <Switch>
        <Route path={ props.match.path + '/rest' } render={props => (
          <ApiConsole {...props}>
            <RestConsole />
          </ApiConsole>
        )} />
        <Route path={ props.match.path + '/graphql' } render={props => (
          <ApiConsole {...props}>
            <GraphQLConsole />
          </ApiConsole>
        )} />
        <Route path={ props.match.path + '/js_console' } render={props => (
          <ApiConsole {...props}>
            <Playground />
          </ApiConsole>
        )} />
        <Redirect from={ props.match.path } to='/apps/:appId/api_console/rest' />
      </Switch>
    )

    const AppRoute = ({ match }) => (
      <AppData params={ match.params }>
        <Switch>
          <Route path={ match.path + '/getting_started' } component={Empty} />
          <Route path={ match.path + '/browser/:className/:entityId/:relationName' } component={BrowserRoute} />
          <Route path={ match.path + '/browser/:className' } component={BrowserRoute} />
          <Route path={ match.path + '/browser' } component={BrowserRoute} />
          <Route path={ match.path + '/cloud_code' } render={(props) => (
            <CloudCode {...props} params={match.params} />
          )} />
          <Redirect from={ match.path + '/cloud_code/*' } to='/apps/:appId/cloud_code' />
          <Route path={ match.path + '/webhooks' } component={Webhooks} />

          <Route path={ match.path + '/jobs' } component={JobsRoute}/>

          <Route path={ match.path + '/logs' } component={logsRoute}/>

          <Route path={ match.path + '/config' } component={Config} />
          <Route path={ match.path + '/api_console' } component={ApiConsoleRoute} />
          <Route path={ match.path + '/migration' } component={Migration} />


          <Redirect exact from={ match.path + '/push' } to='/apps/:appId/push/new' />
          <Redirect exact from={ match.path + '/push/activity' } to='/apps/:appId/push/activity/all'  />

          <Route path={ match.path + '/push/activity/:category' } render={(props) => (
            <PushIndex {...props} params={props.match.params} />
          )} />
          <Route path={ match.path + '/push/audiences' } component={PushAudiencesIndex} />
          <Route path={ match.path + '/push/new' } component={PushNew} />
          <Route path={ match.path + '/push/:pushId' } render={(props) => (
            <PushDetails {...props} params={props.match.params} />
          )} />
          <Route path={ match.path + '/hub-publish' } component={B4aHubPublishPage} />
          <Route path={ match.path + '/connect' } component={B4aConnectPage} />
          <Route path={ match.path + '/admin' } component={B4aAdminPage} />
          <Route path={ match.path + '/app-templates' } component={B4aAppTemplates} />
          <Route path={ match.path + '/server-settings/:targetPage?' } render={(props) => (
            <ServerSettings params={props.match.params} />
          )} />
          <Route exact path={ match.path + '/connections' } component={HubConnections} />
          <Route exact path={ match.path + '/index' } render={props => <IndexManager {...props} params={props.match.params} />} />
          <Route path={ match.path + '/index/:className'} render={props => <IndexManager {...props} params={props.match.params} />} />

          {/* Unused routes... */}
          <Redirect exact from={ match.path + '/analytics' } to='/apps/:appId/analytics/performance' />
          <Route path={ match.path + '/analytics' } component={AnalyticsRoute}/>
          <Redirect exact from={ match.path + '/settings' } to='/apps/:appId/settings/general' />
          <Route path={ match.path + '/settings' } component={SettingsRoute}/>
        </Switch>
      </AppData>
    )

    const Index = () => (
      <div>
        <Switch>
          <Redirect exact from='/apps/:appId' to='/apps/:appId/browser' />
          <Route exact path='/apps' component={AppsIndexPage} />
          <Route path='/apps/:appId' component={AppRoute} />
        </Switch>
      </div>
    )
    return (
      <Router history={history}>
        <div>
          <Helmet>
            <title>Parse Dashboard</title>
          </Helmet>
          <Switch>
            <Route path='/apps' component={Index} />
            <Route path='/account/overview' component={AccountSettingsPage} />
            <Redirect from='/account' to='/account/overview' />
            <Redirect from='/' to='/apps' />
            <Route path='*' component={FourOhFour} />
          </Switch>
        </div>
      </Router>
    );
  }
}
