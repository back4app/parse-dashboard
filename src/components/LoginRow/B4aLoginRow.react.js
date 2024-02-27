/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import styles from 'components/LoginRow/B4aLoginRow.scss';

const B4aLoginRow = ({ label, input }) => (
  <label className={styles.row}>
    <div className={styles.label}>{label}</div>
    <div className={styles.input}>{input}</div>
  </label>
);

export default B4aLoginRow;
