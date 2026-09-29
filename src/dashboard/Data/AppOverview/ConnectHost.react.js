import React, { Suspense, lazy, useContext, useEffect, useState } from 'react';
import { CurrentApp } from 'context/currentApp';
import { OPEN_CONNECT_EVENT } from './connectEvents';

const LazyConnectModal = lazy(() => import('./ConnectModal.react'));

/**
 * Holds the Connect modal for the current app and opens it on the tab asked
 * for by openConnect() — from the sidebar's Connect button, Get connected on
 * the Overview, or the onboarding steps.
 */
const ConnectHost = () => {
  const app = useContext(CurrentApp);
  const [tab, setTab] = useState(null);

  useEffect(() => {
    import('./ConnectModal.react');
    const onOpen = event => setTab((event.detail && event.detail.tab) || 'mcp');
    window.addEventListener(OPEN_CONNECT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONNECT_EVENT, onOpen);
  }, []);

  // Switching apps closes it: its keys and URL belong to the previous app.
  useEffect(() => {
    setTab(null);
  }, [app]);

  if (!tab || !app) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <LazyConnectModal key={tab} closeModal={() => setTab(null)} context={app} initialTab={tab} />
    </Suspense>
  );
};

export default ConnectHost;
