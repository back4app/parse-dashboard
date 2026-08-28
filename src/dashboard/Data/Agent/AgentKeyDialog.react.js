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
import Label from 'components/Label/Label.react';
import Option from 'components/Dropdown/Option.react';
import TextInput from 'components/TextInput/TextInput.react';
import React from 'react';

// Curated models per provider (the ones the platform's agent knows). Plus a
// "Custom…" escape hatch so the client can type any model id their key supports.
const MODELS = {
  openai: ['gpt-5.3-codex', 'gpt-5.5', 'gpt-5.6-terra'],
  anthropic: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-sonnet-4-6'],
};
const CUSTOM = '__custom__';
const defaultModelFor = provider => MODELS[provider][0];

/**
 * Agent creation dialog. An agent uses a SINGLE LLM provider (OpenAI OR
 * Anthropic) AND a single model, both FIXED for its life (1 agent : 1 app, no
 * in-place reconfigure — switching means a new container = a new agent). Two modes:
 *   - 'create': no agent exists yet.
 *   - 'new':    replace the current agent — destructive, warns the conversation
 *               is lost forever. This is the only way to switch provider/key/model.
 * The key is sent to the back4app2 API (stored encrypted, injected into the
 * container) and never shown back. Key AND model are REQUIRED — the agent always
 * runs on the client's own key and their chosen model (no platform fallback).
 */
export default class AgentKeyDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      provider: 'openai',
      apiKey: '',
      model: defaultModelFor('openai'),
      customModel: '',
    };
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.setState({
        provider: 'openai',
        apiKey: '',
        model: defaultModelFor('openai'),
        customModel: '',
      });
    }
  }

  clearFields = () => this.setState({ apiKey: '', customModel: '' });

  // Switching provider resets the model to that provider's default.
  onProviderChange = provider =>
    this.setState({ provider, model: defaultModelFor(provider), customModel: '' });

  render() {
    const isNew = this.props.mode === 'new';
    const { provider, apiKey, model, customModel } = this.state;
    const isOpenai = provider === 'openai';
    const isCustom = model === CUSTOM;
    const effectiveModel = (isCustom ? customModel : model).trim();
    // Send only the chosen provider's key; the other is explicitly empty so the
    // agent runs on a single provider (no accidental platform fallback).
    const creds = {
      openaiApiKey: isOpenai ? apiKey.trim() : '',
      anthropicApiKey: isOpenai ? '' : apiKey.trim(),
      model: effectiveModel,
    };
    return (
      <B4aFormModal
        title={isNew ? 'Start a new Backend Agent' : 'Create Backend Agent'}
        subtitle={
          isNew
            ? 'Permanently deletes this agent and its conversation. Choose a provider, model and API key — stored encrypted, never shown again.'
            : 'Choose a provider, model and enter your own API key — stored encrypted, never shown again.'
        }
        open={this.props.open}
        submitText={isNew ? 'Delete & create' : 'Create agent'}
        inProgressText={isNew ? 'Recreating…' : 'Creating…'}
        enabled={apiKey.trim() !== '' && effectiveModel !== ''}
        clearFields={this.clearFields}
        onClose={this.props.onClose}
        onSubmit={() => Promise.resolve(this.props.onConfirm(creds))}
      >
        <Field
          label={
            <Label
              text="Provider"
              description="The agent uses a single LLM provider."
            />
          }
          input={
            <Dropdown value={provider} onChange={this.onProviderChange}>
              <Option value="openai">OpenAI</Option>
              <Option value="anthropic">Anthropic</Option>
            </Dropdown>
          }
        />
        <Field
          label={
            <Label
              text="Model"
              description="Runs on your own key. Pick one or enter a custom model id."
            />
          }
          input={
            <Dropdown value={model} onChange={value => this.setState({ model: value })}>
              {MODELS[provider].map(m => (
                <Option key={m} value={m}>{m}</Option>
              ))}
              <Option value={CUSTOM}>Custom…</Option>
            </Dropdown>
          }
        />
        {isCustom ? (
          <Field
            label={<Label text="Custom model id" description="e.g. gpt-5.3-codex / claude-sonnet-5" />}
            input={
              <TextInput
                dark={false}
                padding="0 1rem"
                placeholder={isOpenai ? 'gpt-…' : 'claude-…'}
                value={customModel}
                onChange={value => this.setState({ customModel: String(value ?? '') })}
              />
            }
          />
        ) : null}
        <Field
          label={
            <Label
              text={isOpenai ? 'OpenAI API key' : 'Anthropic API key'}
              description="Required — the agent runs on your own key."
            />
          }
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              hidden={true}
              placeholder={isOpenai ? 'sk-…' : 'sk-ant-…'}
              value={apiKey}
              onChange={value => this.setState({ apiKey: String(value ?? '') })}
            />
          }
        />
      </B4aFormModal>
    );
  }
}
