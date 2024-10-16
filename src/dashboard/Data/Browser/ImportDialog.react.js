/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React    from 'react';
import ParseApp from 'lib/ParseApp';
import B4aModal    from 'components/B4aModal/B4aModal.react';
import Field    from 'components/Field/Field.react';
import PropTypes from 'lib/PropTypes';
import FileInput from 'components/FileInput/FileInput.react';
import Label    from 'components/Label/Label.react';

export default class ImportDialog extends React.Component {
  constructor() {
    super();
    this.state = {
      file: undefined,
      startedImport: false
    };
  }

  valid() {
    if (this.state.file != undefined && !this.state.startedImport) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <B4aModal
        type={B4aModal.Types.DEFAULT}
        title='Import data'
        subtitle={'You will receive an e-mail once your data is imported'}
        confirmText='Import'
        cancelText='Cancel'
        disabled={!this.valid()}
        onCancel={this.props.onCancel}
        onConfirm={() => {
          this.setState({ startedImport: true })
          this.props.onConfirm(this.state.file)
            .then((res) => {
              if (res.error) {
                this.setState({ errorMessage: res.message });
                this.props.showNote(`Import Request failed with the following error: "${res.error }".`)
              } else {
                this.props.onCancel();
                this.props.showNote('We are importing your data. You will be notified by e-mail once it is completed.')
              }
            }).finally(() => this.setState({ startedImport: false, file: undefined }));
        }}>

        <Field
          label={
            <Label
              text='Select a JSON or CSV file with your class data' />}
          input={
            <div style={{ padding: '0 1rem', width: '100%' }}>
              <FileInput
                onChange={(file) => {this.setState({ file: file });}} accept=".csv,.json" />
            </div>
          }
        />
      </B4aModal>

    );
  }
}

ImportDialog.contextTypes = {
  currentApp: PropTypes.instanceOf(ParseApp)
};
