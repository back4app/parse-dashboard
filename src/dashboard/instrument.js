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
const isRecordEverySession = (process.env.SENTRY_ENV === 'production' || process.env.SENTRY_ENV === 'homolog') && isLessThan2Hours;
const replaysSessionSampleRate = isRecordEverySession ? 1.0 : 0.1;

export default function instrument() {
  console.log('isRecordEverySession', isRecordEverySession);
  console.log('replaysSessionSampleRate', replaysSessionSampleRate);
  console.log(new Date(process.env.BUILD_TIMESTAMP).getTime());

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
    replaysSessionSampleRate,
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

export function useDeploymentsPageTracking() {
  const location = useLocation();

  useEffect(() => {
    const deploymentsPagePattern = /^\/apps\/[^\/]+\/deployments/;
    const isDeploymentsPage = deploymentsPagePattern.test(location.pathname);

    if (isDeploymentsPage) {
      Sentry.setTag('page_type', 'deployments');
      Sentry.setTag('deployments_page', true);

      const appIdMatch = location.pathname.match(/^\/apps\/([^\/]+)\/deployments/);
      if (appIdMatch && appIdMatch[1]) {
        Sentry.setTag('app_id', appIdMatch[1]);
      }

      Sentry.addBreadcrumb({
        message: 'User navigated to deployments page',
        category: 'navigation',
        level: 'info',
        data: {
          pathname: location.pathname,
          appId: appIdMatch ? appIdMatch[1] : null,
        }
      });
    } else {
      Sentry.setTag('page_type', null);
      Sentry.setTag('deployments_page', null);
    }
  }, [location.pathname]);
}
