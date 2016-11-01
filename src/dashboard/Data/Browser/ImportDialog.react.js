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

export default class ImportDialog extends React.Component {
  constructor() {
      super();
      this.state = {
        className: '',
        file: undefined
      };
  }

  valid() {
    if (this.state.className != undefined && this.state.className != '' && this.state.file != undefined) {
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
        title='Import a class'
        subtitle='Select a JSON file to import.'
        confirmText='Import'
        cancelText='Cancel'
        disabled={!this.valid()}
        buttonsInCenter={true}
        onCancel={this.props.onCancel}
        onConfirm={() => {
            this.props.onConfirm(this.state.className, this.state.file);
            location.reload();
        }}>

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
            label={
                <Label
                    text='Select a class file' />}
            input={
                <FileInput
                    onChange={(file) => {this.setState({ file: file });}} />}
        />

      </Modal>
    );
  }
}

ImportDialog.contextTypes = {
  currentApp: React.PropTypes.instanceOf(ParseApp)
};