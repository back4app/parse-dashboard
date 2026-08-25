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
 * BYOK dialog: let the user set their own OpenAI / Anthropic key for THIS app's
 * agent. The key is sent to the back4app2 API (stored encrypted, injected into
 * the agent container). Leaving a field blank keeps the current value — the key
 * is never shown back. Only whether a key is set (hasOpenai/hasAnthropic) is
 * known here.
 */
export default class AgentKeyDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { openaiApiKey: '', anthropicApiKey: '' };
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.setState({ openaiApiKey: '', anthropicApiKey: '' });
    }
  }

  clearFields = () => this.setState({ openaiApiKey: '', anthropicApiKey: '' });

  render() {
    const { hasOpenai, hasAnthropic } = this.props;
    const isCreate = this.props.mode === 'create';
    const openaiSet = this.state.openaiApiKey.trim() !== '';
    const anthropicSet = this.state.anthropicApiKey.trim() !== '';
    return (
      <B4aFormModal
        title={isCreate ? 'Create AI agent' : 'AI credentials'}
        subtitle={
          isCreate
            ? "Optionally use your own OpenAI / Anthropic key for this agent. Leave blank to use the platform's default key — you can add or change it later. The value is encrypted and never shown again."
            : "Use your own OpenAI / Anthropic key for this app's agent. Leave a field blank to keep the current key. The value is encrypted and never shown again."
        }
        open={this.props.open}
        submitText={isCreate ? 'Create agent' : 'Save'}
        inProgressText={isCreate ? 'Creating…' : 'Saving…'}
        enabled={isCreate || openaiSet || anthropicSet}
        clearFields={this.clearFields}
        onClose={this.props.onClose}
        onSubmit={() =>
          Promise.resolve(
            this.props.onConfirm({
              openaiApiKey: this.state.openaiApiKey.trim(),
              anthropicApiKey: this.state.anthropicApiKey.trim(),
            })
          )
        }
      >
        <Field
          label={
            <Label
              text="OpenAI API key"
              description={
                hasOpenai
                  ? 'A key is currently set. Enter a new one to replace it.'
                  : 'Not set — the agent uses the platform key.'
              }
            />
          }
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              hidden={true}
              placeholder="sk-…"
              value={this.state.openaiApiKey}
              onChange={value => this.setState({ openaiApiKey: String(value ?? '') })}
            />
          }
        />
        <Field
          label={
            <Label
              text="Anthropic API key (optional)"
              description={hasAnthropic ? 'A key is currently set.' : 'Not set.'}
            />
          }
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              hidden={true}
              placeholder="sk-ant-…"
              value={this.state.anthropicApiKey}
              onChange={value => this.setState({ anthropicApiKey: String(value ?? '') })}
            />
          }
        />
      </B4aFormModal>
    );
  }
}
