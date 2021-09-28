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
      style.hljs.background = "rgb(255 255 255)";
      style.hljs.color = "rgb(0 0 0)";
      style.hljs.height = '100%';
      style.hljs.padding = '1em 0.5em';
    }
  return <div style={{ height: '100%' }}>
      { this.props.isFolderSelected === true ?
        <div style={{ height: '100%' }}><SyntaxHighlighter
        language={this.extensionDecoder()}
        style={style}>
          {this.props.source.length > pageSize ? this.props.source.substring(0,  pageSize) : this.props.source}
        </SyntaxHighlighter>
        {this.props.source.length > pageSize &&
          <form action="https://codepen.io/pen/define" method="POST" target="_blank" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <input type="hidden" name="data" value={JSON.stringify(this.state.codePenConfig)} />

            <input style={{ background: 'transparent', color: 'white', cursor: 'pointer' }} type="submit"
              value="Code truncated. Click here to view full source code on CodePen >>" />
            <div
            style={{ cursor: 'pointer', color: 'white' }}
            onClick={() => {
                const wnd = window.open("about:blank", "", "_blank");
                wnd.document.write(this.props.source);
            }}>
              Or open in a blank tab.
            </div>
          </form>
        }
        </div>:
        <CodeEditor fontSize='13px' code={this.props.source} onCodeChange={ value => this.props.onCodeChange(value) } mode={this.extensionDecoder()}/>
      }
    </div>;
  }
}
