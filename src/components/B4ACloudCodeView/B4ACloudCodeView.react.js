import React from 'react';
import B4aCodeEditor from '../CodeEditor/B4aCodeEditor.react';
import { getExtension } from '../B4ACodeTree/B4ATreeActions';

export default class B4ACloudCodeView extends React.Component {
  extensionDecoder() {
    if (this.props.fileName && typeof this.props.fileName === 'string') {
      return getExtension(this.props.fileName);
    }
    return 'javascript';
  }

  render() {
    return (
      <div style={{ height: 'calc(100% - 40px)' }}>
        <B4aCodeEditor
          fontSize={13}
          fileName={this.props.fileName}
          code={this.props.source}
          onCodeChange={value => this.props.onCodeChange(value)}
          mode={this.extensionDecoder()}
          readOnly={this.props.readOnly || false}
        />
      </div>
    );
  }
}
