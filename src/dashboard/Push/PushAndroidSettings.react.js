import React from 'react';
import { withRouter } from 'lib/withRouter';
import Toolbar from 'components/Toolbar/Toolbar.react';
import DashboardView from 'dashboard/DashboardView.react';
import CategoryList from 'components/CategoryList/CategoryList.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import FlowView from 'components/FlowView/FlowView.react';
import Field from 'components/Field/Field.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import Label from 'components/Label/Label.react';
import Button from 'components/Button/Button.react';
import FileInput from 'components/FileInput/FileInput.react';
import Icon from 'components/Icon/Icon.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import styles from './PushAndroidSettings.scss';

const getLoadErrorMessage = (err, fallbackMessage) => {
  if (typeof err === 'string' && err.trim()) {
    return err;
  }
  const responseData = err?.response?.data;
  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error;
  }
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }
  return fallbackMessage;
};

@withRouter
class PushAndroidSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'Notifications';
    this.subsection = 'Setup';
    this.state = {
      isLoading: true,
      loadingError: null,
      pushType: null,
      projectId: null,
      senderId: null,
      apiKey: null,
      appName: null,
      hasPermission: true,
      selectedFile: null,
      fileError: null,
      isDeleting: false,
      showDeleteModal: false,
      deleteError: null,
    };
    this.flowSetField = null;
    this.flowViewRef = React.createRef();
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadConfig();
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearTimeout(this._deleteErrorTimer);
  }

  async loadConfig() {
    try {
      const data = await this.context.getPushAndroidConfig();
      const hasPermission = !data.featuresPermission ||
        data.featuresPermission.pushAndroidSettings === 'Write';

      let pushType = null;
      let projectId = null;
      let senderId = null;
      let apiKey = null;

      if (data.fcm) {
        pushType = 'fcm';
        projectId = data.fcm.project_id;
      } else if (data.gcm) {
        pushType = 'gcm';
        senderId = data.gcm.senderId;
        apiKey = data.gcm.apiKey;
      }

      this.setState({
        isLoading: false,
        loadingError: null,
        pushType,
        projectId,
        senderId,
        apiKey,
        appName: data.appName,
        hasPermission,
      });
    } catch (err) {
      this.setState({
        isLoading: false,
        loadingError: getLoadErrorMessage(err, 'Failed to load Android push settings.'),
      });
    }
  }

  handleFileSelect(file) {
    if (!file) {
      return;
    }

    if (!file.name.endsWith('.json')) {
      this.setState({ selectedFile: null, fileError: 'Only .json files are accepted.' });
      if (this.flowSetField) {
        this.flowSetField('selectedFileName', '');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!this._isMounted) {
        return;
      }
      try {
        const json = JSON.parse(event.target.result);
        const requiredFields = ['project_id', 'private_key', 'client_email'];
        const missing = requiredFields.filter(f => !(f in json));
        if (missing.length > 0) {
          this.setState({
            selectedFile: null,
            fileError: `JSON is missing required fields: ${missing.join(', ')}`,
          });
          if (this.flowSetField) {
            this.flowSetField('selectedFileName', '');
          }
          return;
        }
        this.setState({ selectedFile: file, fileError: null, deleteError: null });
        if (this.flowSetField) {
          this.flowSetField('selectedFileName', file.name);
        }
      } catch {
        this.setState({ selectedFile: null, fileError: 'File is not valid JSON.', deleteError: null });
        if (this.flowSetField) {
          this.flowSetField('selectedFileName', '');
        }
      }
    };
    reader.readAsText(file);
  }

  async handleDeleteConfig() {
    clearTimeout(this._deleteErrorTimer);
    this.setState({ isDeleting: true, deleteError: null });
    try {
      await this.context.deletePushAndroidConfig();
      this.setState({ isDeleting: false, showDeleteModal: false, isLoading: true });
      this.loadConfig();
    } catch (err) {
      const msg = typeof err === 'string' ? err
        : (err && err.error) || (err && err.message) || 'Failed to delete push configuration.';
      this.setState({ isDeleting: false, showDeleteModal: false, deleteError: msg });
      this._deleteErrorTimer = setTimeout(() => {
        if (this._isMounted) {
          this.setState({ deleteError: null });
        }
      }, 5000);
    }
  }

  renderDeleteButton() {
    const { hasPermission } = this.state;
    if (!hasPermission) {
      return null;
    }
    return (
      <button
        className={styles.deleteButton}
        onClick={() => this.setState({ showDeleteModal: true, deleteError: null })}
        aria-label="Delete Android push configuration"
        title="Delete configuration"
      >
        <Icon name="b4a-delete-icon" fill="#E85C3E" width={16} height={16} />
      </button>
    );
  }

  renderDeleteModal() {
    if (!this.state.showDeleteModal) {
      return null;
    }
    return (
      <B4aModal
        type={B4aModal.Types.DANGER}
        title="Delete Android push configuration?"
        subtitle="This action cannot be undone!"
        confirmText="Yes, delete"
        cancelText="Cancel"
        buttonsInCenter={true}
        onCancel={() => this.setState({ showDeleteModal: false })}
        onConfirm={this.handleDeleteConfig.bind(this)}
        progress={this.state.isDeleting}
        disabled={this.state.isDeleting}
      />
    );
  }

  renderCurrentConfig() {
    const { pushType, projectId, senderId, apiKey, deleteError } = this.state;

    if (pushType === 'fcm') {
      return (
        <Fieldset
          legend="Current Configuration"
          description="Your app is configured with Firebase Cloud Messaging (FCM)."
        >
          <Field
            label={<Label text="FCM Project ID" description="Firebase project identifier" dark={true} />}
            input={
              <div className={styles.configValueRow}>
                <div className={styles.configValue}>{projectId}</div>
                {this.renderDeleteButton()}
              </div>
            }
            theme={Field.Theme.BLUE}
          />
          {deleteError && (
            <div className={styles.deleteError}>{deleteError}</div>
          )}
        </Fieldset>
      );
    }

    if (pushType === 'gcm') {
      return (
        <Fieldset
          legend="Current Configuration"
          description="Your app is configured with Google Cloud Messaging (GCM). Consider upgrading to FCM."
        >
          <Field
            label={<Label text="GCM Sender ID" description="Google Cloud Messaging sender identifier" dark={true} />}
            input={
              <div className={styles.configValueRow}>
                <div className={styles.configValue}>{senderId || 'N/A'}</div>
                {this.renderDeleteButton()}
              </div>
            }
            theme={Field.Theme.BLUE}
          />
          <Field
            label={<Label text="API Key" description="Google Cloud Messaging API key" dark={true} />}
            input={<div className={styles.configValue}>{apiKey || 'N/A'}</div>}
            theme={Field.Theme.BLUE}
          />
        </Fieldset>
      );
    }

    return null;
  }

  renderForm({ fields, setField }) {
    this.flowSetField = setField;
    const { hasPermission, pushType, fileError } = this.state;
    const noConfig = !pushType;

    return (
      <div className={styles.settingsWrapper}>
        <div className={styles.formWrapper}>
          <div className={styles.settingsContainer}>
            <div className={styles.heading}>Android Push Settings</div>
            <div className={styles.subheading}>
              Manage Push Notification settings for your Android application.
              Upload a Firebase Cloud Messaging Service Account JSON to enable push notifications.
            </div>

            {noConfig && (
              <>
                <div className={styles.noConfigMessage}>
                  No push notification configuration found for this application.
                </div>
                <hr className={styles.fieldHr} />
              </>
            )}

            {!noConfig && (
              <>
                {this.renderCurrentConfig()}
                <hr className={styles.fieldHr} />
              </>
            )}

            <div style={!hasPermission ? { pointerEvents: 'none', opacity: 0.6 } : {}}>
              <Fieldset
                legend={pushType ? 'Update Configuration' : 'Set Up Push'}
                description="Upload your Firebase Cloud Messaging Service Account JSON file."
              >
                <Field
                  label={
                    <Label
                      text="Select a JSON file with your Service Account credentials"
                      dark={true}
                    />
                  }
                  input={
                    <div className={styles.fileInputWrapper}>
                      <FileInput
                        value={this.state.selectedFile ? { name: this.state.selectedFile.name } : undefined}
                        onChange={this.handleFileSelect.bind(this)}
                        accept=".json"
                      />
                      {this.state.selectedFile && (
                        <div className={styles.selectedFileName}>
                          {this.state.selectedFile.name}
                        </div>
                      )}
                    </div>
                  }
                  theme={Field.Theme.BLUE}
                />
                {fileError && (
                  <div className={styles.fileError}>
                    {fileError}
                  </div>
                )}
              </Fieldset>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderSidebar() {
    const { pathname } = this.props.location;
    const current = pathname.substr(pathname.lastIndexOf('/') + 1, pathname.length - 1);
    return (
      <CategoryList
        current={current}
        linkPrefix={'push/'}
        categories={[
          { name: 'Android', id: 'android-settings' },
          { name: 'Apple', id: 'ios-settings' },
        ]}
      />
    );
  }

  renderContent() {
    const toolbar = <Toolbar section="Notifications" subsection="Android Push" />;
    const { isLoading, loadingError, hasPermission, selectedFile } = this.state;

    let content = null;

    if (loadingError) {
      content = (
        <div style={{ paddingTop: '3rem' }}>
          <EmptyGhostState
            title="Error loading Android push settings"
            description={loadingError}
            cta="Retry"
            action={() => {
              this.setState({ isLoading: true, loadingError: null });
              this.loadConfig();
            }}
          />
        </div>
      );
    } else if (!isLoading) {
      const initialFields = {
        selectedFileName: '',
      };

      content = (
        <div className={styles.mainContent}>
          <FlowView
            ref={this.flowViewRef}
            initialFields={initialFields}
            submitText="Save"
            inProgressText="Saving..."
            showFooter={() => {
              if (!hasPermission) {
                return true;
              }
              return !!selectedFile;
            }}
            validate={() => {
              if (!hasPermission) {
                return 'use default';
              }
              return '';
            }}
            defaultFooterMessage={
              <span>You don&apos;t have permission to edit push settings.</span>
            }
            hideButtonsOnDefaultMessage={true}
            secondaryButton={() => (
              <Button
                onClick={() => {
                  this.setState({ selectedFile: null, fileError: null });
                  if (this.flowViewRef.current) {
                    this.flowViewRef.current.resetFields();
                  }
                }}
                color="white"
                dark={true}
                value="Cancel"
              />
            )}
            onSubmit={() => {
              return this.context.updatePushAndroidConfig(selectedFile).catch(err => {
                const msg = typeof err === 'string' ? err
                  : (err && err.error) || (err && err.message) || 'Failed to save push settings.';
                return Promise.reject({ error: msg });
              });
            }}
            afterSave={({ resetFields }) => {
              amplitudeLogEvent('Configured Android Push');
              resetFields();
              this.setState({ selectedFile: null, fileError: null });
              this.loadConfig();
            }}
            footerContents={() => {
              if (!selectedFile) {
                return null;
              }
              return (
                <span>
                  Upload <strong>{selectedFile.name}</strong> as the new Firebase Service Account.
                </span>
              );
            }}
            renderForm={this.renderForm.bind(this)}
          />
        </div>
      );
    }

    return (
      <div>
        <B4aLoaderContainer loading={isLoading}>
          <div className={styles.content}>{content}</div>
        </B4aLoaderContainer>
        {toolbar}
        {this.renderDeleteModal()}
      </div>
    );
  }
}

export default PushAndroidSettings;
