/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React     from 'react';

class VisibilityField extends React.Component {

  constructor(){
    super();
    this.state = {
      visible: false
    }
  }

  render() {
    return (
      this.state.visible === true ?
        React.createElement(this.props.onVisibleComponent, { toggleVisibility: ( visible ) => this.setState({ visible }) })  :
        React.createElement(this.props.onHiddenComponent, { toggleVisibility: ( visible ) => this.setState({ visible }) })
    );
  }

}

VisibilityField.propTypes = {
  onVisibleComponent: PropTypes.node.describe(
    'The component to show when visible'
  ),
  onHiddenComponent: PropTypes.node.describe(
    'The component to show when hidden'
  ),
  input: PropTypes.node.describe(
    'The component to show when visible'
  )
};

export default VisibilityField;

