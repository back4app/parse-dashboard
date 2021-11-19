/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager                    from 'lib/AccountManager';
import AppsManager                       from 'lib/AppsManager';
import Collaborators                     from 'dashboard/Settings/Collaborators.react';
import DashboardView                     from 'dashboard/DashboardView.react';
import Dropdown                          from 'components/Dropdown/Dropdown.react';
import DropdownOption                    from 'components/Dropdown/Option.react';
import Field                             from 'components/Field/Field.react';
import FieldSettings                     from 'components/FieldSettings/FieldSettings.react';
import Fieldset                          from 'components/Fieldset/Fieldset.react';
import FlowView                          from 'components/FlowView/FlowView.react';
import FormButton                        from 'components/FormButton/FormButton.react';
import FormModal                         from 'components/FormModal/FormModal.react';
import FormNote                          from 'components/FormNote/FormNote.react';
import getSiteDomain                     from 'lib/getSiteDomain';
import history                           from 'dashboard/history';
import joinWithFinal                     from 'lib/joinWithFinal';
import KeyField                          from 'components/KeyField/KeyField.react';
import Label                             from 'components/Label/Label.react';
import LabelSettings                     from 'components/LabelSettings/LabelSettings.react';
import Modal                             from 'components/Modal/Modal.react';
import MultiSelect                       from 'components/MultiSelect/MultiSelect.react';
import MultiSelectOption                 from 'components/MultiSelect/MultiSelectOption.react';
import pluck                             from 'lib/pluck';
import Range                             from 'components/Range/Range.react';
import React                             from 'react';
import renderFlowFooterChanges           from 'lib/renderFlowFooterChanges';
import setDifference                     from 'lib/setDifference';
import styles                            from 'dashboard/Settings/Settings.scss';
import TextInput                         from 'components/TextInput/TextInput.react';
import TextInputSettings                 from 'components/TextInputSettings/TextInputSettings.react';
import NumericInput                      from 'components/NumericInput/NumericInput.react';
import NumericInputSettings              from 'components/NumericInputSettings/NumericInputSettings.react';
import Toolbar                           from 'components/Toolbar/Toolbar.react';
import unique                            from 'lib/unique';
import validateAndSubmitConnectionString from 'lib/validateAndSubmitConnectionString';
import { cost, features }                from 'dashboard/Settings/GeneralSettings.scss';
import Toggle                            from 'components/Toggle/Toggle.react';
import { ManageAppFields }               from 'dashboard/Settings/Fields/ManageAppFields.react';
import { CollaboratorsFields }           from 'dashboard/Settings/Fields/CollaboratorsFields.react';
import { AppInformationFields }          from 'dashboard/Settings/Fields/AppInformationFields.react';
import { DangerzoneFields }              from 'dashboard/Settings/Fields/DangerzoneFields.react';
import {
  CurrentPlan, CurrentPlanFields
}                                        from 'dashboard/Settings/Fields/AppInformationFields.react';
import {
  defaultParseOptions
}                                        from 'dashboard/Settings/Fields/Constants';

export default class GeneralSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'General';

    this.state = {
      cleanupSystemLogMessage: '',
      cleanupFilesMessage: '',
      cleanupNoteColor: '',

      exportDataMessage: '',
      exportDataColor: '',

      password: '',

      showTransferAppModal: false,
      transferNewOwner: '',
      transferAppSuccessMessage: '',

      showDeleteAppModal: false,

      showCloneAppModal: false,
      cloneAppMessage: '',
      cloneAppName:'',
      cloneOptionsSelection: ['schema', 'app_settings', 'config', 'cloud_code'],

      showMigrateAppModal: false,
      migrationMongoURL: '',
      migrationWarnings: [],
      //TODO: modify FormModal to clear errors when it's content changes, then this hack will be unnecessary.
      showMongoConnectionValidationErrors: true,

      showChangeConnectionStringModal: false,
      newConnectionString: '',

      removedCollaborators: [],
      showPurgeFilesModal: false,
      showPurgeSystemLogModal: false
    };
  }

  renderContent() {
    if (!this.props.initialFields) {
      return <Toolbar section='Settings' subsection='General' />
    }
    let passwordField = (
      <Field
        labelWidth={60}
        label={<Label
          text='Your password'
          description={'We want to make sure it\u2019s really you.'} />
        }
        input={<TextInput
          hidden={true}
          value={this.state.password}
          placeholder='Password'
          onChange={(newValue) => {
            this.setState({password: newValue});
          }} />} />
    )

    let closeModalWithConnectionString = () => this.setState({
      showChangeConnectionStringModal: false,
      showMigrateAppModal: false,
      showMongoConnectionValidationErrors: false,
      migrationWarnings: [],
    });

    let migrateAppModal = <FormModal
      title='Migrate app'
      subtitle='Begin migrating data to your own database.'
      icon='gear-solid'
      iconSize={30}
      type={Modal.Types.DANGER}
      open={this.state.showMigrateAppModal}
      submitText={this.state.migrationWarnings && this.state.migrationWarnings.length > 0 ? 'Migrate anyway' : 'Begin the migration'}
      inProgressText={'Beginning the migration\u2026'}
      showErrors={this.state.showMongoConnectionValidationErrors}
      width={900}
      onSubmit={() => {
        let promise = validateAndSubmitConnectionString(
          this.state.migrationMongoURL,
          this.state.migrationWarnings,
          warnings => this.setState({migrationWarnings: warnings}),
          connectionString => this.context.currentApp.beginMigration(connectionString)
        );
        promise.catch(({ error }) => this.setState({showMongoConnectionValidationErrors: error !== 'Warnings'}));
        return promise;
      }}
      onClose={closeModalWithConnectionString}
      onSuccess={() => history.push(`/apps/${this.context.currentApp.slug}/migration`)}
      clearFields={() => this.setState({
        migrationMongoURL: '',
        migrationWarnings: [],
      })}>
      <Field
        labelWidth={40}
        label={<Label
          text='Your database connection string.'
          description={<span>This database must be prepared to handle all of your app's queries and data. Read <a href={getSiteDomain() + '/docs/server/guide#migrating'}>our migration guide</a> to learn how to create a database.</span>} />
        }
        input={<TextInput
          height={100}
          placeholder='mongodb://...'
          value={this.state.migrationMongoURL}
          onChange={value => this.setState({
            migrationMongoURL: value,
            migrationWarnings: [],
            showMongoConnectionValidationErrors: false,
          })} />} />
      {this.state.migrationWarnings.map(warning => <FormNote key={warning} show={true} color='orange'>{warning}</FormNote>)}
    </FormModal>;

    let changeConnectionStringModal = <FormModal
      title='Change Connection String'
      subtitle={'Immediately switch your connection string for your app\'s database.'}
      open={this.state.showChangeConnectionStringModal}
      onSubmit={() => {
        let promise = validateAndSubmitConnectionString(
          this.state.newConnectionString,
          this.state.migrationWarnings,
          warnings => this.setState({migrationWarnings: warnings}),
          connectionString => this.context.currentApp.changeConnectionString(connectionString)
        );
        promise.catch(({ error }) => this.setState({showMongoConnectionValidationErrors: error !== 'Warnings'}));
        return promise;
      }}
      onClose={closeModalWithConnectionString}
      type={Modal.Types.DANGER}
      submitText={this.state.migrationWarnings && this.state.migrationWarnings.length > 0 ? 'Change anyway' : 'Change connection string'}
      inProgressText={'Changing\u2026'}
      showErrors={this.state.showMongoConnectionValidationErrors}
      width={900}
      clearFields={() => this.setState({
        migrationMongoURL: '',
        migrationWarnings: [],
      })}>
      <Field
        labelWidth={40}
        label={<Label
          text='Your database connection string'
          description='Specify a valid mongo connection string.' />}
        input={<TextInput
          placeholder='mongodb://...'
          value={this.state.newConnectionString}
          onChange={value => this.setState({
            newConnectionString: value,
            migrationWarnings: [],
            showMongoConnectionValidationErrors: false,
          })} />} />
      {this.state.migrationWarnings.map(warning => <FormNote key={warning}show={true} color='orange'>{warning}</FormNote>)}
    </FormModal>

    let deleteAppModal = <FormModal
      title='Delete App'
      icon='trash-solid'
      iconSize={30}
      subtitle='This is an irreversible action!'
      type={Modal.Types.DANGER}
      open={this.state.showDeleteAppModal}
      submitText='Permanently delete this app'
      inProgressText={'Deleting\u2026'}
      enabled={this.state.password.length > 0}
      onSubmit={() => AppsManager.deleteApp(this.context.currentApp.slug, this.state.password)}
      onSuccess={() => history.push('/apps')}
      onClose={() => this.setState({showDeleteAppModal: false})}
      clearFields={() => this.setState({password: ''})}>
      {passwordField}
    </FormModal>

    let cloneAppModal = <FormModal
      title='Clone App'
      icon='files-outline'
      iconSize={30}
      subtitle='Create a copy of this app'
      submitText='Clone'
      inProgressText={'Cloning\u2026'}
      open={this.state.showCloneAppModal}
      enabled={this.state.cloneAppName.length > 0}
      onSubmit={() => {
        this.setState({
          cloneAppMessage: '',
        });
        return AppsManager.cloneApp(this.context.currentApp.slug, this.state.cloneAppName, this.state.cloneOptionsSelection)
      }}
      onSuccess={({notice}) => this.setState({cloneAppMessage: notice})}
      onClose={() => this.setState({showCloneAppModal: false})}
      clearFields={() => this.setState({
        cloneAppName: '',
        cloneOptionsSelection: ['schema', 'app_settings', 'config', 'cloud_code'],
      })}>
      <Field
        labelWidth={50}
        label={<Label text='Name your cloned app' />}
        input={<TextInput
          value={this.state.cloneAppName}
          onChange={value => this.setState({cloneAppName: value})
        } /> } />
      <Field
        labelWidth={35}
        label={<Label text='What should we include in the clone?' />}
        input={<MultiSelect
          fixed={true}
          value={this.state.cloneOptionsSelection}
          onChange={options => this.setState({cloneOptionsSelection: options})}
        >
          <MultiSelectOption value='schema'>Schema</MultiSelectOption>
          <MultiSelectOption value='app_settings'>App Settings</MultiSelectOption>
          <MultiSelectOption value='config'>Config</MultiSelectOption>
          <MultiSelectOption value='cloud_code'>Cloud Code</MultiSelectOption>
          <MultiSelectOption value='background_jobs'>Background Jobs</MultiSelectOption>
        </MultiSelect>} />
    </FormModal>;

    let iosUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'ios');
    let anrdoidUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'android');
    let windowsUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'win');
    let webUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'web');
    let otherURL = this.props.initialFields.urls.find(({ platform }) => platform === 'other');

    let initialFields = {
      requestLimit: this.props.initialFields.pricing_plan.request_limit,
      appName: this.context.currentApp.name,
      inProduction: this.context.currentApp.production,
      iTunesURL: iosUrl ? iosUrl.url : '',
      googlePlayURL: anrdoidUrl ? anrdoidUrl.url : '',
      windowsAppStoreURL: windowsUrl ? windowsUrl.url : '',
      webAppURL: webUrl ? webUrl.url : '',
      otherURL: otherURL ? otherURL.url : '',
      collaborators: this.props.initialFields.collaborators,
      waiting_collaborators: this.props.initialFields.waiting_collaborators,
      mongoURL: this.context.currentApp.settings.fields.fields.opendb_connection_string,
      parseOptions: this.context.currentApp.parseOptions,
      appSettings: this.context.currentApp.settings.fields.fields.app,
    };

    let collaboratorRemovedWarningModal = this.state.removedCollaborators.length > 0 ? <Modal
      title='Check Master Key Access'
      icon='keys-solid'
      type={Modal.Types.DANGER}
      showCancel={false}
      confirmText='Got it!'
      onConfirm={() => this.setState({removedCollaborators: []})}
      buttonsInCenter={true}
      textModal={true}>
      <span>We have removed <strong>{joinWithFinal('', this.state.removedCollaborators.map(c => c.userName || c.userEmail), ', ', ' and ')}</strong> from this app. If they had saved the master key, they may still have access via an SDK or the API. To be sure, you can reset your master key in the Keys section of app settings.</span>
    </Modal> : null;
    let setCollaborators = (setField, _, allCollabs) => {
      let addedCollaborators = setDifference(allCollabs, initialFields.collaborators, compareCollaborators);
      let removedCollaborators = setDifference(initialFields.collaborators, allCollabs, compareCollaborators);
      if (addedCollaborators.length === 0 && removedCollaborators.length === 0) {
        //If there isn't a added or removed collaborator verify if there is a edited one.
        let editedCollaborators = verifyEditedCollaborators(allCollabs);
        if (editedCollaborators.length === 0) {
          //This is neccessary because the footer computes whether or not show a change by reference equality.
          allCollabs = initialFields.collaborators;
        }
      }
      setField('collaborators', allCollabs);
    };

    return <div>
      <FlowView
        initialFields={initialFields}
        footerContents={({changes}) => renderFlowFooterChanges(changes, initialFields, generalFieldsOptions)}
        onSubmit={({ changes }) => {
          let promiseList = [];
          if (changes.requestLimit !== undefined) {
            promiseList.push(this.context.currentApp.setRequestLimit(changes.requestLimit));
          }
          if (changes.appName !== undefined || changes.parseOptions !== undefined ) {
            const parseOptions = {...typeof changes.parseOptions == 'string' ? JSON.parse(changes.parseOptions) : {} };
            promiseList.push(this.context.currentApp.setAppConfig(changes.appName,
              { accountLockout: {...defaultParseOptions.accountLockout, ...parseOptions.accountLockout}, passwordPolicy: { ...defaultParseOptions.passwordPolicy, ...parseOptions.passwordPolicy }}
            ));
          }
          if (changes.inProduction !== undefined) {
            promiseList.push(this.context.currentApp.setInProduction(changes.inProduction));
          }
          let removedCollaborators;
          if (changes.collaborators !== undefined) {
            let addedCollaborators = setDifference(changes.collaborators, initialFields.collaborators, compareCollaborators);
            addedCollaborators.forEach(({ userEmail, featuresPermission, classesPermission }) => {
              promiseList.push(this.context.currentApp.addCollaborator(userEmail, featuresPermission, classesPermission));
            });

            removedCollaborators = setDifference(initialFields.collaborators, changes.collaborators, compareCollaborators);
            removedCollaborators.forEach(({ id }) => {
              promiseList.push(this.context.currentApp.removeCollaboratorById(id));
            });

            let editedCollaborators = verifyEditedCollaborators(changes.collaborators);
            editedCollaborators.forEach(({ id, featuresPermission, classesPermission }) => {
              promiseList.push(this.context.currentApp.editCollaboratorById(id, featuresPermission, classesPermission));
            });
          }

          let urlKeys = {
            iTunesURL: 'ios',
            googlePlayURL: 'android',
            windowsAppStoreURL: 'win',
            webAppURL: 'web',
            otherURL: 'other',
          }

          Object.keys(urlKeys).forEach(key => {
            if (changes[key] !== undefined) {
              promiseList.push(this.context.currentApp.setAppStoreURL(urlKeys[key], changes[key]));
            }
          });
          return Promise.all(promiseList).then(() => {
            this.forceUpdate(); //Need to forceUpdate to see changes applied to source ParseApp
            this.setState({ removedCollaborators: removedCollaborators || [] });
          }).catch(errors => {
            return Promise.reject({ error: unique(pluck(errors, 'error')).join(' ')});
          });
        }}
        renderForm={({ fields, setField }) => {
          //let isCollaborator = AccountManager.currentUser().email !== this.props.initialFields.owner_email;
          return <div className={styles.settings_page}>
            <AppInformationFields
              appName={fields.appName}
              setAppName={setField.bind(this, 'appName')}
              inProduction={fields.inProduction}
              setInProduction={setField.bind(this, 'inProduction')}
              iTunesURL={fields.iTunesURL}
              setiTunesURL={setField.bind(this, 'iTunesURL')}
              googlePlayURL={fields.googlePlayURL}
              setGooglePlayURL={setField.bind(this, 'googlePlayURL')}
              windowsAppStoreURL={fields.windowsAppStoreURL}
              setWindowsAppStoreURL={setField.bind(this, 'windowsAppStoreURL')}
              webAppURL={fields.webAppURL}
              setWebAppURL={setField.bind(this, 'webAppURL')}
              otherURL={fields.otherURL}
              setOtherURL={setField.bind(this, 'otherURL')} />
            <CollaboratorsFields
              collaborators={fields.collaborators}
              waiting_collaborators={fields.waiting_collaborators}
              ownerEmail={this.props.initialFields.owner_email}
              viewerEmail={AccountManager.currentUser().email}
              addCollaborator={setCollaborators.bind(undefined, setField)}
              removeCollaborator={setCollaborators.bind(undefined, setField)}
              editCollaborator={setCollaborators.bind(undefined, setField)}/>
            <ManageAppFields
              mongoURL={fields.mongoURL}
              isCollaborator={AccountManager.currentUser().email !== this.props.initialFields.owner_email}
              hasCollaborators={fields.collaborators.length > 0}
              appSlug={this.context.currentApp.slug}
              parseOptions={fields.parseOptions}
              setParseOptions={setField.bind(this, 'parseOptions')}
              appSettings={fields.appSettings}
              cleanUpFiles={() => this.setState({showPurgeFilesModal: true})}
              cleanUpFilesMessage={this.state.cleanupFilesMessage}
              cleanUpMessageColor={this.state.cleanupNoteColor}
              cleanUpSystemLog={() => this.setState({showPurgeSystemLogModal: true})}
              cleanUpSystemLogMessage={this.state.cleanupSystemLogMessage} />
            <DangerzoneFields
              mongoURL={fields.mongoURL}
              isCollaborator={AccountManager.currentUser().email !== this.props.initialFields.owner_email}
              hasCollaborators={fields.collaborators.length > 0}
              appSlug={this.context.currentApp.slug}
              parseOptions={fields.parseOptions}
              setParseOptions={setField.bind(this, 'parseOptions')}
              appSettings={fields.appSettings}
              cleanUpFiles={() => this.setState({showPurgeFilesModal: true})}
              cleanUpFilesMessage={this.state.cleanupFilesMessage}
              cleanUpMessageColor={this.state.cleanupNoteColor}
              cleanUpSystemLog={() => this.setState({showPurgeSystemLogModal: true})}
              cleanUpSystemLogMessage={this.state.cleanupSystemLogMessage} />
            {this.state.showPurgeFilesModal ? <Modal
              type={Modal.Types.INFO}
              icon='down-outline'
              iconSize={40}
              title='Clean Orphan Files'
              subtitle={'The files without DB references will be removed!'}
              confirmText='Purge Files'
              cancelText='Cancel'
              buttonsInCenter={true}
              onCancel={() => this.setState({showPurgeFilesModal: false})}
              onConfirm={() => this.context.currentApp.cleanUpFiles().then(result => {
                this.setState({
                  cleanupFilesMessage: 'All set! You\'ll receive an email when the process is over.',
                  cleanupNoteColor: 'orange',
                  showPurgeFilesModal: false,
                });
              }).catch((e) => {
                this.setState({
                  cleanupFilesMessage: e.error,
                  cleanupNoteColor: 'red',
                  showPurgeFilesModal: false,
                });
              })} /> : null }
              {this.state.showPurgeSystemLogModal ? <Modal
                type={Modal.Types.INFO}
                icon='down-outline'
                iconSize={40}
                title='Clean System Log'
                subtitle={'The System log will be removed!'}
                confirmText='Purge System Log'
                cancelText='Cancel'
                buttonsInCenter={true}
                onCancel={() => this.setState({showPurgeSystemLogModal: false})}
                onConfirm={() => this.context.currentApp.cleanUpSystemLog().then(result => {
                  this.setState({
                    cleanupSystemLogMessage: 'Your System log was deleted.',
                    cleanupNoteColor: 'orange',
                    showPurgeSystemLogModal: false,
                  });
                }).fail((e) => {
                  this.setState({
                    cleanupSystemLogMessage: e.error,
                    cleanupNoteColor: 'red',
                    showPurgeSystemLogModal: false,
                  });
                })} /> : null }
          </div>;
        }} />
      <Toolbar section='Settings' subsection='General' />
    </div>;
  }
}

let compareCollaborators = (collab1, collab2) => (collab1.userEmail === collab2.userEmail);
let verifyEditedCollaborators = (modified) => {
  let editedCollabs = []
  modified.forEach((modifiedCollab) => {
    if (modifiedCollab.isEdited) editedCollabs.push(modifiedCollab);
  })
  return editedCollabs;
}

let generalFieldsOptions = {
  requestLimit: {
    friendlyName: 'request limit',
    showTo: true,
    showFrom: true,
  },
  appName: {
    friendlyName: 'app name',
    showTo: true,
  },
  parseOptions: {
    friendlyName: 'Parse Options',
    showTo: false,
    type: 'parseOptions'
  },
  //TODO: This will display 'enabled production' or 'disabled production' which is sub-optimal. Try to make it better.
  inProduction: {
    friendlyName: 'production',
    type: 'boolean',
  },
  collaborators: {
    friendlyName: 'collaborator',
    friendlyNamePlural: 'collaborators',
    type: 'set',
    equalityPredicate: compareCollaborators,
  },
  iTunesURL: {
    friendlyName: 'iTunes URL',
  },
  googlePlayURL: {
    friendlyName: 'Play Store URL',
  },
  windowsAppStoreURL: {
    friendlyName: 'Windows App Store URL',
  },
  webAppURL: {
    friendlyName: 'web URL',
  },
  otherURL: {
    friendlyName: 'other URL',
  },
};
