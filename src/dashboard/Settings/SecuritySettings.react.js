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
import FormButton from 'components/FormButton/FormButton.react';
import FormModal from 'components/FormModal/FormModal.react';
import B4aKeyField from 'components/KeyField/B4aKeyField.react';
import Label from 'components/Label/Label.react';
import Modal from 'components/Modal/Modal.react';
import React from 'react';
import styles from 'dashboard/Settings/Settings.scss';
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
    };
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
        <div style={{ maxWidth: '800px', margin: '2rem auto', marginTop: '5rem' }}>
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
              input={<B4aKeyField>{currentApp.applicationId}</B4aKeyField>}
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
              input={<B4aKeyField>{currentApp.clientKey}</B4aKeyField>}
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
              input={<B4aKeyField>{currentApp.javascriptKey}</B4aKeyField>}
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
              input={<B4aKeyField>{currentApp.windowsKey}</B4aKeyField>}
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
                <B4aKeyField name="REST" hidden={true} showKeyName={true}>
                  {currentApp.restKey}
                </B4aKeyField>
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
                <B4aKeyField name="Webhook" hidden={true} showKeyName={true}>
                  {currentApp.webhookKey}
                </B4aKeyField>
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
                <B4aKeyField name="File" hidden={true} showKeyName={true}>
                  {currentApp.fileKey}
                </B4aKeyField>
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
                <B4aKeyField name="Master" hidden={true} showKeyName={true}>
                  {currentApp.masterKey}
                </B4aKeyField>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>
        </div>
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
