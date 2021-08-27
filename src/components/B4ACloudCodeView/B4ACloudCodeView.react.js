import React                from 'react';
import SyntaxHighlighter    from 'react-syntax-highlighter';
import style                from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night-eighties';
import CodeEditor           from '../CodeEditor/CodeEditor.react';

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
    if (this.props.extension)
      switch (this.props.extension) {
        case 'js':
          return 'javascript'
        case 'ejs':
          return 'html'
        default:
          // css, html, ...
          return this.props.extension
      }
    return 'javascript'
  }


  render() {
    if (style.hljs) {
      style.hljs.background = "#0c2337";
      style.hljs.height = '100%';
      style.hljs.padding = '1em 0.5em';
    }
  return <div style={{ height: '367px' }}>
       <CodeEditor code={this.props.source} onCodeChange={ value => this.props.onCodeChange(value) } />
    </div>;
  }
}
