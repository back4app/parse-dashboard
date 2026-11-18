import React from 'react'
import CategoryList from 'components/CategoryList/CategoryList.react';
import Icon from 'components/Icon/Icon.react'
import DashboardView from 'dashboard/DashboardView.react'
import HubDisconnectionDialog from 'dashboard/Hub/HubDisconnectionDialog.react'
import styles from 'dashboard/Hub/HubConnections.scss'
import { CurrentApp } from 'context/currentApp';
import { withRouter } from 'lib/withRouter';
import generatePath from 'lib/generatePath';
import { customDangerSwl } from 'lib/b4aCustomSweetalert';

// The Hub is discontinued. This page only lets apps connected before the
// shutdown remove their connections; the list comes from the dashboard config
// (custom.hubConnections, owner only). Apps without connections never see it.
@withRouter
class HubConnections extends DashboardView {
  static contextType = CurrentApp;
  constructor(props, context) {
    super(props, context);

    this.section = 'More';
    this.subsection = 'Database HUB';

    this.state = {
      namespaceBeingDisconnected: '',
      showDisconnectDialog: false,
      isDisconnecting: false,
    };
  }

  getConnections() {
    return (this.context.custom && this.context.custom.hubConnections) || [];
  }

  componentDidMount() {
    if (this.getConnections().length === 0) {
      this.props.navigate(generatePath(this.context, 'browser'), { replace: true });
    }
  }

  renderSidebar() {
    return (
      <CategoryList current='connections' linkPrefix={''} categories={[{ name: 'Connections', id: 'connections' }]} />
    );
  }

  renderRows() {
    return this.getConnections().map(namespace => (
      <tr key={namespace}>
        <td>{namespace}</td>
        <td>
          <div onClick={() => this.setState({ namespaceBeingDisconnected: namespace, showDisconnectDialog: true })}>
            <Icon name='b4a-delete-icon' fill='#E85C3E' width={18} height={18} role='button'/>
          </div>
        </td>
      </tr>
    ));
  }

  renderContent() {
    if (this.getConnections().length === 0) {
      return null;
    }
    return (
      <div className={styles.hubConnections}>
        <div className={styles.headerContainer}>
          <div className={styles.headerDescriptionContainer}>
            <section className={styles.header}>
              <span className={styles.title}>Database Hub</span>
              <div>
                <span className={styles.subtitle}>The Database Hub was discontinued. You can remove the connections this app still has.</span>
              </div>
            </section>
          </div>
        </div>
        <div className={styles.connectionsTableContainer}>
          <table className={styles.connectionsTable}>
            <thead>
              <tr>
                <th>Namespace</th>
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
                // Reloads the dashboard config: without connections left, the page goes away.
                window.location.reload(false);
              } catch (err) {
                this.setState({ isDisconnecting: false });
                customDangerSwl.fire({
                  title: 'Disconnection failed',
                  text: 'Please contact our support or try again later'
                });
              }
            }}
            onCancel={() => this.setState({ isDisconnecting: false, showDisconnectDialog: false })}
            isDisconnecting={this.state.isDisconnecting} />
        }
      </div>
    )
  }
}

export default HubConnections
