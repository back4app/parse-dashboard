/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
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
        confirmation: '',
        relationName: '',
        file: undefined
      };
  }

  valid() {
    if (this.state.confirmation === this.props.className && this.state.relationName != '' && this.state.file != undefined) {
        return true;
    }
    return false;
  }

  render() {
    return (
      <Modal
        type={Modal.Types.INFO}
        icon='down-outline'
        iconSize={40}
        title='Import a relation'
        subtitle='Select a JSON file to import to this class.'
        confirmText='Import'
        cancelText='Cancel'
        disabled={!this.valid()}
        buttonsInCenter={true}
        onCancel={this.props.onCancel}
        onConfirm={() => {
            this.props.onConfirm(this.state.confirmation, this.state.relationName, this.state.file);
            location.reload();
        }}>

        <Field
              label={
                  <Label
                      text='Confirm this action'
                      description='Enter the current class name to continue' />
              }
              input={
                  <TextInput
                      placeholder='Class name'
                      value={this.state.confirmation}
                      onChange={(confirmation) => this.setState({ confirmation: confirmation })} />
              } />
          <Field
              label={
                  <Label
                      text='Enter the relation name' />
              }
              input={
                  <TextInput
                      placeholder='Relation name'
                      value={this.state.relationName}
                      onChange={(relationName) => this.setState({ relationName: relationName })} />
              } />
        <Field
            label={
                <Label
                    text='Select a relation file' />}
            input={
                <FileInput
                    onChange={(file) => {this.setState({ file: file });}} />}
        />

      </Modal>
    );
  }
}

ImportRelationDialog.contextTypes = {
  currentApp: React.PropTypes.instanceOf(ParseApp)
};