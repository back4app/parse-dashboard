import React from 'react';
import { withRouter } from 'lib/withRouter';
import Toolbar from 'components/Toolbar/Toolbar.react';
import DashboardView from 'dashboard/DashboardView.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import FlowView from 'components/FlowView/FlowView.react';
import Field from 'components/Field/Field.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import Label from 'components/Label/Label.react';
import Button from 'components/Button/Button.react';
import FileInput from 'components/FileInput/FileInput.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
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
    this.section = 'Notification';
    this.subsection = 'Android';
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
        this.setState({ selectedFile: file, fileError: null });
        if (this.flowSetField) {
          this.flowSetField('selectedFileName', file.name);
        }
      } catch {
        this.setState({ selectedFile: null, fileError: 'File is not valid JSON.' });
        if (this.flowSetField) {
          this.flowSetField('selectedFileName', '');
        }
      }
    };
    reader.readAsText(file);
  }

  renderCurrentConfig() {
    const { pushType, projectId, senderId, apiKey } = this.state;

    if (pushType === 'fcm') {
      return (
        <Fieldset
          legend="Current Configuration"
          description="Your app is configured with Firebase Cloud Messaging (FCM)."
        >
          <Field
            label={<Label text="FCM Project ID" description="Firebase project identifier" dark={true} />}
            input={<div className={styles.configValue}>{projectId}</div>}
            theme={Field.Theme.BLUE}
          />
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
            input={<div className={styles.configValue}>{senderId || 'N/A'}</div>}
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
                <EmptyGhostState
                  title="No Configuration Found"
                  description="No push settings configuration found for your application."
                />
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

  renderContent() {
    const toolbar = <Toolbar section="Notification" subsection="Android Push" />;
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
              this.setState({ selectedFile: null, fileError: null });
              setTimeout(() => {
                resetFields();
                this.setState({ isLoading: true });
                this.loadConfig();
              }, 1200);
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
      </div>
    );
  }
}

export default PushAndroidSettings;
