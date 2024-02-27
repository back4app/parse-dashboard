/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import styles from 'components/Pill/Pill.scss';
import Icon from 'components/Icon/Icon.react';

//TODO: refactor, may want to move onClick outside or need to make onClick able to handle link/button a11y
const Pill = ({
  value,
  onClick,
  fileDownloadLink,
  followClick = false,
  shrinkablePill = false,
  dark = true,
}) => (
  <span
    className={[styles.pill, !followClick && onClick ? styles.action : void 0, dark ? styles.dark : ''].join(' ')}
    onClick={!followClick && onClick ? onClick : null}
  >
    <span
      className={
        !followClick && fileDownloadLink ? styles.content : shrinkablePill ? styles.pillText : ''
      }
    >
      {value}
    </span>
    {followClick && (
      <a onClick={e => !e.metaKey && onClick()}>
        <Icon name="b4a-up-arrow" width={16} height={16} fill="#1669a1" />
      </a>
    )}
    {!followClick && fileDownloadLink && (
      <a href={fileDownloadLink} target="_blank">
        <Icon name="b4a-up-arrow" width={16} height={16} fill="#1669a1" />
      </a>
    )}
  </span>
);

export default Pill;
