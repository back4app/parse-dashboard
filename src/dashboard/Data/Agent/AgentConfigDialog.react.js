/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import B4aFormModal from 'components/FormModal/B4aFormModal.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import TextInput from 'components/TextInput/TextInput.react';
import React from 'react';

/**
 * Dialog to let the dashboard user provide their own AI agent credentials
 * from the UI, instead of editing the dashboard configuration file.
 *
 * Only OpenAI is supported for now (see Parse-Dashboard/app.js); the provider
 * is fixed to 'openai'.
 *
 * NOTE: for now this persists to localStorage (see Agent.react.js). That is a
 * temporary/insecure store — the intended design stores the key server-side
 * (app Cloud Code env var). This dialog is UI-first so we can iterate on UX.
 */
export default class AgentConfigDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.fieldsFromProps();
  }

  fieldsFromProps() {
    const model = this.props.initialModel || {};
    return {
      name: model.name || 'My model',
      model: model.model || '',
      apiKey: model.apiKey || '',
    };
  }

  componentDidUpdate(prevProps) {
    // Refresh the fields from the current config each time the dialog opens.
    if (!prevProps.open && this.props.open) {
      this.setState(this.fieldsFromProps());
    }
  }

  valid() {
    return (
      this.state.name.trim() !== '' &&
      this.state.model.trim() !== '' &&
      this.state.apiKey.trim() !== ''
    );
  }

  clearFields = () => {
    this.setState(this.fieldsFromProps());
  };

  render() {
    return (
      <B4aFormModal
        title="Configure AI Agent"
        subtitle="Provide your own OpenAI credentials to use the agent."
        open={this.props.open}
        submitText="Save"
        inProgressText={'Saving…'}
        enabled={this.valid()}
        clearFields={this.clearFields}
        onClose={this.props.onClose}
        onSubmit={() => {
          this.props.onConfirm({
            name: this.state.name.trim(),
            provider: 'openai',
            model: this.state.model.trim(),
            apiKey: this.state.apiKey.trim(),
          });
          return Promise.resolve();
        }}
      >
        <Field
          label={<Label text="Provider" />}
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              disabled={true}
              value="OpenAI"
              onChange={() => {}}
            />
          }
        />
        <Field
          label={<Label text="Display name" description="Shown in the model picker." />}
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              value={this.state.name}
              onChange={value => this.setState({ name: String(value ?? '') })}
            />
          }
        />
        <Field
          label={<Label text="Model" description="The OpenAI model identifier." />}
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              placeholder="e.g. gpt-4o"
              value={this.state.model}
              onChange={value => this.setState({ model: String(value ?? '') })}
            />
          }
        />
        <Field
          label={<Label text="API Key" description="Stored locally in your browser for now." />}
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              hidden={true}
              placeholder="sk-..."
              value={this.state.apiKey}
              onChange={value => this.setState({ apiKey: String(value ?? '') })}
            />
          }
        />
      </B4aFormModal>
    );
  }
}
