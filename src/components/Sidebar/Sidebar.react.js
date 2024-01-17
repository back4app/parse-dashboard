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
import SidebarSection from 'components/Sidebar/SidebarSection.react';
import SidebarSubItem from 'components/Sidebar/SidebarSubItem.react';
import styles from 'components/Sidebar/Sidebar.scss';
import Button from 'components/Button/Button.react'
import Icon from 'components/Icon/Icon.react';
import { isMobile } from 'lib/browserUtils';
import B4aBadge from 'components/B4aBadge/B4aBadge.react';
import AppsMenu from 'components/Sidebar/AppsMenu.react';
import AppName from 'components/Sidebar/AppName.react';
import { CurrentApp } from 'context/currentApp';

const isInsidePopover = node => {
  let cur = node.parentNode;
  while (cur && cur.nodeType === 1) {
    // If id starts with "fixed_wrapper", we consider it as the
    // root element of the Popover component
    if (/^fixed_wrapper/g.test(cur.id)) {
      return true;
    }
    cur = cur.parentNode;
  }
  return false;
}

let isSidebarFixed = !isMobile();
let isSidebarCollapsed = !isSidebarFixed;

const Sidebar = ({
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
  const [collapsed, setCollapsed] = useState(() => isSidebarCollapsed);
  const [fixed, setFixed] = useState(() => isSidebarFixed);
  const [mobileFriendly, setMobileFriendly] = useState(() => isMobile());
  const prevShowTour = useRef(showTour);

  const windowResizeHandler = () => {
    if (isMobile()) {
      if (document.body.className.indexOf(' expanded') === -1) {
        document.body.className += ' expanded';
      }
      setMobileFriendly(true);
      setCollapsed(true);
      setFixed(false);
    } else {
      document.body.className = document.body.className.replace(' expanded', '');
      setMobileFriendly(false);
      setCollapsed(false);
      setFixed(true);
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
      isSidebarFixed = fixed;
    }
  }, []);

  useEffect(() => {
    if (!!showTour && collapsed) {
      // if showing tour then open sidebar
      setMobileFriendly(false);
      setCollapsed(false);
      setFixed(true);
    }

    if (prevShowTour.current && !showTour && isMobile()) {
      // Tour is over and on mobile device
      setMobileFriendly(true);
      setCollapsed(true);
      setFixed(false);
    }
  }, [showTour]);

  const sidebarClasses = [styles.sidebar];

  if (!fixed && collapsed) {
    sidebarClasses.push(styles.collapsed);
    if (document.body.className.indexOf(' expanded') === -1) {
      document.body.className += ' expanded';
    }

    return <div className={sidebarClasses.join(' ')} onMouseEnter={!mobileFriendly ? (() => setCollapsed(false)) : undefined}>
      <div className={styles.pinContainer} onClick={mobileFriendly ? (() => setCollapsed(false)) : undefined}>
        <Icon className={styles.sidebarPin}
          name={mobileFriendly ? 'expand' : 'pin'}
          width={20}
          height={20}
          fill={mobileFriendly ? 'white' : 'lightgrey'} />
      </div>
      <div className={styles.content} style={contentStyle}>
        {sections.map(({
          name,
          icon,
          style,
          link,
        }) => {
          const active = name === section;
          // If link points to another component, adds the prefix
          link = link.startsWith('/') ? prefix + link : link;
          return (
            <SidebarSection
              key={name}
              name={name}
              link={link}
              icon={icon}
              style={style}
              active={active}
              primaryBackgroundColor={primaryBackgroundColor}
              isCollapsed={true}
              onClick={active
                ? (() => setCollapsed(false))
                : (() => isSidebarCollapsed = false)}>
            </SidebarSection>
          );
        })}
      </div>
      <div className={styles.footer} onClick={() => setCollapsed(false)}>
        <Icon height={18} width={18} name='ellipses' fill='white' />
      </div>
    </div>
  }

  if (fixed) {
    document.body.className = document.body.className.replace(' expanded', '');
  }

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

  const apps = [].concat(AppsManager.apps()).sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0)));
  const footerButtons = [
    <Button value='Support'
      primary={true}
      width='75px'
      // eslint-disable-next-line no-undef
      onClick={() => zE && zE.activate()}
      key={0}
    />
  ];
  if (footerMenuButtons) {
    footerButtons.push(<FooterMenu key={1}>{footerMenuButtons}</FooterMenu>);
  }

  const onMouseLeave = (!mobileFriendly && !collapsed && !fixed && (
    e => {
      if (!isInsidePopover(e.relatedTarget)) {
        setCollapsed(true);
      }
    }
  )) || undefined;

  const pinClasses = [styles.sidebarPin];
  if (fixed) {
    pinClasses.push(styles.fixed);
  }

  let onPinClick;
  if (mobileFriendly) {
    pinClasses.push(styles.inverseIcon);
    onPinClick = () => {
      if (collapsed) {
        setCollapsed(false);
        setFixed(true);
      } else {
        setCollapsed(true);
        setFixed(false);
      }
    };
  } else {
    onPinClick = () => {
      if (fixed) {
        setFixed(false);
        setCollapsed(true);
        setAppsMenuOpen(false);
      } else {
        setFixed(true);
        setCollapsed(false);
      }
    };
  }

  const pin = <Icon className={pinClasses.join(' ')} name={mobileFriendly ? 'expand' : 'pin'} width={20} height={20} onClick={onPinClick} />;

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
              pin={pin}
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
              <SidebarSection
                key={name}
                name={name}
                icon={icon}
                style={style}
                link={link}
                active={active}
                primaryBackgroundColor={primaryBackgroundColor}
                secondaryBackgroundColor={secondaryBackgroundColor}
                badge={badge}
              >
                {active ? _subMenu(subsections) : null}
              </SidebarSection>
            );
          })}
        </div>
      </>
    )
  }

  return <div className={sidebarClasses.join(' ')} onMouseLeave={onMouseLeave} id="sidebar">
    {sidebarContent}
    <div className={styles.help}></div>
    <div className={styles.footer + ' footer'}>{footerButtons}</div>
  </div>

}

export default Sidebar;
