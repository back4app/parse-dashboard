/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import AppSelector from 'dashboard/AppSelector.react';
import AppsManager from 'lib/AppsManager';
import { CurrentApp } from 'context/currentApp';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import baseStyles from 'stylesheets/base.scss';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';

function AppData() {
  const navigate = useNavigate();
  const params = useParams();

  if (params.appId === '_') {
    return <AppSelector />;
  }

  // Find by name to catch edge cases around escaping apostrophes in URLs
  const current = AppsManager.findAppBySlugOrName(params.appId);

  if (current) {
    if (current.useLatestDashboardVersion === false) {
      window.location.replace(`${b4aSettings.PARSE_DASHBOARD_PATH}/apps/${params.appId}`);
    }

    current.setParseKeys();
    if (current.serverInfo.error && window.location.pathname.split('/')[3] !== 'overview') {
      navigate(`/apps/${current.slug}/overview`, { replace: true });
      return <div />;
      // return (
      //   <div className={baseStyles.pageCenter}>
      //     <EmptyGhostState
      //       title={'Couldn\'t load this app'}
      //       description={
      //         'Something went wrong while loading this app, could you please try opening another app.'
      //       }
      //       cta={'Go to apps'}
      //       action={() => (window.location = '/apps')}
      //     ></EmptyGhostState>
      //   </div>
      // );
    }
  } else {
    navigate('/apps', { replace: true });
    return <div />;
  }

  return (
    <CurrentApp.Provider value={current}>
      <Outlet />
    </CurrentApp.Provider>
  );
}

export default AppData;
