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
  debug: process.env.SENTRY_ENV !== 'production',
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
    replay,
    Sentry.captureConsoleIntegration({ levels: ['error']}),
    Sentry.browserTracingIntegration(),
  ],
});

// eslint-disable-next-line no-undef
console.log('Sentry initialized with DSN:', b4aSettings.SENTRY_DSN);
console.log('isRecordEverySession', isRecordEverySession);

// Function to detect and handle deployments screen
function handleDeploymentScreenRecording() {
  const currentPath = window.location.pathname;
  const isDeploymentPath = currentPath.split('/').includes('deployments');

  if (isDeploymentPath) {
    // Set deployment-specific context
    Sentry.setTag('screen', 'deployments');
    Sentry.setContext('deployment_screen', {
      path: currentPath,
      timestamp: new Date().toISOString(),
      recordEverySession: isRecordEverySession
    });

    console.log('Deployment screen detected, setting Sentry context');

    // Force start replay for deployments if needed
    if (isRecordEverySession) {
      replay.start();
      console.log('Started replay for deployment screen');
    }
  } else {
    // Clear deployment-specific tags for non-deployment screens
    Sentry.setTag('screen', 'other');
    Sentry.setContext('deployment_screen', null);
  }
}

// Handle initial page load
if (typeof window !== 'undefined') {
  handleDeploymentScreenRecording();

  // Listen for navigation events
  window.addEventListener('navigate', (event) => {
    console.log('navigate event');
    const url = new URL(event.destination.url);
    const isDeploymentPath = url.pathname.split('/').includes('deployments');
    console.log('isDeploymentPath', isDeploymentPath);

    // Update Sentry context based on new path
    if (isDeploymentPath) {
      Sentry.setTag('screen', 'deployments');
      Sentry.setContext('deployment_screen', {
        path: url.pathname,
        timestamp: new Date().toISOString(),
        recordEverySession: isRecordEverySession
      });

      if (isRecordEverySession) {
        replay.start();
        console.log('Started replay for deployment screen navigation');
      }
    } else {
      Sentry.setTag('screen', 'other');
      Sentry.setContext('deployment_screen', null);
    }
  });

  // Also listen for React Router navigation (since you're using React Router)
  window.addEventListener('popstate', handleDeploymentScreenRecording);
} else {
  console.log('window is undefined');
}
