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
 * Dialog to configure the AI agent from the UI. Supports MULTIPLE models
 * (add/edit/delete), all sharing a single OpenAI API key. The key is stored as
 * the app env var (OPENAI_API_KEY); the model list (non-secret) is cached in
 * localStorage. Only OpenAI is supported for now, so provider is fixed.
 */
const emptyModel = () => ({ name: '', model: '' });

export default class AgentConfigDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.stateFromProps();
  }

  stateFromProps() {
    const initial = this.props.initialModels || [];
    const models = initial.length
      ? initial.map(m => ({ name: m.name || '', model: m.model || '' }))
      : [{ name: 'My model', model: '' }];
    return { apiKey: this.props.initialApiKey || '', models };
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.setState(this.stateFromProps());
    }
  }

  clearFields = () => this.setState(this.stateFromProps());

  updateModel(index, field, value) {
    const models = this.state.models.map((m, i) =>
      i === index ? { ...m, [field]: String(value ?? '') } : m
    );
    this.setState({ models });
  }

  addModel = () => {
    this.setState({ models: [...this.state.models, emptyModel()] });
  };

  removeModel(index) {
    const models = this.state.models.filter((_, i) => i !== index);
    this.setState({ models: models.length ? models : [emptyModel()] });
  }

  valid() {
    return (
      this.state.apiKey.trim() !== '' &&
      this.state.models.length > 0 &&
      this.state.models.every(m => m.name.trim() !== '' && m.model.trim() !== '')
    );
  }

  render() {
    const { models } = this.state;
    return (
      <B4aFormModal
        title="Configure AI Agent"
        subtitle="Add one or more OpenAI models. They share the same API key."
        open={this.props.open}
        submitText="Save"
        inProgressText={'Saving…'}
        enabled={this.valid()}
        clearFields={this.clearFields}
        onClose={this.props.onClose}
        onSubmit={() =>
          Promise.resolve(
            this.props.onConfirm({
              apiKey: this.state.apiKey.trim(),
              models: this.state.models.map(m => ({
                name: m.name.trim(),
                provider: 'openai',
                model: m.model.trim(),
              })),
            })
          )
        }
      >
        <Field
          label={<Label text="Provider" />}
          input={<TextInput dark={false} padding="0 1rem" disabled={true} value="OpenAI" onChange={() => {}} />}
        />
        <Field
          label={<Label text="API Key" description="Saved as the app env var OPENAI_API_KEY. Saving rebuilds your app." />}
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
        {models.map((m, i) => (
          <Field
            key={i}
            label={
              <Label
                text={`Model ${i + 1}`}
                description={
                  models.length > 1 ? (
                    <a
                      style={{ color: '#e85c3e', cursor: 'pointer' }}
                      onClick={() => this.removeModel(i)}
                    >
                      Remove
                    </a>
                  ) : null
                }
              />
            }
            input={
              <div style={{ display: 'flex', gap: '8px', padding: '0 1rem' }}>
                <TextInput
                  dark={false}
                  placeholder="Display name"
                  value={m.name}
                  onChange={value => this.updateModel(i, 'name', value)}
                />
                <TextInput
                  dark={false}
                  placeholder="e.g. gpt-4o"
                  value={m.model}
                  onChange={value => this.updateModel(i, 'model', value)}
                />
              </div>
            }
          />
        ))}
        <Field
          label={<Label text="" />}
          input={
            <div style={{ padding: '0 1rem' }}>
              <a style={{ color: '#1669fc', cursor: 'pointer' }} onClick={this.addModel}>
                + Add model
              </a>
            </div>
          }
        />
      </B4aFormModal>
    );
  }
}
