/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React, { useEffect } from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/Toolbar/Toolbar.scss';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import { useNavigate, useNavigationType, NavigationType } from 'react-router-dom';

const POPOVER_CONTENT_ID = 'toolbarStatsPopover';

const Stats = ({ data }) => {
  const [selected, setSelected] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef();

  const statsOptions = [
    {
      type: 'sum',
      label: 'Sum',
      getValue: data => data.reduce((sum, value) => sum + value, 0),
    },
    {
      type: 'mean',
      label: 'Mean',
      getValue: data => data.reduce((sum, value) => sum + value, 0) / data.length,
    },
    {
      type: 'count',
      label: 'Count',
      getValue: data => data.length,
    },
    {
      type: 'p99',
      label: 'P99',
      getValue: data => {
        const sorted = data.sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length * 0.99)];
      },
    },
  ];

  const toggle = () => {
    setOpen(!open);
  };

  const renderPopover = () => {
    const node = buttonRef.current;
    const position = Position.inDocument(node);
    return (
      <Popover
        fixed={true}
        position={position}
        onExternalClick={toggle}
        contentId={POPOVER_CONTENT_ID}
      >
        <div id={POPOVER_CONTENT_ID}>
          <div
            onClick={toggle}
            style={{
              cursor: 'pointer',
              width: node.clientWidth,
              height: node.clientHeight,
            }}
          ></div>
          <div className={styles.stats_popover_container}>
            {statsOptions.map(item => {
              const itemStyle = [styles.stats_popover_item];
              if (item.type === selected?.type) {
                itemStyle.push(styles.active);
              }
              return (
                <div
                  key={item.type}
                  className={itemStyle.join(' ')}
                  onClick={() => {
                    setSelected(item);
                    toggle();
                  }}
                >
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Popover>
    );
  };

  useEffect(() => {
    setSelected(statsOptions[0]);
  }, []);

  return (
    <>
      {selected ? (
        <button ref={buttonRef} className={styles.stats} onClick={toggle}>
          {`${selected.label}: ${selected.getValue(data)}`}
        </button>
      ) : null}
      {open ? renderPopover() : null}
    </>
  );
};

const Toolbar = props => {
  const action = useNavigationType();
  const navigate = useNavigate();
  let backButton;
  if (props.showBackButton || (props.relation || (props.filters && props.filters.size && action !== 'POP'))) {
    backButton = (
      <a 
        className={styles.iconButton} 
        onClick={props.onBackClick || (() => navigate(-1))}
      >
        <Icon width={24} height={24} fill="#ffffff" name="b4a-up-arrow" />
      </a>
    );
  }
  return (
    <div className={[styles.toolbar, props.toolbarStyles ? props.toolbarStyles : ''].join(' ')} id="toolbar">
      <div className={styles.title}>
        <div className={styles.nav}>{backButton}</div>
        <div className={styles.titleText}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className={styles.subsection}>
              <span className={styles.section}>
                {props.section}
              </span>
              <span className={styles.subsectionName}>
                {props.subsection}
              </span>
            </div>
            {props.readWritePermissions && <div>
              {/* {props.helpsection} */}
              {/* Public read and write access */}
              <div className={styles.publicAccess}>
                <div className={styles.publicAccessIcon} onClick={() => props.onClickSecurity(true)}>
                  {props.lockIcon === true ?
                    <Icon name='b4a-lock-icon' fill='#FFFFFF' width={16} height={16}></Icon> :
                    <Icon name='b4a-unlock-icon' fill='#27AE60' width={16} height={16}></Icon>
                  }
                </div>
                <div className={styles.publicAccessName}>
                  <span>{props.className}</span>
                  <span>{props.details}</span>
                </div>
                {/* <a href="javascript:void(0)" className={styles.publicAccessLink}><small>{props.readWritePermissions}</small></a> */}
              </div> </div> }
          </div>
        </div>
      </div>
      {props?.selectedData?.length ? <Stats data={props.selectedData} /> : null}
      <div className={styles.actions}>{props.children}</div>
    </div>
  );
};

Toolbar.propTypes = {
  section: PropTypes.string,
  subsection: PropTypes.string,
  details: PropTypes.string,
  relation: PropTypes.object,
  selectedData: PropTypes.array,
};

export default Toolbar;
