/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as AJAX from 'lib/AJAX';
import React    from 'react';
import ParseApp from 'lib/ParseApp';
import Modal    from 'components/Modal/Modal.react';
import Field    from 'components/Field/Field.react';
import TextInput from 'components/TextInput/TextInput.react';
import FileInput from 'components/FileInput/FileInput.react';
import Label    from 'components/Label/Label.react';

export default class ImportDialog extends React.Component {
  constructor() {
      super();
      this.state = {
        progress: undefined,
        className: undefined,
        file: undefined
      };
  }

  valid() {
    if (this.state.className != undefined && this.state.className != '' && this.state.file != undefined) {
        return true;
    }
    return false;
  }

  componentWillMount() {
      this.context.currentApp.getImportProgress().then((progress) => {
      this.setState({ progress });
    });
  }

  inProgress() {
    if (this.state.progress === undefined) {
      return false;
    }
    let found = false;
    if (Array.isArray(this.state.progress)) {
      this.state.progress.forEach((obj) => {
        if (obj.id === this.props.className) {
          found = true;
        }
      });
    }
    return found;
  }

  importFile(){
    let className = this.state.className;
    let file = this.state.file;
    //console.log(this.state.file.name);
    //let body = file;
    let path = 'http://www.parseapi.com/import/' + className;
    let promise = AJAX.post(path, file);
    promise.then(() => {
      console.log('success');
    }).then(() => {
      console.log('failure');
    });
    return promise;
  }

  render() {
    let inProgress = this.inProgress();
    return (
      <Modal
        type={Modal.Types.INFO}
        icon='down-outline'
        iconSize={40}
        title='Import a class'
        subtitle={`We'll send you an email when your data is ready.`}
        confirmText='Import'
        cancelText='Cancel'
        disabled={!this.valid()}
        buttonsInCenter={true}
        onCancel={this.props.onCancel}
        onConfirm={this.importFile()}>
        {inProgress ?
          <div style={{ padding: 20 }}>You are currently importing a class.</div> : null}


        <Field
              label={
                  <Label
              text='Confirm this action'
              description='Enter the class name to continue' />
            }
              input={
                  <TextInput
              placeholder='Class name'
              value={this.state.className}
              onChange={(className) => this.setState({ className: className })} />
            } />
        <Field
            label={<Label text='Select a class file' />}
            input={<FileInput onChange={(file) => {this.setState({ file: file });}} />}
        />

      </Modal>
    );
  }
}

ImportDialog.contextTypes = {
  currentApp: React.PropTypes.instanceOf(ParseApp)
};