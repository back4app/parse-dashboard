/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React from 'react';
import styles from 'components/KeyField/B4aKeyField.scss';
import Icon from 'components/Icon/Icon.react';

export default class B4aKeyField extends React.Component {
  constructor(props) {
    super();

    this.state = {
      hidden: props.hidden,
    };
  }

  show() {
    this.setState({ hidden: false });
  }

  toggle() {
    this.setState(prev => ({
      hidden: !prev.hidden
    }));
  }

  render() {
    let key = this.props.name || '';
    if (key.length) {
      key += ' ';
    }
    let content;
    if (this.props.showKeyName) {
      return (
        <div className={styles.hiddenKey}>
          <div className={styles.title}>{this.props.name} {this.props.keyText}</div>
          <div className={styles.showKey + ' ' + (this.state.hidden ? styles.hiddenText : '')}>
            <span>{this.state.hidden ? `Show ${this.props.keyText}` : this.props.children}</span>
            <Icon onClick={this.toggle.bind(this)} name={this.state.hidden ? 'b4a-visibility-icon' : 'b4a-visibility-off-icon'} width={16} height={16} fill="#27AE60" />
          </div>
        </div>
      );
    } else {
      content = <div className={styles.key}>{this.props.children}</div>
    }
    return content;
  }
}

B4aKeyField.propTypes = {
  children: PropTypes.node.describe('The contents of the field. Ideally, this is an app key.'),
  hidden: PropTypes.bool.describe('Determines whether the field is initially hidden'),
  name: PropTypes.string.describe(
    'If the field is initially hidden, this name will be used in the button used to show it. If the value is NAME, the button will contain the text "Show NAME Key"'
  ),
  whenHiddenText: PropTypes.string.describe(
    'Use this instead of "name" if you aren\'t showing a key.'
  ),
};

B4aKeyField.defaultProps = {
  keyText: 'key'
};
