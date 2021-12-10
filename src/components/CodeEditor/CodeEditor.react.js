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
import 'ace-builds/src-noconflict/theme-solarized_dark';
import 'ace-builds/src-noconflict/ext-language_tools';

export default class CodeEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = { code: '', reset: false };
  }

  componentWillReceiveProps(props){
    if (this.state.code !== props.code) {
      this.setState({ code: props.code, reset: true });
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
    const { fontSize = 18, mode = 'javascript', height } = this.props;
    
    return (
      <Editor
        mode={mode}
        theme="solarized_dark"
        onChange={value => {
          if ( this.props.onCodeChange ){
            this.props.onCodeChange(value);
          }
        }}
        onLoad={editor => {
          editor.once("change", () => {
            editor.session.getUndoManager().reset();
          });
          editor.on('change', () => {
            if ( this.state.reset === true ) {
              editor.session.getUndoManager().reset();
              this.setState({ reset: false })
            }
          })
        }}
        height={height || '100%'}
        fontSize={fontSize}
        showPrintMargin={true}
        showGutter={true}
        highlightActiveLine={true}
        width="100%"
        value={this.state.code}
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
