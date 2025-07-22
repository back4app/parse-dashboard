/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Icon from 'components/Icon/Icon.react';
import { Link } from 'react-router-dom';
import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import styles from 'components/Sidebar/B4aSidebar.scss';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';

const LazyB4aApiIcon = lazy(() => import('components/Sidebar/icons/B4aApiIcon.react'));
const LazyB4aDatabaseIcon = lazy(() => import('components/Sidebar/icons/B4aDatabaseIcon.react'));
const LazyB4aCloudCodeIcon = lazy(() => import('components/Sidebar/icons/B4aCloudCodeIcon.react'));
const LazyB4aWebDeploymentIcon = lazy(() => import('components/Sidebar/icons/B4aWebDeploymentIcon.react'));
const LazyB4aMoreIcon = lazy(() => import('components/Sidebar/icons/B4aMoreIcon.react'));
const LazyB4aOverviewIcon = lazy(() => import('components/Sidebar/icons/B4aOverviewIcon.react'));
const LazyB4aAppSettingsIcon = lazy(() => import('components/Sidebar/icons/B4aAppSettingsIcon.react'));
const LazyB4aPlanUsageIcon = lazy(() => import('components/Sidebar/icons/B4aPlanUsageIcon.react'));
const LazyB4aReportsIcon = lazy(() => import('components/Sidebar/icons/B4aReportsIcon.react'));

// Preload functions for each lazy icon
LazyB4aApiIcon.preload = () => import('components/Sidebar/icons/B4aApiIcon.react');
LazyB4aDatabaseIcon.preload = () => import('components/Sidebar/icons/B4aDatabaseIcon.react');
LazyB4aCloudCodeIcon.preload = () => import('components/Sidebar/icons/B4aCloudCodeIcon.react');
LazyB4aWebDeploymentIcon.preload = () => import('components/Sidebar/icons/B4aWebDeploymentIcon.react');
LazyB4aMoreIcon.preload = () => import('components/Sidebar/icons/B4aMoreIcon.react');
LazyB4aOverviewIcon.preload = () => import('components/Sidebar/icons/B4aOverviewIcon.react');
LazyB4aAppSettingsIcon.preload = () => import('components/Sidebar/icons/B4aAppSettingsIcon.react');
LazyB4aPlanUsageIcon.preload = () => import('components/Sidebar/icons/B4aPlanUsageIcon.react');
LazyB4aReportsIcon.preload = () => import('components/Sidebar/icons/B4aReportsIcon.react');

const sendEvent = () => {
  // eslint-disable-next-line no-undef
  // back4AppNavigation && back4AppNavigation.atApiReferenceIntroEvent && back4AppNavigation.atApiReferenceIntroEvent()
  amplitudeLogEvent('at API Reference Introduction');
}

const getIconContent = (icon) => {
  switch (icon) {
    case 'b4a-api-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aApiIcon />
        </Suspense>
      );
    case 'b4a-database-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aDatabaseIcon />
        </Suspense>
      );
    case 'b4a-cloud-code-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aCloudCodeIcon />
        </Suspense>
      );
    case 'b4a-web-deployment-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aWebDeploymentIcon />
        </Suspense>
      );
    case 'b4a-more-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aMoreIcon />
        </Suspense>
      );
    case 'b4a-app-overview-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aOverviewIcon />
        </Suspense>
      );
    case 'b4a-app-settings-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aAppSettingsIcon />
        </Suspense>
      );
    case 'b4a-plan-usage-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aPlanUsageIcon />
        </Suspense>
      );
    case 'b4a-reports-icon':
      return (
        <Suspense fallback={null}>
          <LazyB4aReportsIcon />
        </Suspense>
      );
    default:
      return null;
  }
}

const B4aSidebarSection = ({ active, children, name, link, icon, style, primaryBackgroundColor, secondaryBackgroundColor, isCollapsed, onClick, badge, locked }) => {
  const classes = [styles.section, 'section']; // Adding 'section' for the Tour to be able to select
  const [showPopoverSection, setShowPopoverSection] = useState(false);
  const [position, setPosition] = useState(null);
  const subSectionRef = useRef();

  // Preload all icons on mount
  useEffect(() => {
    LazyB4aApiIcon.preload();
    LazyB4aDatabaseIcon.preload();
    LazyB4aCloudCodeIcon.preload();
    LazyB4aWebDeploymentIcon.preload();
    LazyB4aMoreIcon.preload();
    LazyB4aOverviewIcon.preload();
    LazyB4aAppSettingsIcon.preload();
    LazyB4aPlanUsageIcon.preload();
    LazyB4aReportsIcon.preload();
  }, []);

  useEffect(() => {
    if (showPopoverSection) {
      const node = subSectionRef.current;
      const pos = Position.inDocument(node);
      const { width } = node.getBoundingClientRect();
      pos.x += width;
      setPosition(pos);
    }
  }, [showPopoverSection]);

  if (active) {
    classes.push(styles.active);
  }
  if (isCollapsed) {
    classes.push(styles.collapsed);
  }

  let iconContent = icon && <Icon width={20} height={20} name={icon} fill='#ffffff' />;
  if (active) {
    iconContent = getIconContent(icon);
  }
  const textContent = !isCollapsed && <span>{name}</span>;
  const sectionContent = active
    ? <div className={styles.section_header} style={{ ...style, background: primaryBackgroundColor, justifyContent: isCollapsed ? 'center' : '' }} onClick={onClick}>{iconContent}{textContent}{badge}</div>
    : link.startsWith('/')
      ? <Link style={style} className={styles.section_header} to={{ pathname: link || '' }} onClick={onClick}>{iconContent}{textContent}{badge}</Link>
      : <a style={style} className={styles.section_header} href={link} target="_blank" onClick={() => sendEvent()}>{iconContent}{textContent}{badge}</a>;

  let popover = null;

  if (showPopoverSection && children && !locked) {
    popover = <Popover fixed={true} position={position} contentId={`POPOVER_CONTENT_${name}`} color="#102542">
      <div className={`${styles.section_contents} ${styles.popover}`} id="section_contents" style={{ background: secondaryBackgroundColor}}>{children}</div>
    </Popover>
  }

  if (locked) {
    classes.push(styles.locked);
  }

  return (
    <div className={classes.join(' ')} title={isCollapsed && name} ref={subSectionRef} onMouseEnter={isCollapsed ? () => setShowPopoverSection(true) : null} onMouseLeave={isCollapsed ? () => setShowPopoverSection(false) : null}>
      {sectionContent}
      {!isCollapsed && children && !locked ? <div className={`${styles.section_contents}`} id="section_contents" style={{ background: secondaryBackgroundColor}}>{children}</div> : null}
      {popover}
    </div>
  );
};

export default B4aSidebarSection;
