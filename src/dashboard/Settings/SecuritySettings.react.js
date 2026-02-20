/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager from 'lib/AccountManager';
import DashboardView from 'dashboard/DashboardView.react';
import Field from 'components/Field/Field.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import FlowView from 'components/FlowView/FlowView.react';
import FormModal from 'components/FormModal/FormModal.react';
import B4aFormModal from 'components/FormModal/B4aFormModal.react';
import B4aKeyField from 'components/KeyField/B4aKeyField.react';
import Icon from 'components/Icon/Icon.react';
import Label from 'components/Label/Label.react';
import Modal from 'components/Modal/Modal.react';
import React from 'react';
import styles from 'dashboard/Settings/Settings.scss';
import generalStyles from 'dashboard/Settings/GeneralSettings.scss';
import TextInput from 'components/TextInput/TextInput.react';
import Toggle from 'components/Toggle/Toggle.react';
import Toolbar from 'components/Toolbar/Toolbar.react';

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

      showKeyChangeDialog: false,
      keyChangeName: '',
      keyChangeTitle: '',
      keyChangeValue: '',
    };
  }

  closeKeyChangeDialog() {
    this.setState({
      showKeyChangeDialog: false,
    });
  }

  openKeyChangeDialog({ keyName, title, value }) {
    this.setState({
      showKeyChangeDialog: true,
      keyChangeName: keyName,
      keyChangeTitle: title,
      keyChangeValue: value ?? '',
    });
  }

  renderKeyValueWithChange({ keyName, title, currentValue, valueNode }) {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
        {valueNode}
        <div className={styles.keyChangeActionWrapper}>
          <button
            type="button"
            className={generalStyles.changeActionBtn}
            onClick={() => this.openKeyChangeDialog({ keyName, title, value: currentValue })}
          >
            Change
          </button>
        </div>
      </span>
    );
  }

  renderForm({ fields, setField }) {
    const currentApp = this.context;

    const keyChangeDialog = (
      <B4aFormModal
        title={this.state.keyChangeTitle || 'Change key'}
        icon="keys-solid"
        iconSize={30}
        subtitle="This action will update the key for this app."
        width={700}
        open={this.state.showKeyChangeDialog}
        submitText="Save Changes"
        inProgressText={'Saving\u2026'}
        enabled={
          (this.state.keyChangeValue || '').length > 0 &&
          this.state.keyChangeName &&
          this.state.keyChangeValue !== (currentApp && currentApp[this.state.keyChangeName])
        }
        onSubmit={() => currentApp.updateAppKeys({ [this.state.keyChangeName]: this.state.keyChangeValue })}
        onClose={this.closeKeyChangeDialog.bind(this)}
        clearFields={() => {
          this.setState({ keyChangeName: '', keyChangeTitle: '', keyChangeValue: '' });
        }}
      >
        <Field
          labelWidth={40}
          label={
            <Label
              text="Key value"
              description="Set a new value or generate one."
            />
          }
          input={
            <div className={styles.keyChangeContainer}>
              <TextInput
                value={this.state.keyChangeValue}
                onChange={keyChangeValue => this.setState({ keyChangeValue })}
                placeholder="Key"
                height={40}
                textAlign="left"
                dark={false}
                className={styles.keyChangeInput}
              />
            </div>
          }
        />
        <div className={styles.keyChangeGenerateOutside}>
          <button
            type="button"
            className={styles.keyChangeGenerateLink}
            onClick={() => {
              const confirm = window.confirm('If the client is using this key, it will stop working');
              if (!confirm) {
                return;
              }
              this.setState({ keyChangeValue: currentApp.generateKey(40) });
            }}
            title="Generate a new key"
          >
            Generate
          </button>
        </div>
      </B4aFormModal>
    );

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
              input={
                <div className={styles.disabledKeyValue}>
                  <B4aKeyField compact={true}>{currentApp.applicationId || 'N/A'}</B4aKeyField>
                </div>
              }
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
              input={this.renderKeyValueWithChange({
                keyName: 'clientKey',
                title: 'Change Client key',
                currentValue: currentApp.clientKey,
                valueNode: <B4aKeyField compact={true}>{currentApp.clientKey || 'N/A'}</B4aKeyField>,
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
              input={this.renderKeyValueWithChange({
                keyName: 'javascriptKey',
                title: 'Change JavaScript key',
                currentValue: currentApp.javascriptKey,
                valueNode: <B4aKeyField compact={true}>{currentApp.javascriptKey || 'N/A'}</B4aKeyField>,
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
              input={this.renderKeyValueWithChange({
                keyName: 'windowsKey',
                title: 'Change .NET key',
                currentValue: currentApp.windowsKey,
                valueNode: <B4aKeyField compact={true}>{currentApp.windowsKey || 'N/A'}</B4aKeyField>,
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
                this.renderKeyValueWithChange({
                  keyName: 'restKey',
                  title: 'Change REST API key',
                  currentValue: currentApp.restKey,
                  valueNode: (
                    <B4aKeyField compact={true}>{currentApp.restKey || 'N/A'}</B4aKeyField>
                  ),
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
                this.renderKeyValueWithChange({
                  keyName: 'webhookKey',
                  title: 'Change Webhook key',
                  currentValue: currentApp.webhookKey,
                  valueNode: (
                    <B4aKeyField compact={true}>{currentApp.webhookKey || 'N/A'}</B4aKeyField>
                  ),
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
                this.renderKeyValueWithChange({
                  keyName: 'fileKey',
                  title: 'Change File key',
                  currentValue: currentApp.fileKey,
                  valueNode: (
                    <B4aKeyField compact={true}>{currentApp.fileKey || 'N/A'}</B4aKeyField>
                  ),
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
                this.renderKeyValueWithChange({
                  keyName: 'masterKey',
                  title: 'Change Master key',
                  currentValue: currentApp.masterKey,
                  valueNode: (
                    currentApp.masterKey ? (
                      <B4aKeyField name="Master" hidden={true} showKeyName={true} compactHidden={true}>
                        {currentApp.masterKey}
                      </B4aKeyField>
                    ) : (
                      <B4aKeyField compact={true}>{'N/A'}</B4aKeyField>
                    )
                  ),
                })
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>
        </div>
        {keyChangeDialog}
        {resetDialog}
        <Toolbar section="App Settings" subsection="Security & Keys" />
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
