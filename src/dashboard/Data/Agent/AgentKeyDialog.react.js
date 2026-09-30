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
import { defaultModelFor, fetchPlatformModels, fetchProviderModels } from './agentModels';

// "Custom…" escape hatch so the client can type any model id their key supports.
const CUSTOM = '__custom__';
// Wait for the user to stop typing the key before asking the provider.
const KEY_DEBOUNCE_MS = 600;

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
 *
 * The model list is asked of the provider with the key being typed (straight
 * from the browser to OpenAI/Anthropic, nowhere else), so it shows the newest
 * models that key can use; without a usable answer it shows back4app2's list.
 * See agentModels.js.
 */
export default class AgentKeyDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      provider: 'openai',
      apiKey: '',
      model: '',
      customModel: '',
      models: [],
      // 'platform' (back4app2's list) | 'loading' | 'provider' (from the key)
      modelsSource: 'platform',
      // Why the provider couldn't list models, shown under the dropdown.
      modelsError: null,
    };
    this.keyTimer = null;
    this.modelsRequest = null;
  }

  componentDidMount() {
    this.loadPlatformModels('openai');
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.cancelModelsRequest();
      this.setState({ provider: 'openai', apiKey: '', customModel: '' }, () =>
        this.loadPlatformModels('openai')
      );
    }
  }

  componentWillUnmount() {
    this.cancelModelsRequest();
  }

  cancelModelsRequest() {
    clearTimeout(this.keyTimer);
    if (this.modelsRequest) {
      this.modelsRequest.abort();
      this.modelsRequest = null;
    }
  }

  // A new list replaces the old one. The picked model survives when the new
  // list still has it; otherwise the list's default takes its place.
  setModels(provider, models, modelsSource, modelsError = null) {
    this.setState(prev => {
      if (prev.provider !== provider) {
        return null; // the user switched provider while this was loading
      }
      const keep = prev.model === CUSTOM || models.includes(prev.model);
      return {
        models,
        modelsSource,
        modelsError,
        model: keep ? prev.model : defaultModelFor(provider, models),
      };
    });
  }

  async loadPlatformModels(provider, modelsError = null) {
    const models = await fetchPlatformModels(provider);
    this.setModels(provider, models, 'platform', modelsError);
  }

  loadModels = () => {
    this.cancelModelsRequest();
    const { provider, apiKey } = this.state;
    const key = apiKey.trim();
    if (!key) {
      this.loadPlatformModels(provider);
      return;
    }
    this.keyTimer = setTimeout(async () => {
      const controller = new AbortController();
      this.modelsRequest = controller;
      this.setState({ modelsSource: 'loading', modelsError: null });
      try {
        const models = await fetchProviderModels(provider, key, controller.signal);
        if (this.modelsRequest === controller) {
          this.setModels(provider, models, 'provider');
        }
      } catch (error) {
        if (this.modelsRequest === controller && error.name !== 'AbortError') {
          this.loadPlatformModels(provider, error.message || 'the provider could not be reached');
        }
      }
    }, KEY_DEBOUNCE_MS);
  };

  clearFields = () => this.setState({ apiKey: '', customModel: '' });

  // Switching provider: the typed key belongs to the other provider, so the
  // list goes back to back4app2's for this one until a key is entered.
  onProviderChange = provider => {
    this.cancelModelsRequest();
    this.setState({ provider, apiKey: '', model: '', customModel: '' }, () =>
      this.loadPlatformModels(provider)
    );
  };

  onKeyChange = value => this.setState({ apiKey: String(value ?? '') }, this.loadModels);

  modelDescription() {
    const { provider, modelsSource, modelsError } = this.state;
    const name = provider === 'openai' ? 'OpenAI' : 'Anthropic';
    if (modelsSource === 'loading') {
      return `Loading the models your key can use from ${name}…`;
    }
    if (modelsSource === 'provider') {
      return `The newest models your ${name} key can use. Or enter a custom model id.`;
    }
    if (modelsError) {
      return `Couldn't list your models (${modelsError}) — showing Back4App's list.`;
    }
    return 'Enter your API key below to list the newest models it can use.';
  }

  render() {
    const isNew = this.props.mode === 'new';
    const { provider, apiKey, model, customModel, models } = this.state;
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
              description={this.modelDescription()}
            />
          }
          input={
            <Dropdown value={model} onChange={value => this.setState({ model: value })}>
              {models.map(m => (
                <Option key={m} value={m}>{m}</Option>
              ))}
              <Option value={CUSTOM}>Custom…</Option>
            </Dropdown>
          }
        />
        {isCustom ? (
          <Field
            label={<Label text="Custom model id" description="e.g. gpt-6.1-sol / claude-sonnet-5-5" />}
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
              onChange={this.onKeyChange}
            />
          }
        />
      </B4aFormModal>
    );
  }
}
