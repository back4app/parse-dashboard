import React from 'react';
import B4aCodeEditor from '../CodeEditor/B4aCodeEditor.react';
import { getExtension } from '../B4ACodeTree/B4ATreeActions';

export default class B4ACloudCodeView extends React.Component {
  constructor(props) {
    super(props);
    this.editorRef = React.createRef();
  }

  // Selects the whole file in the editor. Returns false while the editor is
  // still loading.
  selectAll() {
    return this.editorRef.current ? this.editorRef.current.selectAll() : false;
  }

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
          ref={this.editorRef}
          fontSize={13}
          fileName={this.props.fileName}
          documentKey={this.props.fileId}
          focusToken={this.props.focusToken}
          code={this.props.source}
          onCodeChange={value => this.props.onCodeChange(value)}
          mode={this.extensionDecoder()}
          readOnly={this.props.readOnly || false}
        />
      </div>
    );
  }
}
