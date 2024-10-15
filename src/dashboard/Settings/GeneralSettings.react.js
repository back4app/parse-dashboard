/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager from 'lib/AccountManager';
import DashboardView from 'dashboard/DashboardView.react';
import FlowView from 'components/FlowView/FlowView.react';
import React from 'react';
import renderFlowFooterChanges from 'lib/renderFlowFooterChanges';
import setDifference from 'lib/setDifference';
import styles from 'dashboard/Settings/Settings.scss';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { ManageAppFields } from 'dashboard/Settings/Fields/ManageAppFields.react';
import { CollaboratorsFields } from 'dashboard/Settings/Fields/CollaboratorsFields.react';
import { AppInformationFields } from 'dashboard/Settings/Fields/AppInformationFields.react';
import { DangerzoneFields } from 'dashboard/Settings/Fields/DangerzoneFields.react';
import { RestartAppModal } from 'dashboard/Settings/Modals/restartAppModal.react';
import { PurgeFilesModal } from 'dashboard/Settings/Modals/purgeFilesModal.react';
import { PurgeSystemLogModal } from 'dashboard/Settings/Modals/purgeSystemLogModal.react';
import { TransferAppModal } from 'dashboard/Settings/Modals/transferAppModal.react';
import { CloneAppModal } from 'dashboard/Settings/Modals/cloneAppModal.react';
import { DeleteAppModal } from 'dashboard/Settings/Modals/deleteAppModal.react';
import { generalFieldsOptions, compareCollaborators, verifyEditedCollaborators, getPromiseList, renderModal } from './Util';
import GeneralSettingsValidataions from 'dashboard/Settings/GeneralSettingsValidataions';
import { withRouter } from 'lib/withRouter';

@withRouter
export default class GeneralSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'General';

    this.state = {
      cleanupSystemLogMessage: '',
      cleanupFilesMessage: '',
      cleanupNoteColor: '',

      // show modals.
      showDeleteAppModal: false,
      showCloneAppModal: false,
      showPurgeFilesModal: false,
      showRestartAppModal: false,
      showPurgeSystemLogModal: false,
      showTransferAppModal: false,
    };
  }

  getInitialFields() {
    const iosUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'ios');
    const anrdoidUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'android');
    const windowsUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'win');
    const webUrl = this.props.initialFields.urls.find(({ platform }) => platform === 'web');
    const otherURL = this.props.initialFields.urls.find(({ platform }) => platform === 'other');

    return {
      requestLimit: this.props.initialFields.pricing_plan.request_limit,
      appName: this.context.name,
      inProduction: this.context.production,
      iTunesURL: iosUrl ? iosUrl.url : '',
      googlePlayURL: anrdoidUrl ? anrdoidUrl.url : '',
      windowsAppStoreURL: windowsUrl ? windowsUrl.url : '',
      webAppURL: webUrl ? webUrl.url : '',
      otherURL: otherURL ? otherURL.url : '',
      collaborators: this.props.initialFields.collaborators,
      waiting_collaborators: this.props.initialFields.waiting_collaborators,
      mongoURL: this.context.settings.fields.fields.opendb_connection_string,
      parseOptions: this.context.settings.fields.fields.parseOptions,
      dashboardAPI: this.context.settings.fields.fields.dashboardAPI,
      databaseURL: this.context.settings.fields.fields.databaseURL,
      parseVersion: this.context.settings.fields.fields.parseVersion,
      mongoVersion: this.context.settings.fields.fields.mongoVersion,
      databaseVersion: this.context.settings.fields.fields.databaseVersion,
      permissions: this.context.settings.fields.fields.permissions,
      clientPush: this.context.settings.fields.fields.clientPush,
      clientClassCreation: this.context.settings.fields.fields.clientClassCreation,
      useLatestDashboardVersion: this.context.useLatestDashboardVersion
    };
  }

  setCollaborators (initialFields, setField, _, allCollabs) {
    const addedCollaborators = setDifference(allCollabs, initialFields.collaborators, compareCollaborators);
    const removedCollaborators = setDifference(initialFields.collaborators, allCollabs, compareCollaborators);
    if (addedCollaborators.length === 0 && removedCollaborators.length === 0) {
      //If there isn't a added or removed collaborator verify if there is a edited one.
      const editedCollaborators = verifyEditedCollaborators(allCollabs);
      if (editedCollaborators.length === 0) {
        //This is neccessary because the footer computes whether or not show a change by reference equality.
        allCollabs = initialFields.collaborators;
      }
    }
    setField('collaborators', allCollabs);
  }

  promiseCallback({ removedCollaborators }) {
    this.forceUpdate(); //Need to forceUpdate to see changes applied to source ParseApp
    this.setState({ removedCollaborators: removedCollaborators || [] });
  }

  renderContent() {
    if (!this.props.initialFields) {
      return <Toolbar section='Settings' subsection='General' />
    }

    const initialFields = this.getInitialFields();

    return <div>
      <FlowView
        initialFields={initialFields}
        validate={(changes) => GeneralSettingsValidataions.validate(changes)}
        onSubmit={async ({ changes }) => {
          return getPromiseList({ changes, setDifference, initialFields, app: this.context, promiseCallback: this.promiseCallback.bind(this) })
        }}
        footerContents={({changes}) => renderFlowFooterChanges(changes, initialFields, generalFieldsOptions)}
        renderModals={[
          renderModal(this.state.showRestartAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, RestartAppModal),
          renderModal(this.state.showPurgeFilesModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, PurgeFilesModal),
          renderModal(this.state.showPurgeSystemLogModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, PurgeSystemLogModal),
          renderModal(this.state.showTransferAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, TransferAppModal),
          renderModal(this.state.showCloneAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, CloneAppModal),
          renderModal(this.state.showDeleteAppModal, { context: this.context, setParentState: (props) => this.setState({ ...this.state, ...props }) }, DeleteAppModal)
        ]}
        renderForm={({ fields, setField, setFieldJson, errors }) => {
          return <div className={styles.settings_page}>
            <AppInformationFields
              errors={errors}
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
              errors={errors}
              permissions={fields.permissions}
              collaborators={fields.collaborators}
              waiting_collaborators={fields.waiting_collaborators}
              ownerEmail={this.props.initialFields.owner_email}
              viewerEmail={AccountManager.currentUser().email}
              addCollaborator={this.setCollaborators.bind(undefined, initialFields, setField)}
              removeCollaborator={this.setCollaborators.bind(undefined, initialFields, setField)}
              editCollaborator={this.setCollaborators.bind(undefined, initialFields, setField)}/>
            <ManageAppFields
              errors={errors}
              mongoURL={fields.mongoURL}
              isCollaborator={AccountManager.currentUser().email !== this.props.initialFields.owner_email}
              hasCollaborators={fields.collaborators.length > 0}
              appSlug={this.context.slug}
              parseOptions={fields.parseOptions}
              setParseOptions={setFieldJson.bind(this, 'parseOptions')}
              dashboardAPI={fields.dashboardAPI}
              databaseURL={fields.databaseURL}
              parseVersion={fields.parseVersion}
              mongoVersion={fields.mongoVersion}
              databaseVersion={fields.databaseVersion}
              cleanUpFiles={() => this.setState({showPurgeFilesModal: true})}
              cleanUpFilesMessage={this.state.cleanupFilesMessage}
              cleanUpMessageColor={this.state.cleanupNoteColor}
              cleanUpSystemLog={() => this.setState({showPurgeSystemLogModal: true})}
              cleanUpSystemLogMessage={this.state.cleanupSystemLogMessage}
              isGDPR={this.context.custom && this.context.custom.isGDPR}
              permissions={fields.permissions}
              useLatestDashboardVersion={fields.useLatestDashboardVersion}
              setUseLatestDashboardVersion={setField.bind(this, 'useLatestDashboardVersion')}
              backendBetaUser={AccountManager.currentUser().backendBetaUser}/>
            <DangerzoneFields
              errors={errors}
              mongoURL={fields.mongoURL}
              isCollaborator={AccountManager.currentUser().email !== this.props.initialFields.owner_email}
              hasCollaborators={fields.collaborators.length > 0}
              appSlug={this.context.slug}
              parseOptions={fields.parseOptions}
              setParseOptions={setField.bind(this, 'parseOptions')}
              appSettings={fields.appSettings}
              clientPush={fields.clientPush}
              setClientPush={setField.bind(this, 'clientPush')}
              clientClassCreation={fields.clientClassCreation}
              databaseURL={fields.databaseURL}
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
