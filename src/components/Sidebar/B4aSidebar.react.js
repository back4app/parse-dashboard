/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AppsManager from 'lib/AppsManager';
import FooterMenu from 'components/Sidebar/FooterMenu.react';
import React, { useEffect, useState, useContext, useRef } from 'react';
// import SidebarHeader  from 'components/Sidebar/SidebarHeader.react';
import B4aSidebarSection from 'components/Sidebar/B4aSidebarSection.react';
import SidebarSubItem from 'components/Sidebar/SidebarSubItem.react';
import styles from 'components/Sidebar/B4aSidebar.scss';
import Icon from 'components/Icon/Icon.react';
import { isMobile } from 'lib/browserUtils';
import B4aBadge from 'components/B4aBadge/B4aBadge.react';
import AppsMenu from 'components/Sidebar/AppsMenu.react';
import AppName from 'components/Sidebar/AppName.react';
import { CurrentApp } from 'context/currentApp';

// let isSidebarFixed = !isMobile();
let isSidebarCollapsed = undefined;

const B4aSidebar = ({
  showTour,
  prefix,
  action,
  actionHandler,
  children,
  subsection,
  sections,
  section,
  appSelector,
  contentStyle,
  primaryBackgroundColor,
  secondaryBackgroundColor,
  footerMenuButtons
}) => {
  const currentApp = useContext(CurrentApp);
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return isSidebarCollapsed !== undefined ? isSidebarCollapsed : isMobile();
  });
  // const [fixed, setFixed] = useState(() => isSidebarFixed);
  const [mobileFriendly, setMobileFriendly] = useState(() => isMobile());
  const prevShowTour = useRef(showTour);

  const windowResizeHandler = () => {
    if (isMobile()) {
      if (document.body.className.indexOf(' sidebarCollapsed') === -1) {
        document.body.className += ' sidebarCollapsed';
      }
      setMobileFriendly(true);
      setCollapsed(true);
      // setFixed(false);
    } else {
      document.body.className = document.body.className.replace(' sidebarCollapsed', '');
      setMobileFriendly(false);
      setCollapsed(false);
      // setFixed(true);
    }
  }

  const checkExternalClick = ({ target }) => {
    if (mobileFriendly && !collapsed) {
      for (let current = target; current && current.id !== 'browser_mount'; current = current.parentNode) {
        if (/^sidebar/g.test(current.className) || /^introjs-tooltipReferenceLayer/g.test(current.className) || /^fixed_wrapper/g.test(current.id)) {
          return;
        }
      }
      setCollapsed(true);
    }
  }

  useEffect(() => {
    window.addEventListener('resize', windowResizeHandler);
    document.body.addEventListener('click', checkExternalClick);

    return () => {
      window.removeEventListener('resize', windowResizeHandler);
      document.body.removeEventListener('click', checkExternalClick);
    }
  }, []);

  useEffect(() => {
    isSidebarCollapsed = collapsed;
  }, [collapsed]);

  useEffect(() => {
    if (!!showTour && collapsed) {
      // if showing tour then open sidebar
      setMobileFriendly(false);
      setCollapsed(false);
      // setFixed(true);
    }

    if (prevShowTour.current && !showTour && isMobile()) {
      // Tour is over and on mobile device
      setMobileFriendly(true);
      setCollapsed(true);
      // setFixed(false);
    }
  }, [showTour]);

  useEffect(() => {
    if (collapsed && document.body.className.indexOf(' sidebarCollapsed') === -1) {
      document.body.className += ' sidebarCollapsed';
    } else if (!collapsed && document.body.className.indexOf(' sidebarCollapsed') !== -1 && !mobileFriendly) {
      document.body.className = document.body.className.replace(' sidebarCollapsed', '')
    }
  }, [collapsed])

  const _subMenu = subsections => {
    if (!subsections) {
      return null;
    }
    return (
      <div className={styles.submenu}>
        {subsections.map(({name, link, badge}) => {
          const active = subsection === name;
          // If link points to another component, adds the prefix
          link = link.startsWith('/') ? prefix + link : link;
          return (
            <SidebarSubItem
              key={name}
              name={name}
              link={link}
              action={action || null}
              actionHandler={active ? actionHandler : null}
              active={active}
              badge={badge}
            >
              {active ? children : null}
            </SidebarSubItem>
          );
        })}
      </div>
    );
  }

  const sidebarClasses = [styles.sidebar];

  if (collapsed) {
    sidebarClasses.push(styles.collapsed);

    return <div className={sidebarClasses.join(' ')}>
      <div className={styles.pinContainer} onClick={() => setCollapsed(false)}>
        <Icon className={styles.sidebarPin}
          name="b4a-collapse-sidebar"
          width={20}
          height={20}
        />
      </div>
      <div className={styles.content} style={contentStyle}>
        {sections.map(({
          name,
          icon,
          style,
          link,
          subsections
        }) => {
          const active = name === section;
          // If link points to another component, adds the prefix
          link = link.startsWith('/') ? prefix + link : link;
          return (
            <B4aSidebarSection
              key={name}
              name={name}
              link={link}
              icon={icon}
              style={style}
              active={active}
              primaryBackgroundColor={primaryBackgroundColor}
              isCollapsed={true}
              onClick={() => {}}
              locked={name !== 'Overview' ? currentApp.serverInfo.status !== 'SUCCESS' : false}
            >
              {_subMenu(subsections)}
            </B4aSidebarSection>
          );
        })}
      </div>
      <div className={styles.footer} onClick={() => setCollapsed(false)}>
        <Icon height={18} width={18} name='ellipses' fill='white' />
      </div>
    </div>
  }

  const apps = [].concat(AppsManager.apps()).sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0)));
  const footerButtons = [
    <button className={styles.supportBtn}
      // eslint-disable-next-line no-undef
      onClick={() => zE && zE.activate()}
      key={0}
    ><Icon width={24} height={24} name="support-icon" /> Support</button>
  ];
  if (footerMenuButtons) {
    footerButtons.push(<FooterMenu key={1}>{footerMenuButtons}</FooterMenu>);
  }

  const pinClasses = [styles.sidebarPin];

  const onPinClick = () => setCollapsed(prev => !prev);
  if (mobileFriendly) {
    pinClasses.push(styles.inverseIcon);
  }

  let sidebarContent;
  if (appsMenuOpen) {
    sidebarContent = (
      <AppsMenu
        apps={apps}
        current={currentApp}
        onPinClick={onPinClick}
        onSelect={() => setAppsMenuOpen(false)}
      />
    );
  } else {
    sidebarContent = (
      <>
        {appSelector && (
          <div className={styles.apps}>
            <AppName
              name={currentApp.name}
              onClick={() => setAppsMenuOpen(true)}
              onPinClick={onPinClick}
            />
          </div>
        )}
        <div className={styles.content} style={contentStyle}>
          {sections.map(({
            name,
            icon,
            style,
            link,
            subsections,
            badgeParams
          }) => {
            const active = name === section;
            const badge = badgeParams && <B4aBadge {...badgeParams} /> || ''
            // If link points to another component, adds the prefix
            link = link.startsWith('/') ? prefix + link : link;
            return (
              <B4aSidebarSection
                key={name}
                name={name}
                icon={icon}
                style={style}
                link={link}
                active={active}
                primaryBackgroundColor={primaryBackgroundColor}
                secondaryBackgroundColor={secondaryBackgroundColor}
                badge={badge}
                locked={name !== 'Overview' ? currentApp.serverInfo.status !== 'SUCCESS' : false}
              >
                {active ? _subMenu(subsections) : null}
              </B4aSidebarSection>
            );
          })}
        </div>
      </>
    )
  }

  return <div className={sidebarClasses.join(' ')} id="sidebar">
    {sidebarContent}
    <div className={styles.footer + ' footer'}>{footerButtons}</div>
  </div>

}

export default B4aSidebar;
