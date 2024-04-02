import AccountManager from 'lib/AccountManager';
import React from 'react'
import Swal from 'sweetalert2'
import Button from 'components/Button/Button.react';
import CategoryList from 'components/CategoryList/CategoryList.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import B4aLoader from 'components/B4aLoader/B4aLoader.react';
import Icon from 'components/Icon/Icon.react'
import DashboardView from 'dashboard/DashboardView.react'
import HubDisconnectionDialog from 'dashboard/Hub/HubDisconnectionDialog.react'
import styles from 'dashboard/Hub/HubConnections.scss'
import { CurrentApp } from 'context/currentApp';
import { withRouter } from 'lib/withRouter';

@withRouter
class HubConnections extends DashboardView {
  static contextType = CurrentApp;
  constructor(props, context) {
    super(props, context);

    this.section = 'More';
    this.subsection = 'Database HUB';

    this.state = {
      data: null,
      namespaceBeingDisconnected: '',
      showDisconnectDialog: false,
      isDisconnecting: false,
      isloading: true,
    };

    this.user = AccountManager.currentUser();
  }

  async componentDidMount() {
    const data = await this.context.fetchHubConnections();
    this.setState({ data, isloading: false });
  }

  renderSidebar() {
    const { pathname } = this.props.location;
    const current = pathname.substr(pathname.lastIndexOf('/') + 1, pathname.length - 1);
    const categories = [
      { name: 'Connections', id: 'connections' },
    ];
    if (this.user.allowHubPublish) {
      categories.push({ name: 'Publish', id: 'hub-publish' })
    }
    return (
      <CategoryList current={current} linkPrefix={''} categories={categories} />
    );
  }

  renderRows() {
    if (!this.state.data || this.state.data.length === 0) {
      return null
    }
    return this.state.data.map(({ name, authorSlug, namespace, slug, isCollab }) => {
      return (
        <tr key={namespace}>
          <td>{namespace}</td>
          <td>{name}</td>
          <td>
            <a href={`${b4aSettings.HUB_URL}/${authorSlug}/${slug}`}>
              View on Hub
            </a>
          </td>
          <td>
            {!isCollab && <div onClick={() => this.setState({ namespaceBeingDisconnected: namespace, showDisconnectDialog: true })}>
              <Icon name='b4a-delete-icon' fill='#E85C3E' width={18} height={18} role='button'/>
            </div>}
          </td>
        </tr>
      )
    })
  }

  renderContent() {
    return (
      <div className={styles.hubConnections}>
        <div className={styles.headerContainer}>
          <div className={styles.headerDescriptionContainer}>
            <section className={styles.header}>
              {/* <span className={styles.subtitle}>{(this.state.data && this.state.data.length) || 0} public databases connected</span> */}
              <span className={styles.title}>Database Hub</span>
              <div>
                <span className={styles.subtitle}>Connections</span>
              </div>
            </section>
          </div>

          <section className={styles.toolbar}>
            {/* <Button
              color='green'
              secondary={true}
              value='Database Hub'
              onClick={() => {
                window.open(b4aSettings.HUB_URL, '_blank');
              }}/> */}
          </section>
        </div>
        {this.state.isloading ? <div className={styles.loadingState}><B4aLoader /></div> : (
          !this.state.data || this.state.data.length === 0 ? (<div className={styles.empty}>
            <B4aEmptyState
              cta='Go to Database Hub'
              action={b4aSettings.HUB_URL}
              description='Check the Database Hub and connect to public databases'
              icon='b4a-app-settings-icon'
              title='No connections were found'
            />
          </div>) : (<>
            <div className={styles.connectionsTableContainer}>
              <table className={styles.connectionsTable}>
                <thead>
                  <tr>
                    <th>Namespace</th>
                    <th>Public database</th>
                    <th>Database Hub Link</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {this.renderRows()}
                </tbody>
              </table>
            </div>
            {this.state.showDisconnectDialog &&
                <HubDisconnectionDialog
                  namespace={this.state.namespaceBeingDisconnected}
                  onConfirm={async () => {
                    await this.setState({ isDisconnecting: true });
                    try {
                      await this.context.disconnectHubDatabase(this.state.namespaceBeingDisconnected);
                      window.location.reload(false);
                    } catch (err) {
                      this.setState({ isDisconnecting: false });
                      Swal.fire({
                        type: 'error',
                        title: 'Disconnection failed',
                        text: 'Please contact our support or try again later'
                      });
                    }
                  }}
                  onCancel={() => this.setState({ isDisconnecting: false, showDisconnectDialog: false })}
                  isDisconnecting={this.state.isDisconnecting} />
            }
          </>)
        )}
      </div>
    )
  }
}

export default HubConnections
