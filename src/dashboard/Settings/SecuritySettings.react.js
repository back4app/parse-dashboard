/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager from 'lib/AccountManager';
import DashboardView from 'dashboard/DashboardView.react';
import Button from 'components/Button/Button.react';
import Field from 'components/Field/Field.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import FlowView from 'components/FlowView/FlowView.react';
import FormButton from 'components/FormButton/FormButton.react';
import FormModal from 'components/FormModal/FormModal.react';
import B4aKeyField from 'components/KeyField/B4aKeyField.react';
import Icon from 'components/Icon/Icon.react';
import Label from 'components/Label/Label.react';
import Modal from 'components/Modal/Modal.react';
import React from 'react';
import styles from 'dashboard/Settings/Settings.scss';
import TextInput from 'components/TextInput/TextInput.react';
import Toggle from 'components/Toggle/Toggle.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';

export default class SecuritySettings extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Security & Keys';

    this.state = {
      saveState: null,
      dataFetched: false,
      showResetDialog: false,
      resetError: false,
      passwordInput: '',

      // Keys edit mode (layout-only)
      isEditingKeys: false,
      keyDrafts: null,
      originalKeyDrafts: null,
      savingKeys: false,
      saveKeysError: null,
    };
  }

  getKeysSnapshot(currentApp) {
    return {
      clientKey: currentApp.clientKey,
      javascriptKey: currentApp.javascriptKey,
      windowsKey: currentApp.windowsKey,
      restKey: currentApp.restKey,
      webhookKey: currentApp.webhookKey,
      fileKey: currentApp.fileKey,
      masterKey: currentApp.masterKey,
    };
  }

  getKeyChanges() {
    const { keyDrafts, originalKeyDrafts } = this.state;
    const changes = {};
    Object.keys(originalKeyDrafts || {}).forEach(k => {
      if (keyDrafts && keyDrafts[k] !== originalKeyDrafts[k]) {
        changes[k] = keyDrafts[k];
      }
    });
    return changes;
  }

  hasKeyChanges() {
    return Object.keys(this.getKeyChanges()).length > 0;
  }

  exitEditKeys() {
    this.setState({
      isEditingKeys: false,
      keyDrafts: null,
      originalKeyDrafts: null,
      savingKeys: false,
      saveKeysError: null,
    });
  }

  onClickEditOrSaveKeys(currentApp) {
    if (!this.state.isEditingKeys) {
      const snap = this.getKeysSnapshot(currentApp);
      this.setState({
        isEditingKeys: true,
        keyDrafts: { ...snap },
        originalKeyDrafts: { ...snap },
        saveKeysError: null,
      });
      return;
    }

    if (this.state.savingKeys) {
      return;
    }

    const changes = this.getKeyChanges();
    if (Object.keys(changes).length === 0) {
      // Save button is disabled when there are no changes; keep a safe guard here.
      return;
    }

    this.setState({ savingKeys: true, saveKeysError: null });
    currentApp
      .updateAppKeys(changes)
      .then(() => {
        this.exitEditKeys();
      })
      .catch(err => {
        this.setState({
          savingKeys: false,
          saveKeysError: err?.message || err?.error || err?.notice || 'Failed to save keys.',
        });
      });
  }

  renderKeyField({ keyName, value, name, hidden, showKeyName }) {
    // Application ID is never editable; keep the original display layout always.
    if (keyName === 'applicationId') {
      return <B4aKeyField>{value}</B4aKeyField>;
    }

    if (!this.state.isEditingKeys) {
      // Keep existing, unmodified behavior for display mode
      if (showKeyName) {
        return (
          <B4aKeyField name={name} hidden={hidden} showKeyName={true}>
            {value}
          </B4aKeyField>
        );
      }
      return <B4aKeyField>{value}</B4aKeyField>;
    }

    const draftValue =
      this.state.keyDrafts && Object.prototype.hasOwnProperty.call(this.state.keyDrafts, keyName)
        ? this.state.keyDrafts[keyName]
        : value;

    return (
      <div className={styles.editKeyRow}>
        <div style={{ flex: '1 1 auto' }}>
          <TextInput
            value={draftValue ?? ''}
            onChange={next =>
              this.setState(prev => ({
                keyDrafts: { ...(prev.keyDrafts || {}), [keyName]: next },
              }))
            }
            placeholder="Key"
            height={40}
            textAlign="right"
            className={styles.editKeyInput}
          />
        </div>
        <a
          className={styles.editKeyGenerateButton}
          onClick={e => {
            e.preventDefault();
            const confirm = window.confirm(
              'If the client is using this key, it will stop working'
            );
            if (!confirm) {
              return;
            }
            const currentApp = this.context;
            this.setState(prev => ({
              keyDrafts: {
                ...(prev.keyDrafts || {}),
                [keyName]: currentApp.generateKey(40),
              },
            }));
          }}
          role="button"
          title="Generate a new key"
        >
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>
      </div>
    );
  }

  renderForm({ fields, setField }) {
    const currentApp = this.context;
    const resetDialog = (
      <FormModal
        title="Reset Master Key"
        icon="keys-solid"
        iconSize={30}
        subtitle={
          AccountManager.currentUser().has_password
            ? 'This action is irreversible!'
            : 'Are you sure?'
        }
        open={this.state.showResetDialog}
        type={Modal.Types.DANGER}
        submitText="Reset"
        inProgressText={'Resetting\u2026'}
        enabled={this.state.passwordInput.length > 0 || !AccountManager.currentUser().has_password}
        onSubmit={() => currentApp.resetMasterKey(this.state.passwordInput)}
        onClose={() => this.setState({ showResetDialog: false })}
        clearFields={() => {
          this.setState({ passwordInput: '' });
        }}
        buttonsInCenter={!AccountManager.currentUser().has_password}
      >
        {AccountManager.currentUser().has_password ? (
          <Field
            labelWidth={60}
            label={
              <Label
                text="Your password"
                description={'We want to make sure it\u2019s really you.'}
              />
            }
            input={
              <TextInput
                hidden={true}
                value={this.state.passwordInput}
                onChange={passwordInput => this.setState({ passwordInput })}
                placeholder="Password"
              />
            }
          />
        ) : null}
      </FormModal>
    );
    const permissions = this.props.initialFields ? (
      <Fieldset
        legend="App Permissions"
        description="Helpful in development, but turn this off when you launch."
      >
        <Field
          labelWidth={60}
          label={
            <Label
              text="Allow client class creation"
              description={
                'Allows new classes to be created without the master key. Once your app\u2019s classes are finalized, you should disable access to protect your app from malicious users.'
              }
            />
          }
          input={
            <Toggle
              value={fields.client_class_creation_enabled}
              onChange={allow => setField('client_class_creation_enabled', allow)}
            />
          }
        />
      </Fieldset>
    ) : null;
    return (
      <div className={styles.settings_page}>
        <div className={styles.generalSettingsWrapper}>
          <Fieldset
            legend="App Keys"
            description="These are the unique identifiers used to access this app."
          >
            <Field
              label={
                <Label
                  text="Application ID"
                  dark={true}
                  description={
                    <span>
                      Main ID that uniquely specifies this app. <br />
                      Used with one of the keys below.
                    </span>
                  }
                />
              }
              input={this.renderKeyField({
                keyName: 'applicationId',
                value: currentApp.applicationId,
              })}
              theme={Field.Theme.BLUE}
            />
            <Field
              label={
                <Label
                  dark={true}
                  text="Client key"
                  description={
                    <span>
                      Use this in consumer clients, such as <br />
                      the iOS or Android SDKs.
                    </span>
                  }
                />
              }
              input={this.renderKeyField({
                keyName: 'clientKey',
                value: currentApp.clientKey,
              })}
              theme={Field.Theme.BLUE}
            />
            <Field
              label={
                <Label
                  text="JavaScript key"
                  description="Use this when making requests from JavaScript clients."
                  dark={true}
                />
              }
              input={this.renderKeyField({
                keyName: 'javascriptKey',
                value: currentApp.javascriptKey,
              })}
              theme={Field.Theme.BLUE}
            />
            <Field
              label={
                <Label
                  text=".NET key"
                  description={
                    <span>
                      Use this when making requests from <br />
                      Windows, Xamarin, or Unity clients.
                    </span>
                  }
                  dark={true}
                />
              }
              input={this.renderKeyField({
                keyName: 'windowsKey',
                value: currentApp.windowsKey,
              })}
              theme={Field.Theme.BLUE}
            />
            <Field
              label={
                <Label
                  text="REST API key"
                  description="Use this when making requests from server-side REST applications. Keep it secret!"
                  dark={true}
                />
              }
              input={
                this.renderKeyField({
                  keyName: 'restKey',
                  value: currentApp.restKey,
                  name: 'REST',
                  hidden: true,
                  showKeyName: true,
                })
              }
              theme={Field.Theme.BLUE}
            />
            <Field
              label={
                <Label
                  text="Webhook key"
                  description="Use this when implementing a Cloud Code Webhook. Keep it secret!"
                  dark={true}
                />
              }
              input={
                this.renderKeyField({
                  keyName: 'webhookKey',
                  value: currentApp.webhookKey,
                  name: 'Webhook',
                  hidden: true,
                  showKeyName: true,
                })
              }
              theme={Field.Theme.BLUE}
            />
            <Field
              label={
                <Label
                  text="File key"
                  description="Use this key when migrating to your own Parse Server to ensure your new server has access to existing files."
                  dark={true}
                />
              }
              input={
                this.renderKeyField({
                  keyName: 'fileKey',
                  value: currentApp.fileKey,
                  name: 'File',
                  hidden: true,
                  showKeyName: true,
                })
              }
              theme={Field.Theme.BLUE}
            />
            <Field
              label={
                <Label
                  text="Master key"
                  description="Using this key overrides all permissions. Not usable on client SDKs. Keep it secret!"
                  dark={true}
                />
              }
              input={
                this.renderKeyField({
                  keyName: 'masterKey',
                  value: currentApp.masterKey,
                  name: 'Master',
                  hidden: true,
                  showKeyName: true,
                })
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>
        </div>
        <Toolbar section="App Settings" subsection="Security & Keys">
          {this.state.isEditingKeys ? (
            <Button
              color="white"
              dark={true}
              width="auto"
              additionalStyles={{ marginRight: '0.5rem', padding: '0 0.75rem', fontSize: '12px' }}
              value="Cancel"
              onClick={() => this.exitEditKeys()}
            />
          ) : null}
          <Button
            primary={true}
            color="green"
            width="auto"
            progress={this.state.savingKeys}
            disabled={this.state.savingKeys || (this.state.isEditingKeys && !this.hasKeyChanges())}
            additionalStyles={{ marginLeft: '1rem', padding: '0 0.75rem', fontSize: '12px' }}
            value={this.state.isEditingKeys ? 'Save Changes' : 'Edit Keys'}
            onClick={() => this.onClickEditOrSaveKeys(currentApp)}
          />
        </Toolbar>
      </div>
    );
  }

  renderContent() {
    return (
      <FlowView
        initialFields={this.props.initialFields}
        initialChanges={{}}
        footerContents={({ changes }) => (
          <span>
            You've <strong>{changes.client_class_creation_enabled ? '' : 'dis'}allowed</strong>{' '}
            class creation on clients.
          </span>
        )}
        onSubmit={({ changes }) =>
          this.props.saveChanges({
            client_class_creation_enabled: changes.client_class_creation_enabled,
          })
        }
        renderForm={this.renderForm.bind(this)}
      />
    );
  }
}
