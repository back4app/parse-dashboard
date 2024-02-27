/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Icon from 'components/Icon/Icon.react';
import React from 'react';
import styles from 'components/Checkbox/B4aCheckbox.scss';

const B4aCheckbox = ({ label, checked, indeterminate, onChange, dark = false }) => {
  const classes = [styles.input];
  if (checked) {
    classes.push(styles.checked);
  } else if (indeterminate) {
    classes.push(styles.indeterminate);
  }
  let inner = null;
  if (checked) {
    inner = <Icon width={10} height={10} name="check" />;
  } else if (indeterminate) {
    inner = <span className={styles.minus} />;
  }
  if (dark) {
    classes.push(styles.dark);
  }
  return (
    <span className={classes.join(' ')} onClick={() => onChange(!checked)}>
      <span className={styles.checkbox}>{inner}</span>
      {label ? <span className={styles.label}>{label}</span> : null}
    </span>
  );
};

export default B4aCheckbox;
