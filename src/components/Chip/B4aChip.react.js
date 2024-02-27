/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import styles from 'components/Chip/B4aChip.scss';
import PropTypes from 'lib/PropTypes';
import Icon from 'components/Icon/Icon.react';

const B4aChip = ({ value, onClose }) => (
  <div className={[styles.chip].join(' ')}>
    <div
      onClick={e => {
        try {
          e.stopPropagation();
          e.nativeEvent.stopPropagation();
        } catch (e) {
          console.error(e);
        }

        onClose(value);
      }}
    >
      <Icon name="b4a-cross-filled" viewBox="0 0 24 24" height={16} width={16} />
    </div>
    <div className={[styles.content].join(' ')}>{value}</div>
  </div>
);

export default B4aChip;

B4aChip.propTypes = {
  onClose: PropTypes.func.isRequired.describe(
    'A function called when the close button clicked. It receives the value of as the only parameter.'
  ),
  value: PropTypes.string.isRequired.describe('The string to be rendered inside chip.'),
};
