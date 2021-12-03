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
import { RestartAppModal }               from 'dashboard/Settings/Modals/restartAppModal.react';
import { PurgeFilesModal }               from 'dashboard/Settings/Modals/purgeFilesModal.react';
import { PurgeSystemLogModal }           from 'dashboard/Settings/Modals/purgeSystemLogModal.react';
import { TransferAppModal }              from 'dashboard/Settings/Modals/transferAppModal.react';
import { CloneAppModal }                 from 'dashboard/Settings/Modals/cloneAppModal.react';
import { DeleteAppModal }                from 'dashboard/Settings/Modals/deleteAppModal.react';

import {
  generalFieldsOptions,
  compareCollaborators,
  verifyEditedCollaborators,
  getPromiseList,
  renderModal
}                                        from './Util';
import {
  CurrentPlan, CurrentPlanFields
}                                        from 'dashboard/Settings/Fields/AppInformationFields.react';

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
      showRestartAppModal: false,
      showPurgeSystemLogModal: false,
      showTransferAppModal: false,
    };
  }

  getInitialFields() {
    let iosUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'ios');
    let anrdoidUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'android');
    let windowsUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'win');
    let webUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'web');
    let otherURL = this.props.initialFields.urls.find(({ platform }) => platform === 'other');

    return {
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
      clientPush: this.context.currentApp.settings.fields.fields.clientPush,
      clientClassCreation: this.context.currentApp.settings.fields.fields.clientClassCreation
    };
  }

  setCollaborators (initialFields, setField, _, allCollabs) {
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
  }

  renderContent() {
    if (!this.props.initialFields) {
      return <Toolbar section='Settings' subsection='General' />
    }

    let initialFields = this.getInitialFields();

    return <div>
      <FlowView
        initialFields={initialFields}
        footerContents={({changes}) => renderFlowFooterChanges(changes, initialFields, generalFieldsOptions)}
        onSubmit={({ changes }) => {
          return getPromiseList({ changes, setDifference, initialFields })
        }}
        renderModals={[
          renderModal(this.state.showRestartAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, RestartAppModal),
          renderModal(this.state.showPurgeFilesModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, PurgeFilesModal),
          renderModal(this.state.showPurgeSystemLogModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, PurgeSystemLogModal),
          renderModal(this.state.showTransferAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, TransferAppModal),
          renderModal(this.state.showCloneAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, CloneAppModal),
          renderModal(this.state.showDeleteAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, DeleteAppModal)
        ]}
        renderForm={({ fields, setField }) => {
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
              addCollaborator={this.setCollaborators.bind(undefined, initialFields, setField)}
              removeCollaborator={this.setCollaborators.bind(undefined, initialFields, setField)}
              editCollaborator={this.setCollaborators.bind(undefined, initialFields, setField)}/>
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
              clientPush={fields.clientPush}
              setClientPush={setField.bind(this, 'clientPush')}
              clientClassCreation={fields.clientClassCreation}
              setClientClassCreation={setField.bind(this, 'clientClassCreation')}
              cleanUpFiles={() => this.setState({showPurgeFilesModal: true})}
              restartApp={() => this.setState({ showRestartAppModal: true })}
              transferApp={() => this.setState({ showTransferAppModal:true })}
              cloneApp={() => this.setState({ showCloneAppModal: true })}
              deleteApp={() => this.setState({ showDeleteAppModal: true })}
              cleanUpFilesMessage={this.state.cleanupFilesMessage}
              cleanUpMessageColor={this.state.cleanupNoteColor}
              cleanUpSystemLog={() => this.setState({showPurgeSystemLogModal: true})}
              cleanUpSystemLogMessage={this.state.cleanupSystemLogMessage} />
          </div>;
        }} />
      <Toolbar section='Settings' subsection='General' />
    </div>;
  }
}
