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
import styles from 'components/StatusIndicator/B4aStatusIndicator.scss';

const B4aStatusIndicator = ({ text, color }) => {
  color = color || 'blue';
  const iconContent = <Icon width={14} height={14} name={color === 'green' ? 'b4a-success-check' : color === 'red' ? 'b4a-error-cross' : 'b4a-loading'} />
  return <span className={[styles.status, styles[color]].join(' ')}>{iconContent}{text}</span>;
};

B4aStatusIndicator.propTypes = {
  text: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'red']),
};

export default B4aStatusIndicator;
