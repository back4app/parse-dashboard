/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/Toolbar/Toolbar.scss';
import { useNavigate, useNavigationType } from 'react-router-dom';

const Toolbar = props => {
  const action = useNavigationType();
  const navigate = useNavigate();
  let backButton;
  if (props.relation || (props.filters && props.filters.size && action !== 'POP')) {
    backButton = (
      <a className={styles.iconButton} onClick={() => navigate(-1)}>
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
              <div className={styles.publicAccess} onClick={() => props.onClickSecurity(true)}>
                <div className={styles.publicAccessIcon}>
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
      <div className={styles.actions}>{props.children}</div>
    </div>
  );
};

Toolbar.propTypes = {
  section: PropTypes.string,
  subsection: PropTypes.string,
  details: PropTypes.string,
  relation: PropTypes.object,
};

export default Toolbar;
