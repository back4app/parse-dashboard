/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React from 'react';
import styles from 'components/NumericInput/NumericInput.scss';
import Icon from 'components/Icon/Icon.react';

export default class NumericInput extends React.Component {
  constructor(){
    super();
    this.inputRef = React.createRef();
  }

  componentWillReceiveProps(props) {
    if (props.multiline !== this.props.multiline) {
      const previousInput = this.refs.input;
      // wait a little while for component to re-render
      setTimeout(function() {
        const newInput = previousInput ? this.refs.textarea : this.refs.input;
        newInput.focus();
        newInput.value = '';
        newInput.value = props.value;
      }.bind(this), 1);
    }
  }

  changeValue(e) {
    const { onChange } = this.props;
    if (onChange) {
      onChange(e.nativeEvent.target.value);
    }
  }
  updateValue(e) {
    const { onBlur } = this.props;
    if (onBlur) {
      onBlur(e.nativeEvent.target.value);
    }
  }

  render() {
    let classes = [styles.text_input];
    if (this.props.monospace) {
      classes.push(styles.monospace);
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', background: '#f6fafb' }}>
        <input
          ref={this.inputRef}
          id={this.props.id}
          type={'number'}
          min={this.props.min}
          disabled={!!this.props.disabled}
          className={classes.join(' ')}
          style={{height: this.props.height || 80}}
          placeholder={this.props.placeholder}
          value={this.props.value}
          onChange={this.changeValue.bind(this)}
          onBlur={this.updateValue.bind(this)} />
          <div>
            <Icon onClick={() => {
              if ( this.inputRef?.current ) {
                let val = this.inputRef?.current.value;
                if ( val === '' ) {
                  val = 0;
                }
                this.inputRef.current.value = parseInt(val) + 1;
                this.props.onChange(this.inputRef.current.value);
              }
            }} name='input-up-icon' width={24} height={24} fill='#218bec' />
            <Icon onClick={() => {
              if ( this.inputRef?.current ) {
                let val = this.inputRef?.current.value;
                if ( val === '' ) {
                  val = 0;
                }
                this.inputRef.current.value = parseInt(val) - 1;
                this.props.onChange(this.inputRef.current.value);
              }
            }} name='input-down-icon' width={24} height={24} fill='#218bec' />
          </div>
        </div>
    );
  }
}

NumericInput.propTypes = {
  monospace: PropTypes.bool.describe(
    'Determines whether the input is formatted with a monospace font'
  ),
  disabled: PropTypes.bool.describe(
    'Determines whether the input is disabled'
  ),
  hidden: PropTypes.bool.describe(
    'Determines whether the contents are hidden (password field)'
  ),
  multiline: PropTypes.bool.describe(
    'Determines whether the input is a multiline input (<textarea>), or has a single input line.'
  ),
  onChange: PropTypes.func.isRequired.describe(
    'A function fired when the input is changed. It receives the new value as its only parameter.'
  ),
  onBlur: PropTypes.func.describe(
    'A function fired when the input is blurred.'
  ),
  placeholder: PropTypes.string.describe(
    'A placeholder string, for when the input is empty'
  ),
  value: PropTypes.any.describe(
    'The current value of the controlled input'
  ),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).describe(
    'The height of the field. Can be a string containing any CSS unit, or a number of pixels. Default is 80px.'
  ),
};
