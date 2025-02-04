import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

console.log('sentry init file');
console.log(process.env.NODE_ENV);

Sentry.init({
  dsn: b4aSettings.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
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
    }),
    Sentry.captureConsoleIntegration({ levels: ['error']}),
    Sentry.browserTracingIntegration(),
  ],
});
