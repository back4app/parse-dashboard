/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import Immutable from 'immutable';
import installDevTools from 'immutable-devtools';
import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: `${b4aSettings.BACK4APP_SENTRY_DSN_URL}`,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [/^https:\/\/back4app.com\/me/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

require('stylesheets/fonts.scss');
require('graphiql/graphiql.min.css');
installDevTools(Immutable);

const path = window.PARSE_DASHBOARD_PATH || '/';
ReactDOM.render(<Dashboard path={path} />, document.getElementById('browser_mount'));
