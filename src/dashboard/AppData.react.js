/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React          from 'react';
import AppSelector    from 'dashboard/AppSelector.react';
import AppsManager    from 'lib/AppsManager';
import { CurrentApp } from 'context/currentApp';
import { Outlet, useNavigate , useParams} from 'react-router-dom';


<<<<<<< HEAD
  getChildContext() {
    return {
      generatePath: this.generatePath,
      currentApp: this.props.apps.find(ap => ap.slug === this.props.params.appId)
    };
  },

  generatePath(path) {
    return '/apps/' + this.props.params.appId + '/' + path;
  },

  render() {
    if (this.props.params.appId === '_') {
      return <AppSelector />;
    }
    //Find by name to catch edge cases around escaping apostrophes in URLs
    let current = this.props.apps.find(ap => ap.slug === this.props.params.appId);
    if (current) {
      current.setParseKeys();
    } else {
      history.replace('/apps');
      return <div />;
    }
    return (
      <div>
        {this.props.children}
      </div>
    );
=======
function AppData() {
  const navigate = useNavigate();
  const params = useParams();

  if (params.appId === '_') {
    return <AppSelector />;
>>>>>>> origin/upstream
  }

  // Find by name to catch edge cases around escaping apostrophes in URLs
  let current = AppsManager.findAppBySlugOrName(params.appId);

  if (current) {
    current.setParseKeys();
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
