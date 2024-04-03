/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import baseStyles from 'stylesheets/base.scss';
import PropTypes from 'lib/PropTypes';
import React, { forwardRef } from 'react';
import styles from 'components/Button/Button.scss';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';

const noop = () => {};

const Button = forwardRef(function Button(props, ref) {
  const hasOnClick = props.onClick && !props.disabled;
  const classes = [styles.button, baseStyles.unselectable];
  // if a button is disabled, that overrides any color selection
  if (props.disabled) {
    classes.push(styles.disabled);
    if (props.color === 'white') {
      // This has a special disabled case
      classes.push(styles.white);
    }
  } else {
    if (props.primary) {
      classes.push(styles.primary);
    }
    if (props.secondary) {
      classes.push(styles.secondary);
    }
    if (props.color) {
      classes.push(styles[props.color]);
    }
    if (props.progress) {
      classes.push(styles.progress);
    }
    if (props.className) {
      classes.push(props.className)
    }
    if (props.dark) {
      classes.push(styles.dark);
    }
  }
  const clickHandler = hasOnClick ? props.trackClick ? () => {
    // eslint-disable-next-line no-undef
    amplitudeLogEvent(props.eventName || `${typeof props.value === 'string' ? props.value : ''}`);
    // console.log(props.eventName);
    props.onClick();
  } : props.onClick : noop;
  let styleOverride = null;
  if (props.width) {
    styleOverride = {
      borderRadius: props.borderRadius,
      width: props.width,
      minWidth: props.width,
      ...props.additionalStyles,
    };
  }
  return (
    <button
      ref={ref ?? null}
      type="button"
      style={styleOverride}
      className={classes.join(' ')}
      onClick={clickHandler}
      onFocus={e => {
        if (props.disabled) {
          e.target.blur();
        }
      }}
    >
      <span>{props.value}</span>
    </button>
  );
})

export default Button;

Button.propTypes = {
  primary: PropTypes.bool.describe(
    'Determines whether the button represents a Primary action. ' +
      'Primary buttons appear filled, while normal buttons are outlines.'
  ),
  disabled: PropTypes.bool.describe(
    'Determines whether a button can be clicked. Disabled buttons will ' +
      'appear grayed out, and will not fire onClick events.'
  ),
  color: PropTypes.oneOf(['blue', 'green', 'red', 'white']).describe('The color of the button.'),
  onClick: PropTypes.func.describe('A function to be called when the button is clicked.'),
  value: PropTypes.string.isRequired.describe(
    'The content of the button. This can be any renderable content.'
  ),
  width: PropTypes.string.describe(
    'Optionally sets the explicit width of the button. This can be any valid CSS size.'
  ),
  progress: PropTypes.bool.describe(
    'Optionally have in progress button styles. Defaults to false.'
  ),
  additionalStyles: PropTypes.object.describe('Additional styles for <a> tag.'),
  className: PropTypes.string.describe(
    'Custom class name'
  ),
  trackClick: PropTypes.object.describe('boolean to specify whether track click or not'),
  eventName: PropTypes.string.describe('event to send on trackClick'),
};

Button.defaultProps = {
  trackClick: true,
  eventName: '',
}
