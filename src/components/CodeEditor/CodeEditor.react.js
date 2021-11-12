/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import Editor from 'react-ace';
import PropTypes from '../../lib/PropTypes';

import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-solarized_dark';
import 'ace-builds/src-noconflict/snippets/javascript';
import 'ace-builds/src-noconflict/ext-language_tools';

export default class CodeEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = { code: '' };
  }

  componentWillReceiveProps(props){
    if (this.state.code !== props.code) {
      this.setState({ code: props.code });
    }
    if (props.mode) {
      require(`ace-builds/src-noconflict/mode-${props.mode}`);
      require(`ace-builds/src-noconflict/snippets/${props.mode}`);
    }
  }

  get value() {
    return this.state.code || this.props.placeHolder;
  }

  set value(code) {
    this.setState({ code });
  }

  render() {
    const { placeHolder, fontSize = 18, mode = 'javascript', height, isConsole = true } = this.props;
    const { code } = this.state;

    const extraProps = {};

    let defaultPropValueKey = 'value';
    if ( isConsole === false ) {
      defaultPropValueKey = 'defaultValue';
    }

    extraProps[defaultPropValueKey] = code || placeHolder;

    return (
      <Editor
        mode={mode}
        theme="solarized_dark"
        onChange={value => {
          this.setState({ code: value });
          if ( this.props.onCodeChange ){
            this.props.onCodeChange(value);
          }
        }}
        height={height || '100%'}
        fontSize={fontSize}
        showPrintMargin={true}
        showGutter={true}
        highlightActiveLine={true}
        width="100%"
        {...extraProps}
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
        enableSnippets={false}
        showLineNumbers={true}
        tabSize={2}
        style={this.props.style}
      />
    );
  }
}

CodeEditor.propTypes = {
  fontSize: PropTypes.number.describe('Font size of the editor'),
  placeHolder: PropTypes.string.describe('Code place holder'),
  height: PropTypes.string.describe('Code Editor height')
};
