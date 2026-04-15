import React from 'react';
import { withRouter } from 'lib/withRouter';
import Toolbar from 'components/Toolbar/Toolbar.react';
import DashboardView from 'dashboard/DashboardView.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Button from 'components/Button/Button.react';
import Icon from 'components/Icon/Icon.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import P8AuthKeyModal from './P8AuthKeyModal.react';
import P12CertificateModal from './P12CertificateModal.react';
import styles from './PushiOSSettings.scss';

const getErrorMessage = (err, fallback) => {
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
  return fallback;
};

const formatDate = (isoString) => {
  if (!isoString) {
    return 'N/A';
  }
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return 'N/A';
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

@withRouter
class PushiOSSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'Notification';
    this.subsection = 'iOS';
    this.state = {
      isLoading: true,
      loadingError: null,
      p8Certificates: [],
      p12Certificates: [],
      deviceTypes: [],
      disableP12: false,
      incompatiblePS: false,
      hasPermission: true,
      showP8Modal: false,
      showP12Modal: false,
      showDeleteModal: false,
      deleteTarget: null,
      isDeleting: false,
      deleteError: null,
    };
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
      const data = await this.context.getPushIOSConfig();
      if (!this._isMounted) {
        return;
      }
      const hasPermission = !data.featuresPermission
        || data.featuresPermission.pushIOSSettings === 'Write';

      const p12Certificates = [];
      if (data.cert && typeof data.cert === 'object') {
        for (const [deviceType, certs] of Object.entries(data.cert)) {
          if (Array.isArray(certs)) {
            certs.forEach(c => p12Certificates.push({ ...c, deviceType }));
          }
        }
      }

      const p8Certificates = [];
      if (data.authKey && typeof data.authKey === 'object') {
        for (const [deviceType, certs] of Object.entries(data.authKey)) {
          if (Array.isArray(certs)) {
            certs.forEach(c => p8Certificates.push({
              _id: c._id,
              topic: c.topic,
              keyId: c.token?.keyId,
              teamId: c.token?.teamId,
              production: c.production,
              deviceType,
            }));
          }
        }
      }

      this.setState({
        isLoading: false,
        loadingError: null,
        p8Certificates,
        p12Certificates,
        deviceTypes: [...new Set([...(data.deviceTypes || []), 'tvos'])],
        disableP12: !!data.disableP12,
        incompatiblePS: !data.isCompatiblePS,
        hasPermission,
      });
    } catch (err) {
      if (this._isMounted) {
        this.setState({
          isLoading: false,
          loadingError: getErrorMessage(err, 'Failed to load iOS push settings.'),
        });
      }
    }
  }

  handleSaveP8 = async (file, keyId, teamId, bundleId, deviceType, production) => {
    await this.context.uploadP8AuthKey(file, keyId, teamId, bundleId, deviceType, production);
    this.setState({ isLoading: true });
    this.loadConfig();
  };

  handleSaveP12 = async (file, deviceType, production) => {
    await this.context.uploadP12Certificate(file, deviceType, production);
    this.setState({ isLoading: true });
    this.loadConfig();
  };

  handleCloseP8Modal = () => {
    this.setState({ showP8Modal: false });
  };

  handleCloseP12Modal = () => {
    this.setState({ showP12Modal: false });
  };

  openDeleteModal(certId, deviceType, certType) {
    this.setState({
      showDeleteModal: true,
      deleteTarget: { id: certId, deviceType, certType },
      deleteError: null,
    });
  }

  async handleDeleteConfirm() {
    const { deleteTarget } = this.state;
    if (!deleteTarget) {
      return;
    }

    clearTimeout(this._deleteErrorTimer);
    this.setState({ isDeleting: true, deleteError: null });

    try {
      if (deleteTarget.certType === 'p8') {
        await this.context.deleteP8AuthKey(deleteTarget.id, deleteTarget.deviceType);
      } else {
        await this.context.deleteP12Certificate(deleteTarget.id, deleteTarget.deviceType);
      }
      this.setState({
        isDeleting: false,
        showDeleteModal: false,
        deleteTarget: null,
        isLoading: true,
      });
      this.loadConfig();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to delete certificate.');
      this.setState({ isDeleting: false, showDeleteModal: false, deleteError: msg });
      this._deleteErrorTimer = setTimeout(() => {
        if (this._isMounted) {
          this.setState({ deleteError: null });
        }
      }, 5000);
    }
  }

  renderP8Table() {
    const { p8Certificates, hasPermission } = this.state;

    if (p8Certificates.length === 0) {
      return <div className={styles.emptyMessage}>No authentication keys configured.</div>;
    }

    return (
      <table className={styles.certTable}>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Key ID</th>
            <th>Team ID</th>
            <th>Production</th>
            <th>Device Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {p8Certificates.map(cert => (
            <tr key={cert._id}>
              <td>{cert.topic}</td>
              <td>{cert.keyId}</td>
              <td>{cert.teamId}</td>
              <td>{cert.production ? 'true' : 'false'}</td>
              <td>{cert.deviceType}</td>
              <td>
                <button
                  className={styles.deleteButton}
                  disabled={!hasPermission}
                  onClick={() => this.openDeleteModal(cert._id, cert.deviceType, 'p8')}
                  title="Delete authentication key"
                >
                  <Icon name="b4a-delete-icon" fill="#E85C3E" width={14} height={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  renderP12Table() {
    const { p12Certificates, hasPermission } = this.state;

    if (p12Certificates.length === 0) {
      return <div className={styles.emptyMessage}>No certificates configured.</div>;
    }

    return (
      <table className={styles.certTable}>
        <thead>
          <tr>
            <th>Bundle ID</th>
            <th>Production</th>
            <th>Expiration</th>
            <th>Device Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {p12Certificates.map(cert => (
            <tr key={cert._id}>
              <td>{cert.bundleId}</td>
              <td>{cert.production ? 'Production' : 'Development'}</td>
              <td>{formatDate(cert.expiresAt)}</td>
              <td>{cert.deviceType}</td>
              <td>
                <button
                  className={styles.deleteButton}
                  disabled={!hasPermission}
                  onClick={() => this.openDeleteModal(cert._id, cert.deviceType, 'p12')}
                  title="Delete certificate"
                >
                  <Icon name="b4a-delete-icon" fill="#E85C3E" width={14} height={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  renderDeleteModal() {
    if (!this.state.showDeleteModal) {
      return null;
    }
    const label = this.state.deleteTarget?.certType === 'p8'
      ? 'authentication key' : 'certificate';
    return (
      <B4aModal
        type={B4aModal.Types.DANGER}
        title={`Delete ${label}?`}
        subtitle="This action cannot be undone!"
        confirmText="Yes, delete"
        cancelText="Cancel"
        buttonsInCenter={true}
        onCancel={() => this.setState({ showDeleteModal: false, deleteTarget: null })}
        onConfirm={this.handleDeleteConfirm.bind(this)}
        progress={this.state.isDeleting}
        disabled={this.state.isDeleting}
      />
    );
  }

  renderContent() {
    const toolbar = (
      <Toolbar section="Notification" subsection="iOS Push">
        <a
          className={styles.toolbarButton}
          onClick={() => {
            this.setState({ isLoading: true, loadingError: null });
            this.loadConfig();
          }}
          title="Refresh"
        >
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>
      </Toolbar>
    );
    const {
      isLoading,
      loadingError,
      hasPermission,
      incompatiblePS,
      disableP12,
      deviceTypes,
      deleteError,
    } = this.state;

    let content = null;

    if (loadingError) {
      content = (
        <div style={{ paddingTop: '3rem' }}>
          <EmptyGhostState
            title="Error loading iOS push settings"
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
      content = (
        <div className={styles.mainContent}>
          <div className={styles.settingsWrapper}>
            <div className={styles.settingsContainer}>
              <div className={styles.heading}>iOS Push Settings</div>
              <div className={styles.subheading}>
                Manage Apple Push Notification certificates for your iOS and macOS applications.
              </div>

              <div className={styles.warningBanner}>
                We recommend using APNs Authentication Keys (.p8) as they are the most current and reliable method for sending push notifications.
              </div>

              <div className={hasPermission ? undefined : styles.noPermission}>
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h4>APNs Authentication Key</h4>
                    {incompatiblePS ? (
                      <span className={styles.tooltipWrapper} title="Available only for Parse Server 2.6.5+">
                        <Button
                          primary={true}
                          color="green"
                          width="auto"
                          disabled={true}
                          value={
                            <span className={styles.addButtonLabel}>
                              <Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" />
                              New
                            </span>
                          }
                        />
                      </span>
                    ) : (
                      <Button
                        primary={true}
                        color="green"
                        width="auto"
                        disabled={!hasPermission}
                        onClick={() => this.setState({ showP8Modal: true })}
                        value={
                          <span className={styles.addButtonLabel}>
                            <Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" />
                            New
                          </span>
                        }
                      />
                    )}
                  </div>
                  {this.renderP8Table()}
                </div>

                <hr className={styles.sectionDivider} />

                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h4>APNs Certificates</h4>
                    <Button
                      primary={true}
                      color="green"
                      width="auto"
                      disabled={disableP12 || !hasPermission}
                      onClick={() => this.setState({ showP12Modal: true })}
                      value={
                        <span className={styles.addButtonLabel}>
                          <Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" />
                          New
                        </span>
                      }
                    />
                  </div>
                  {this.renderP12Table()}
                </div>
              </div>

              {deleteError && (
                <div className={styles.deleteError}>{deleteError}</div>
              )}
            </div>
          </div>
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
        {this.state.showP8Modal && (
          <P8AuthKeyModal
            deviceTypes={deviceTypes}
            onSave={this.handleSaveP8}
            onClose={this.handleCloseP8Modal}
          />
        )}
        {this.state.showP12Modal && (
          <P12CertificateModal
            deviceTypes={deviceTypes}
            onSave={this.handleSaveP12}
            onClose={this.handleCloseP12Modal}
          />
        )}
      </div>
    );
  }
}

export default PushiOSSettings;
