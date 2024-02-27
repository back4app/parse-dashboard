/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/MultiSelect/B4aMultiSelect.scss';

const B4aMultiSelectOption = ({ checked, children, dense, disabled, ...other }) => {
  const classes = [styles.option, disabled ? styles.disabled : undefined];

  const icon = <div className={styles.icon}><Icon width={dense ? 16 : 20} height={dense ? 16 : 20} name={checked ? 'b4a-checked' : 'b4a-unchecked'} fill="#0F1C32" /></div>

  return (
    <div {...other} className={classes.join(' ')}>
      {children}
      {disabled ? <noscript /> : icon}
    </div>
  );
};

export default B4aMultiSelectOption;
