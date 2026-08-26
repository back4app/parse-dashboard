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
import Toggle from 'components/Toggle/Toggle.react';
import React from 'react';

/**
 * Agent creation dialog. An agent uses a SINGLE LLM provider (OpenAI OR
 * Anthropic), fixed for its life (1 agent : 1 app, no in-place reconfigure —
 * switching provider means a new container = a new agent). Two modes:
 *   - 'create': no agent exists yet.
 *   - 'new':    replace the current agent — destructive, warns the conversation
 *               is lost forever. This is the only way to switch provider/key.
 * The key is sent to the back4app2 API (stored encrypted, injected into the
 * container) and never shown back. Leaving it blank uses the platform default.
 */
export default class AgentKeyDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { provider: 'openai', apiKey: '' };
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.setState({ provider: 'openai', apiKey: '' });
    }
  }

  clearFields = () => this.setState({ apiKey: '' });

  render() {
    const isNew = this.props.mode === 'new';
    const { provider, apiKey } = this.state;
    const isOpenai = provider === 'openai';
    // Send only the chosen provider's key; the other is explicitly empty so the
    // agent runs on a single provider (no accidental platform fallback).
    const creds = isOpenai
      ? { openaiApiKey: apiKey.trim(), anthropicApiKey: '' }
      : { openaiApiKey: '', anthropicApiKey: apiKey.trim() };
    return (
      <B4aFormModal
        title={isNew ? 'Start a new agent' : 'Create AI agent'}
        subtitle={
          (isNew
            ? 'This permanently deletes this agent and its entire conversation — this cannot be undone. '
            : '') +
          "Pick one LLM provider and optionally use your own key for it. Leave the key blank to use the platform's default. The provider/key is FIXED for this agent — to switch it you create a new agent. The value is encrypted and never shown again."
        }
        open={this.props.open}
        submitText={isNew ? 'Delete & create' : 'Create agent'}
        inProgressText={isNew ? 'Recreating…' : 'Creating…'}
        enabled={true}
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
            <Toggle
              type={Toggle.Types.TWO_WAY}
              optionLeft="OpenAI"
              optionRight="Anthropic"
              value={isOpenai ? 'OpenAI' : 'Anthropic'}
              onChange={value =>
                this.setState({ provider: value === 'Anthropic' ? 'anthropic' : 'openai' })
              }
            />
          }
        />
        <Field
          label={
            <Label
              text={isOpenai ? 'OpenAI API key' : 'Anthropic API key'}
              description="Leave blank to use the platform key."
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
