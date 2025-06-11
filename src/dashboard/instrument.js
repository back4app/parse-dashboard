import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

// eslint-disable-next-line no-undef
const isLessThan2Hours = (Date.now() - new Date(process.env.BUILD_TIMESTAMP)) < (1000 * 60 * 5);
const isRecordEverySession = (process.env.SENTRY_ENV === 'production' || process.env.SENTRY_ENV === 'homolog') && isLessThan2Hours;

const replay = Sentry.replayIntegration({
  stickySession: true,
  maskAllText: false,
  blockAllMedia: true,
  minReplayDuration: 5000,
  maskAllInputs: false,
  networkDetailAllowUrls: [/(https?:\/\/(.+?\.)?back4app\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/g],
  networkRequestHeaders: ['X-Custom-Header'],
  networkResponseHeaders: ['X-Custom-Header'],
})

Sentry.init({
  debug: process.env.NODE_ENV !== 'production',
  dsn: b4aSettings.SENTRY_DSN,
  environment: process.env.SENTRY_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0,
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
    replay,
    Sentry.captureConsoleIntegration({ levels: ['error']}),
    Sentry.browserTracingIntegration(),
  ],
});

window.addEventListener('navigate', (event) => {
  const url = new URL(event.destination.url);

  let isDeploymentPath = false;
  isDeploymentPath = url.pathname.split('/').includes('deployments');
  console.log('isDeploymentPath', isDeploymentPath);
  console.log('isRecordEverySession', isRecordEverySession);

  if (isDeploymentPath && isRecordEverySession) {
    replay.start();
  }
});


export default function instrument() {
  console.log('');
}
