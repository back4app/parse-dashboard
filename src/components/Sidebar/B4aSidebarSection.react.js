/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Icon from 'components/Icon/Icon.react';
import { Link } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import styles from 'components/Sidebar/B4aSidebar.scss';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';

const sendEvent = () => {
  // eslint-disable-next-line no-undef
  // back4AppNavigation && back4AppNavigation.atApiReferenceIntroEvent && back4AppNavigation.atApiReferenceIntroEvent()
  amplitudeLogEvent('at API Reference Introduction');
}

const B4aSidebarSection = ({ active, children, name, link, icon, style, primaryBackgroundColor, secondaryBackgroundColor, isCollapsed, onClick, badge, locked }) => {
  const classes = [styles.section, 'section']; // Adding 'section' for the Tour to be able to select
  const [showPopoverSection, setShowPopoverSection] = useState(false);
  const [position, setPosition] = useState(null);
  const subSectionRef = useRef();

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

  const iconContent = icon && <Icon width={20} height={20} name={icon} fill='#ffffff' />;
  const textContent = !isCollapsed && <span>{name}</span>;
  const sectionContent = active
    ? <div className={styles.section_header} style={{ ...style, background: primaryBackgroundColor, justifyContent: isCollapsed ? 'center' : '' }} onClick={onClick}>{<img src={require(`./icons/${icon}.png`)} style={{ marginRight: isCollapsed ? '0' : '14px', width: '20px', height: '20px', objectFit: 'contain' }} />}{textContent}{badge}</div>
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
