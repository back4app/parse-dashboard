import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';


// eslint-disable-next-line no-undef
const isLessThan2Hours = (Date.now() - new Date(process.env.BUILD_TIMESTAMP)) < (1000 * 60 * 60 * (b4aSettings.SENTRY_RECORD_X_HOURS || 2));
const isRecordEverySession = (process.env.SENTRY_ENV === 'production' || process.env.SENTRY_ENV === 'homolog') && isLessThan2Hours;

Sentry.init({
  debug: true,
  dsn: b4aSettings.SENTRY_DSN,
  environment: process.env.SENTRY_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: isRecordEverySession ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  maxBreadcrumbs: 100,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration({
      stickySession: true,
      maskAllText: false,
      blockAllMedia: true,
      minReplayDuration: 5000,
      maskAllInputs: false,
      networkDetailAllowUrls: [/(https?:\/\/(.+?\.)?back4app\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/g],
      networkRequestHeaders: ['X-Custom-Header'],
      networkResponseHeaders: ['X-Custom-Header'],
    }),
    Sentry.captureConsoleIntegration({ levels: ['error']}),
    Sentry.browserTracingIntegration(),
  ],
});

