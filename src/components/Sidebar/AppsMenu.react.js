/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AppName from 'components/Sidebar/AppName.react';
import html from 'lib/htmlString';
import { Link } from 'react-router-dom';
import React from 'react';
import styles from 'components/Sidebar/B4aSidebar.scss';
import baseStyles from 'stylesheets/base.scss';
import Icon from 'components/Icon/Icon.react';

const AppsMenu = ({ apps, current, height, onSelect, onPinClick }) => (
  <div style={{ height }} className={[styles.appsMenu, baseStyles.unselectable].join(' ')}>
    <AppName
      name={current.name}
      onClick={onSelect.bind(null, current.slug)}
      onPinClick={onPinClick}
    />
    <div className={styles.menuSection}>All Apps</div>
    <div className={styles.appListContainer}>
      {apps.map(app => {
        if (app.slug === current.slug) {
          return null;
        }
        const isDisabled = app.serverInfo.error || app.serverInfo.status === 'LOADING';
        const classes = [styles.menuRow];
        if (isDisabled) {
          classes.push(styles.disabledLink);
        }
        return (
          <Link
            to={html`/apps/${app.slug}/overview`}
            key={app.slug}
            className={styles.menuRow}
            onClick={onSelect.bind(null, current.slug)}
          >
            <span>{app.name}</span>
            {app.serverInfo.error && <span className={styles.appStatus}><Icon name='exclaimation-circle' width={20} height={20} fill='#eb445b' /></span>}
            {app.serverInfo.status === 'LOADING' && <span className={styles.appStatus}><div className={styles.spinner}></div></span>}
          </Link>
        );
      })}
    </div>
  </div>
);

export default AppsMenu;
