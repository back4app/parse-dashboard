import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import subscribeTo from 'lib/subscribeTo';
import Toolbar from 'components/Toolbar/Toolbar.react';
import styles from 'dashboard/B4aWebDeployment/B4aWebDeployment.scss';
import MyAppStatus from './MyAppStatus.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import Icon from 'components/Icon/Icon.react';
import back4app2 from '../../lib/back4app2';
import ContainersAppIcon from 'dashboard/B4aWebDeployment/ContainersAppIcon.react';

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
        apps: response,
        isLoading: false,
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
        section='Web Deployment'
        toolbarStyles={'toolbar-webdeployment'}>
        {/* <Button
          primary={true}
          value={
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" style={{ display: 'inline-block', marginRight: '0.5rem' }} />Deploy a Web App</span>
          }
          color="green"
          width="auto"
          additionalStyles={{ marginLeft: '1rem', padding: '0 0.5rem', fontSize: '12px', position: 'relative' }}
          onClick={() => window.location = `${b4aSettings.CONTAINERS_DASHBOARD_PATH}/new-container`}
        /> */}
      </Toolbar>
    );

    return (
      <div className={styles.content}>
        {toolbar}
        <div className={styles.mainContent}>
          <div className={styles.wrapper}>
            <div className={styles.header}>
              <div className={styles.title}>Manage Your Web Applications <span className={styles.chip}>beta</span> </div>
              <div className={styles.subtitle}>Explore your existing applications or kickstart a new project with ease.</div>
            </div>
            <div className={styles.subHeader}>
              <div className="">
                <button onClick={() => {
                  if (this.state.apps?.some(app => app.status === 'PENDING_VERIFICATION')) {
                    // toast('Please complete email verification!', {
                    //   className:'bg-white px-6 py-4 text-dark text-center rounded-none rounded-bl-lg rounded-br-lg shadow-[0_6px_16px_rgba(0,0,0,0.25)] max-w-xs text-sm',
                    //   duration: 3 * 1000,
                    //   icon: <MailCircleSVG className="text-error-red" width="22px" height="22px" />
                    // });
                    window.location = `${b4aSettings.CONTAINERS_DASHBOARD_PATH}/apps`;
                    return;
                  }
                  window.location = `${b4aSettings.CONTAINERS_DASHBOARD_PATH}/new-container`;
                }} className={styles.createContainerBtn}>
                  <div className={styles.createBtnIcon}>
                    <Icon name="create-icon" width={15} height={15} fill="#f9f9f9" />
                  </div>
                  <div className={styles.createBtnText}>
                    Deploy a Web App
                  </div>
                </button>
              </div>
              <div>
                <div className={styles.overview}>
                  <div className={styles.freeContainersCount}>
                    Free web applications <span className="">
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
                <div className={styles.appCount}>{`${this.state.apps.length} Web application${(this.state.apps.length === 0 || this.state.apps.length) === 1 ? '' : 's'}`}</div>
                <div className={styles.search}>
                  <input className={styles.searchInput} value={this.state.searchText} placeholder='Search' onChange={e => this.setState({ searchText: e.target.value })} />
                  <Icon name="search-outline" width={16} height={16} />
                </div>
              </div>
              <div className="">
                {this.state.isLoading ? (<div style={{ border: '1px solid #f9f9f917', borderRadius: '5px', padding: '5rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                  <Icon name="status-spinner" width="24px" height="24px" fill="#15A9FF" className={styles.spinnerStatus} />
                  <div style={{ marginTop: '1rem', fontWeight: 600, fontSize: '18px', color: '#ccc', textAlign: 'center' }}>
                    Loading...
                  </div>
                </div>) : (this.state.loadingErrorMessage ? (<div style={{ border: '1px solid #f9f9f917', borderRadius: '5px', padding: '5rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                  <Icon name="status-error" width="32px" height="32px" fill="#E85C3E" />
                  <div style={{ marginTop: '1rem', fontWeight: 600, fontSize: '18px', color: '#ccc', textAlign: 'center' }}>
                    {this.state.loadingErrorMessage}
                  </div>
                </div>) : (
                  <>
                    {this.state.filteredApps.map(app => (
                      <div key={app.id}>
                        <div className={styles.appItem}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className={styles.appInfo}>
                              {/* <Icon name="containers-app-icon" width="34px" height="34px" fill="red" /> */}
                              <ContainersAppIcon />
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
                  </>
                ))}
              </div>
            </div>
            <div className={styles.guideSection}>
              <h1 className={styles.guidesTitle}>Guides & Docs</h1>
              <div className={styles.guidesContainer}>
                <ul className={styles.guidesList}>
                  <li>
                    <a
                      href="https://www.back4app.com/docs-containers"
                      rel="noreferrer"
                      target="_blank"
                      className={styles.guidesLink}
                    >
                      Get Started
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.back4app.com/docs-containers/integrate-with-github"
                      rel="noreferrer"
                      target="_blank"
                      className={styles.guidesLink}
                    >
                      Creating a new App
                    </a>
                  </li>
                </ul>
                <ul className={styles.guidesList}>
                  <li>
                    <a
                      href="https://www.back4app.com/docs-containers/deployment-process"
                      rel="noreferrer"
                      target="_blank"
                      className={styles.guidesLink}
                    >
                      Manage your App
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.back4app.com/docs-containers/troubleshooting"
                      rel="noreferrer"
                      target="_blank"
                      className={styles.guidesLink}
                    >
                      Troubleshooting
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default B4aWebDeployment
