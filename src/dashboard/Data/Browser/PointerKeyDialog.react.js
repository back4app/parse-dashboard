/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button                 from 'components/Button/Button.react';
import Dropdown               from 'components/Dropdown/Dropdown.react';
import Field                  from 'components/Field/Field.react';
<<<<<<< HEAD
import { footer }             from 'components/Modal/Modal.scss';
=======
import modalStyles            from 'components/Modal/Modal.scss';
>>>>>>> origin/upstream
import Label                  from 'components/Label/Label.react';
import Modal                  from 'components/Modal/Modal.react';
import Option                 from 'components/Dropdown/Option.react';
import React                  from 'react';
import * as ColumnPreferences from 'lib/ColumnPreferences';

export default class PointerKeyDialog extends React.Component {
  constructor() {
    super();
    this.state = {
      name: null
    };
  }

<<<<<<< HEAD
  async componentDidMount() {
    const pointerKey = await ColumnPreferences.getPointerDefaultKey(this.props.app.applicationId, this.props.className);
=======
  componentDidMount() {
    const pointerKey = ColumnPreferences.getPointerDefaultKey(this.props.app.applicationId, this.props.className);
>>>>>>> origin/upstream
    this.setState({ name: pointerKey });
  }

  render() {
    let content = null;
    let hasColumns = this.props.currentColumns.length > 0;
    let currentColumns = [...this.props.currentColumns, 'objectId'];
    if (hasColumns) {
      content = (
        <Field
          label={
            <Label
              text='PointerKey' />
            }
          input={
            <Dropdown
              placeHolder='Select a column'
              value={this.state.name}
              onChange={(name) => this.setState({ name: name })}>
              {currentColumns.map((t) => <Option key={t} value={t}>{t}</Option>)}
            </Dropdown>
          } />
      )
    }
    return (
      <Modal
        type={Modal.Types.INFO}
<<<<<<< HEAD
        title={'Change pointer key'}
        subtitle={hasColumns ? `The selected column will be used to represent a pointer for class "${this.props.className}"` : `There are no columns that can be set to represent a pointer for class "${this.props.className}"`}
        confirmText='Set pointer key'
        cancelText={'Never mind, don\u2019t.'}
=======
        title={'Change pointer key?'}
        subtitle={hasColumns ? `The selected column will be used to represent a pointer for class "${this.props.className}"` : `There are no columns that can be set to represent a pointer for class "${this.props.className}"`}
        confirmText='Change'
        cancelText='Cancel'
>>>>>>> origin/upstream
        onCancel={this.props.onCancel}
        disabled={!this.state.name}
        onConfirm={() => {
          this.props.onConfirm(this.state.name);
        }}
        customFooter={hasColumns ? null :
<<<<<<< HEAD
          <div className={footer}>
=======
          <div className={modalStyles.footer}>
>>>>>>> origin/upstream
            <Button value='Okay, go back.' onClick={this.props.onCancel} />
          </div>
        }>
        {content}
      </Modal>
    );
  }
}
