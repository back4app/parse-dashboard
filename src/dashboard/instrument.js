import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

// eslint-disable-next-line no-undef
const isLessThan2Hours = (Date.now() - new Date(process.env.BUILD_TIMESTAMP)) < (1000 * 60 * 60 * (b4aSettings.SENTRY_RECORD_X_HOURS || 1));
const isRecordEverySession = false;

export default function instrument() {
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
    debug: false,
    dsn: b4aSettings.SENTRY_DSN,
    environment: process.env.SENTRY_ENV,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: isRecordEverySession ? 1.0 : 0,
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
}

Sentry.setTag('project', 'Backend Dashboard');

// const ALLOWED_PAGE_NAMES = ['cloud_code', 'database_profiler'];

export function useAppPageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Match pattern: /apps/appId/pageName/section - if exists/...
    const appPagePattern = /^\/apps\/([^\/]+)\/([^\/]+|)(?:\/([^\/]+))?/;

    const match = location.pathname.match(appPagePattern);
    const replay = Sentry.getReplay && Sentry.getReplay();

    if (match) {
      let pageName;
      const section = match[3];

      if (section && typeof section === 'string') {
        if (section === 'database-profiler') {
          pageName = 'database_profiler';
        }
      }

      if (!pageName) {
        pageName = match[2];
      }

      Sentry.setTag('page_type', pageName);
      console.log('pageName', pageName);

      if (!isRecordEverySession && replay) {
        if (pageName === 'database_profiler' || pageName === 'cloud_code') {
          replay.start();
        } else {
          replay.stop();
        }
      }

      Sentry.addBreadcrumb({
        message: `User navigated to ${pageName} page`,
        category: 'navigation',
        level: 'info',
        data: {
          pathname: location.pathname,
          pageName: pageName,
        }
      });
    } else {
      Sentry.setTag('page_type', null);
      if (!isRecordEverySession && replay) {
        replay.stop();
      }
    }
  }, [location.pathname]);
}
