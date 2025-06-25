import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Icon from 'components/Icon/Icon.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';
import styles from './DeploymentDetails.scss';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import { withRouter } from 'lib/withRouter';
import DashboardView from 'dashboard/DashboardView.react';
import B4ACodeTree from 'components/B4ACodeTree/B4ACodeTree.react';
import CloudCodeChanges from 'lib/CloudCodeChanges';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import errorImgPNG from 'dashboard/Data/Browser/error-icon.png';

@withRouter
class DeploymentDetails extends DashboardView {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Deployments > ';
    this.state = {
      loading: true,
      currentRelease: undefined,
      tree: undefined,
      error: undefined
    };
    this.cloudCodeChanges = new CloudCodeChanges();
    this.onFileClick = this.onFileClick.bind(this);
  }

  componentWillMount() {
    this.loadData();
  }

  loadData() {
    this.context.getDeploymentDetails(this.props.params.releaseId).then((data) => {
      this.setState({
        currentRelease: data.currentRelease,
        tree: data.changes.tree
      });
    }).catch((err) => {
      console.error(err);
      this.setState({ error: err.message || 'Failed to load deployment details' });
    }).finally(() => {
      this.setState({ loading: false });
    });
  }

  onRefresh() {
    this.setState({ loading: true, error: undefined, tree: undefined, currentRelease: undefined }, () => {
      this.loadData();
    });
  }

  renderToolbar() {
    return (
      <Toolbar section="Cloud Code" subsection={`Deployments > V${this.props.params.releaseId}`} >
        <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>
      </Toolbar>
    );
  }

  async onFileClick(fileNode) {
    console.log('fileNode', fileNode);
    if (!fileNode || fileNode.type === 'folder') { return; }

    try {
      const data = await this.context.fetchFileData({ ...fileNode.data, releaseId: this.props.params.releaseId });
      console.log('Fetched file data:', data);
      return data;
    } catch (err) {
      console.error('Failed to fetch file data:', err);
    }
  }

  renderFileTree() {
    return (
      <div className={styles.fileTreeContainer}>
        <div className={styles.fileTreeHeader}>Changed Files</div>
        <div className={styles.fileTree}>
          {this.state.tree ? (
            <B4ACodeTree
              key={this.props.params.releaseId}
              setUpdatedFile={() => {}}
              files={this.state.tree}
              parentState={() => {}}
              currentApp={this.context}
              cloudCodeChanges={this.cloudCodeChanges}
              hideControls={true}
              style={{ position: 'relative', minHeight: '500px', top: '0', background: '#1D293E', borderRadius: '0.25rem', overflow: 'hidden' }}
              onFileClick={this.onFileClick}
            />
          ) : null}
        </div>
      </div>
    );
  }

  renderContent(){
    const toolbar = this.renderToolbar();
    return <div>
      <B4aLoaderContainer loading={this.state.loading}>
        <div className={styles.content}>
          <div className={styles.mainContent}>
            <div className={styles.header}>
              <div className={styles.title}>V{this.props.params.releaseId}</div>
              <div className={styles.subtitle}>
                <div className={styles.description}>{this.state.currentRelease?.description}</div>
                <div className={styles.right}>
                  <div className={styles.deployedAt}>
                    {this.state.currentRelease && new Date(this.state.currentRelease.deployedAt).toLocaleString()}
                  </div>
                  {this.state.isRollbackAvailable && (
                    <button className={styles.rollbackButton}>
                      Rollback to version
                    </button>
                  )}
                </div>
              </div>
            </div>
            {this.state.error ? <div style={{ marginTop: '2.5rem' }}><B4aEmptyState title="Error" description={this.state.error} imgSrc={errorImgPNG} /></div> : this.renderFileTree()}
          </div>
        </div>
      </B4aLoaderContainer>
      {toolbar}
    </div>
  }
}

export default DeploymentDetails;
