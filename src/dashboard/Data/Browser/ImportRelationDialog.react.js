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

export default class ImportRelationDialog extends React.Component {
  constructor() {
      super();
      this.state = {
        progress: undefined,
        relationName: undefined,
        file: undefined
      };
  }

  valid() {
    if (this.state.relationName != undefined && this.state.relationName != '' && this.state.file != undefined) {
        return true;
    }
    return false;
  }

  componentWillMount() {
      this.context.currentApp.getImportRelationProgress().then((progress) => {
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
        if (obj.id === this.props.relationName) {
          found = true;
        }
      });
    }
    return found;
  }

  importRelationFile(){
    let className = this.state.relationName;
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
        title='Import a relation to this class'
        subtitle={`We'll send you an email when your data is ready.`}
        confirmText='Import'
        cancelText='Cancel'
        disabled={!this.valid()}
        buttonsInCenter={true}
        onCancel={this.props.onCancel}
        onConfirm={this.props.onConfirm ? this.importRelationFile() : null}>
        {inProgress ?
          <div style={{ padding: 20 }}>You are currently importing a relation to this class.</div> : null}


        <Field
              label={
                  <Label
              text='Confirm this action'
              description='Enter the relation name to continue' />
            }
              input={
                  <TextInput
              placeholder='Relation name'
              value={this.state.relationName}
              onChange={(relationName) => this.setState({ relationName: relationName })} />
            } />
        <Field
            label={<Label text='Select a relation file' />}
            input={<FileInput onChange={(file) => {this.setState({ file: file });}} />}
        />

      </Modal>
    );
  }
}

ImportRelationDialog.contextTypes = {
  currentApp: React.PropTypes.instanceOf(ParseApp)
};