/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import B4aFormModal from 'components/FormModal/B4aFormModal.react';
import Dropdown from 'components/Dropdown/Dropdown.react';
import Field from 'components/Field/Field.react';
import Icon from 'components/Icon/Icon.react';
import Label from 'components/Label/Label.react';
import Option from 'components/Dropdown/Option.react';
import TextInput from 'components/TextInput/TextInput.react';
import React from 'react';

/**
 * Dialog to configure the AI agent from the UI. Supports MULTIPLE models
 * (add/edit/delete), all sharing a single OpenAI API key. The key is stored as
 * the app env var (OPENAI_API_KEY); the model list (non-secret) is stored in the
 * AGENT_MODELS env var. Only OpenAI is supported for now, so provider is fixed.
 */

// Curated list of common OpenAI models for the dropdown. Not exhaustive — the
// "Custom…" option lets the user type any model id (e.g. a brand-new release),
// so this list can lag behind OpenAI without blocking anyone.
const CURATED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'o3',
  'o3-mini',
  'gpt-5',
  'gpt-5-mini',
];
const CUSTOM_OPTION = '__custom__';

const emptyModel = () => ({ name: '', model: '', custom: false });

// A saved model whose id is not in the curated list is shown as "Custom".
const modelFromInitial = m => {
  const model = m.model || '';
  return { name: m.name || '', model, custom: !!model && !CURATED_MODELS.includes(model) };
};

export default class AgentConfigDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.stateFromProps();
  }

  stateFromProps() {
    const initial = this.props.initialModels || [];
    const models = initial.length ? initial.map(modelFromInitial) : [emptyModel()];
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

  // Handle a pick in the model dropdown. Selecting "Custom…" switches the row to
  // a free-text id (cleared so the user types one); picking a curated model sets
  // the id directly.
  selectModel(index, value) {
    const models = this.state.models.map((m, i) => {
      if (i !== index) { return m; }
      if (value === CUSTOM_OPTION) { return { ...m, custom: true, model: '' }; }
      return { ...m, custom: false, model: value };
    });
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
    // The display name is optional (it falls back to the model id on save); only
    // the API key and the model id are required.
    return (
      this.state.apiKey.trim() !== '' &&
      this.state.models.length > 0 &&
      this.state.models.every(m => m.model.trim() !== '')
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
                name: m.name.trim() || m.model.trim(),
                provider: 'openai',
                model: m.model.trim(),
              })),
            })
          )
        }
      >
        <div style={{ padding: '12px 1rem', margin: '0 0 8px', background: 'rgba(22,105,252,0.08)', border: '1px solid rgba(22,105,252,0.25)', borderRadius: 6, fontSize: 13, lineHeight: 1.4, color: '#334155' }}>
          <strong>Heads up:</strong> saving will install the agent into your app&apos;s{' '}
          <strong>Cloud Code</strong> (a managed file <code>cloud/dashboard-agent/index.js</code>{' '}
          and a <code>require</code> in your <code>main.js</code>), set the{' '}
          <code>OPENAI_API_KEY</code> and <code>AGENT_MODELS</code> environment variables, and{' '}
          <strong>redeploy your app</strong>. The agent then runs inside your app&apos;s container.
        </div>
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
        <Field
          label={<Label text="Models" description="Add one or more models to switch between." />}
          input={
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 1rem' }}>
              <span
                style={{ cursor: 'pointer', display: 'inline-flex' }}
                onClick={this.addModel}
                title="Add model"
              >
                <Icon name="b4a-add-outline-circle" width={22} height={22} fill="#1669fc" />
              </span>
            </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 1rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <TextInput
                    dark={false}
                    placeholder="Display name (optional)"
                    value={m.name}
                    onChange={value => this.updateModel(i, 'name', value)}
                  />
                  <div style={{ flex: 1 }}>
                    <Dropdown
                      value={m.custom ? CUSTOM_OPTION : m.model}
                      onChange={value => this.selectModel(i, value)}
                    >
                      {[
                        <Option key="__none" value="">Select a model</Option>,
                        ...CURATED_MODELS.map(id => (
                          <Option key={id} value={id}>{id}</Option>
                        )),
                        <Option key={CUSTOM_OPTION} value={CUSTOM_OPTION}>Custom…</Option>,
                      ]}
                    </Dropdown>
                  </div>
                </div>
                {m.custom ? (
                  <TextInput
                    dark={false}
                    placeholder="Custom model id (e.g. gpt-4o-2024-11-20)"
                    value={m.model}
                    onChange={value => this.updateModel(i, 'model', value)}
                  />
                ) : null}
              </div>
            }
          />
        ))}
        {this.props.onDelete && this.props.initialApiKey ? (
          <Field
            label={<Label text="Danger zone" description="Removes the OpenAI key and models env vars. Rebuilds your app." />}
            input={
              <div style={{ padding: '0 1rem' }}>
                <a
                  style={{ color: '#e85c3e', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    // eslint-disable-next-line no-alert
                    if (window.confirm('Delete the AI agent for this app? This removes the API key and models and rebuilds the app.')) {
                      this.props.onDelete();
                    }
                  }}
                >
                  Delete agent
                </a>
              </div>
            }
          />
        ) : null}
      </B4aFormModal>
    );
  }
}
