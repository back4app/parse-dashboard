import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import subscribeTo from 'lib/subscribeTo';
import Toolbar from 'components/Toolbar/Toolbar.react';
import styles from 'dashboard/B4aWebDeployment/B4aWebDeployment.scss';
import MyAppStatus from './MyAppStatus.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import Icon from 'components/Icon/Icon.react';
import back4app2 from '../../lib/back4app2';


@subscribeTo('Schema', 'schema')
class B4aWebDeployment extends DashboardView {
  constructor() {
    super()
    this.section = 'Web Deployment';
    this.subsection = '';

    this.state = {
      isLoading: true,
      loadingErrorMessage: undefined,
      apps: [],
      searchText: '',
      filteredApps: [],
      favouriteAppsCount: 0,
    }

    this.handleToggleAppFavourite = this.handleToggleAppFavourite.bind(this);
    this.updateFilteredApps = this.updateFilteredApps.bind(this);

  }

  async componentWillMount() {
    try {
      const response = await back4app2.findApps();
      this.setState({
        apps: response
      });
    } catch (error) {
      console.log('error while fetching apps');
      this.setState(prev => ({
        ...prev,
        loadingErrorMessage: error.msg || 'Something went wrong!'
      }))
    }
  }

  async componentDidUpdate(_prevProps, prevState) {
    if ((prevState.apps !== this.state.apps) || prevState.searchText.trim() !== this.state.searchText.trim()) {
      this.updateFilteredApps();
    }
  }

  async updateFilteredApps () {
    const { apps, searchText } = this.state;
    let filteredApps = (apps && [...apps]) || [];
    if (searchText.trim()) {
      const regex = new RegExp(`${searchText}`, 'ig');
      filteredApps = filteredApps.filter(app => app.name.match(regex)) || [];
    }
    filteredApps = filteredApps.sort((a, b) => b.isFavourite === a.isFavourite ? a.name.localeCompare(b.name) : +b.isFavourite - +a.isFavourite);
    this.setState({ filteredApps });
  }

  async handleToggleAppFavourite (appId) {
    try {
      const selectedApp = this.state.apps?.find(app => app.id === appId);
      if (!selectedApp) {
        return;
      }
      // await back4app2.updateAppFavourite(selectedApp.id, !selectedApp.isFavourite);
    } catch (err) {
      console.log(err);
    }
  }

  renderContent() {
    const toolbar = (
      <Toolbar
        section='Web Deployment'>
      </Toolbar>
    );

    return (
      <div className={styles.content}>
        {toolbar}
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <div className={styles.title}>Your Containers' Apps</div>
            <div className={styles.subtitle}>Browse through your existing Containers&apos; Apps or start brand new.</div>
          </div>
          <div className={styles.subHeader}>
            <div className="">
              <button onClick={() => {
                // if (state.apps?.some(app => app.status === AppStatus.PENDING_VERIFICATION)) {
                //   toast('Please complete email verification!', {
                //     className:'bg-white px-6 py-4 text-dark text-center rounded-none rounded-bl-lg rounded-br-lg shadow-[0_6px_16px_rgba(0,0,0,0.25)] max-w-xs text-sm',
                //     duration: 3 * 1000,
                //     icon: <MailCircleSVG className="text-error-red" width="22px" height="22px" />
                //   });
                //   return;
                // }
                // navigate('/new-container');
                window.location = `${b4aSettings.CONTAINERS_DASHBOARD_PATH}/new-container`
              }} className={styles.createContainerBtn}>
                <div className={styles.createBtnIcon}>
                  <Icon name="create-icon" width={15} height={15} fill="#f9f9f9" />
                </div>
                <div className={styles.createBtnText}>
                  Create new app
                </div>
              </button>
            </div>
            <div>
              <div className={styles.overview}>
                <div className={styles.freeContainersCount}>
                  Free Containers <span className="">
                    {this.state.apps ? this.state.apps.filter(app => app.mainService?.mainServiceEnvironment?.plan?.name?.includes('Free')).length : ''}
                  </span>
                </div>
              </div>
              {/* <div className="max-w-xs mt-2 md:mt-0">
                <AppPlanUsage hours={this.state.freePlanUsageHours || 0} />
              </div> */}
            </div>
          </div>
          <div className={styles.mainBody}>
            <div className={styles.appsListOverview}>
              <div className={styles.appCount}>{`${this.state.apps.length} ${this.state.apps.length === 1 ? 'app' : 'apps'}`}</div>
              <div className={styles.search}>
                <input className={styles.searchInput} value={this.state.searchText} placeholder='Search' onChange={e => this.setState({ searchText: e.target.value })} />
              </div>
            </div>
            <div className="">
              {this.state.filteredApps.map(app => (
                <div key={app.id}>
                  <div className={styles.appItem}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className={styles.appInfo}>
                        <Icon name="containers-app" width="34px" height="34px" />
                        <div className={styles.appName} onClick={() => window.location = `${b4aSettings.CONTAINERS_DASHBOARD_PATH}/apps/${app.id}`}>
                          {/* <Link to={`/apps/${app.id}`}> */}
                          {app.name}
                          {/* </Link> */}
                        </div>
                        {app.mainService?.mainServiceEnvironment?.plan ? <span className={styles.appPlanName}>{app.mainService?.mainServiceEnvironment?.plan.name || ''}</span> : null}
                      </div>
                    </div>
                    <div className={styles.appInfoBottom}>
                      {app.mainService && app.mainService.mainServiceEnvironment && app.mainService.mainServiceEnvironment.mainCustomDomain && app.mainService.mainServiceEnvironment.mainCustomDomain.name && (
                        <a target="_blank" href={`${window.location.protocol}//${app.mainService.mainServiceEnvironment.mainCustomDomain.name}`} rel="noreferrer" className={styles.appDomainName}>
                          <span className={styles.appDomainNameText}>{app.mainService.mainServiceEnvironment.mainCustomDomain.name}</span>
                          <Icon name="containers-link-icon" width={11} height={11} fill="#27AE60" />
                        </a>
                      )}
                      <MyAppStatus app={app} />
                    </div>
                  </div>
                </div>
              ))}
              {this.state.apps.length === 0 ? <div style={{ border: '1px solid #f9f9f917', borderRadius: '5px', padding: '5rem 0' }}>
                <EmptyGhostState />
                <div style={{ marginTop: '-2rem', fontWeight: 600, fontSize: '18px', color: '#ccc', textAlign: 'center' }}>
                  Nothing here, yet!
                </div>
              </div> : null}
              {this.state.filteredApps.length === 0 && this.state.searchText ?  <div style={{ border: '1px solid #f9f9f917', borderRadius: '5px', padding: '5rem 0' }}>
                <EmptyGhostState />
                <div style={{ marginTop: '-2rem', fontWeight: 600, fontSize: '18px', color: '#ccc', textAlign: 'center' }}>
                  Try different filter
                </div>
              </div> : null}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default B4aWebDeployment
