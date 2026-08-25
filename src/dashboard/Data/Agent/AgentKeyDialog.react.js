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
 * Agent creation dialog. The LLM key is set at creation and is FIXED for the
 * agent's life (1 agent : 1 app, no in-place reconfigure). Two modes:
 *   - 'create': no agent exists yet.
 *   - 'new':    replace the current agent — destructive, warns the conversation
 *               is lost forever. This is the only way to switch key/provider.
 * The key is sent to the back4app2 API (stored encrypted, injected into the
 * container) and never shown back. Leaving both fields blank uses the platform
 * default key.
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
    const isNew = this.props.mode === 'new';
    return (
      <B4aFormModal
        title={isNew ? 'Start a new agent' : 'Create AI agent'}
        subtitle={
          (isNew
            ? 'This permanently deletes this agent and its entire conversation — this cannot be undone. '
            : '') +
          "Optionally use your own OpenAI / Anthropic key. Leave blank to use the platform's default. The key is FIXED for this agent — to switch it later you create a new agent. The value is encrypted and never shown again."
        }
        open={this.props.open}
        submitText={isNew ? 'Delete & create' : 'Create agent'}
        inProgressText={isNew ? 'Recreating…' : 'Creating…'}
        enabled={true}
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
              description="Leave blank to use the platform key."
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
              description="Leave blank to use the platform key."
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
