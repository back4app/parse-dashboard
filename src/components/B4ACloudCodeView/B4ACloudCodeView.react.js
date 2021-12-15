import React                from 'react';
import SyntaxHighlighter    from 'react-syntax-highlighter';
import style                from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night-eighties';
import CodeEditor           from '../CodeEditor/CodeEditor.react';
import * as modelist        from 'ace-builds/src-noconflict/ext-modelist.js';
import 'ace-builds/src-noconflict/mode-graphqlschema';

const pageSize = 4000;
export default class B4ACloudCodeView extends React.Component {
  constructor(props){
    super(props);
    const codePenConfig = {
      title: 'Back4AppCloudCodePen',
    }

    if ( this.props.extension ) {
      switch( this.props.extension ) {
        case 'js':
          codePenConfig['js'] = this.props.source;
          break;
        case 'ejs':
          codePenConfig['html'] = this.props.source;
          break;
      }
    } else {
      codePenConfig['js'] = this.props.source;
    }

    this.state = {
      codePenConfig,
    };
  }

  componentDidUpdate() {
    let key = 'js';

    switch (this.props.extension) {
      case 'js':
        key = 'js';
        break;
      case 'ejs':
        key = 'html';
        break;
    }

    if ( this.props.source !== this.state.codePenConfig[key] ) {
      let newState = this.state.codePenConfig;
      newState[key] = this.props.source;
      this.setState(newState);
    }
  }

  extensionDecoder() {
    if (this.props.fileName && typeof this.props.fileName === 'string') {
      return modelist.getModeForPath(this.props.fileName).name;
    }
    return 'javascript'
  }


  render() {
    if (style.hljs) {
      style.hljs.background = "rgb(255 255 255)";
      style.hljs.color = "rgb(0 0 0)";
      style.hljs.height = '100%';
      style.hljs.padding = '1em 0.5em';
    }
  return <CodeEditor 
      style={{ zIndex: 4 }} 
      fontSize={13} 
      fileName={this.props.fileName}
      code={this.props.source} 
      onCodeChange={ value => this.props.onCodeChange(value) } 
      mode={this.extensionDecoder()} />
  }
}
