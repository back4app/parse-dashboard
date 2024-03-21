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

  get value() {
    return this.state.code || this.props.placeHolder;
  }

  set value(code) {
    this.setState({ code });
  }

  componentWillReceiveProps(props){
    if (this.state.code !== props.placeHolder && this.state.fileName !== props.fileName) {
      this.setState({ code: props.placeHolder, fileName: props.fileName, reset: true });
    }
    if (props.mode) {
      require(`ace-builds/src-noconflict/mode-${props.mode}`);
      require(`ace-builds/src-noconflict/snippets/${props.mode}`);
    }
    if (props.mode === 'javascript') {
      // eslint-disable-next-line no-undef
      ace.config.setModuleUrl('ace/mode/javascript_worker', `${window.PARSE_DASHBOARD_PATH}/worker-javascript.js`);
    }
  }

  render() {
    const { placeHolder, fontSize = 18, style = {}, mode, height } = this.props;
    const { code } = this.state;

    return (
      <Editor
        mode={mode}
        theme="solarized_dark"
        onChange={value => {
          this.setState({ code: value });
          typeof this.props.onCodeChange === 'function' && this.props.onCodeChange(value);
        }}
        onLoad={editor => {
          editor.once('change', () => {
            editor.session.getUndoManager().reset();
          });
          editor.on('change', () => {
            if (this.state.reset){
              editor.session.getUndoManager().reset();
              this.setState({ reset: false })
            }
          });
        }}
        fontSize={fontSize}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        width="100%"
        height={height || '100%'}
        value={code || placeHolder}
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
        enableSnippets={false}
        showLineNumbers={true}
        tabSize={2}
        style={{...style}}
      />
    );
  }
}

CodeEditor.propTypes = {
  fontSize: PropTypes.number.describe('Font size of the editor'),
  placeHolder: PropTypes.string.describe('Code place holder'),
  fileName: PropTypes.string.describe('Name of the file'),
  style: PropTypes.object.describe('Additional editor styles'),
  onCodeChange: PropTypes.func.describe('On change code callback'),
  mode: PropTypes.string.describe('Editor mode')
};

CodeEditor.defaultProps = {
  mode: 'javascript',
  style: {},
  onCodeChange: () => {},
  fileName: ''
};
