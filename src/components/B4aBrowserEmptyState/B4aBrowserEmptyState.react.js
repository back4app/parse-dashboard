/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Icon from 'components/Icon/Icon.react';
import React from 'react';
import styles from 'components/B4aBrowserEmptyState/B4aBrowserEmptyState.scss';

const B4aBrowserEmptyState = ({
  title = '',
  description = '',
  primaryCtaText = '',
  secondaryCtaText = '',
  primaryCtaAction = () => {},
  secondaryCtaAction = () => {},
  icon = '',
}) => (
  <>
    <Icon width={24} height={24} fill="#C1E2FF" name={icon} className={styles.icon} />
    <div className="">
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      <div className={styles.actionBtns}>
        {primaryCtaText ? <button className={styles.addBtn} onClick={primaryCtaAction}>{primaryCtaText}</button> : null}
        {secondaryCtaText ? <button className={styles.importFileBtn} onClick={secondaryCtaAction}>{secondaryCtaText}</button> : null}
      </div>
    </div></>
);

export default B4aBrowserEmptyState;
