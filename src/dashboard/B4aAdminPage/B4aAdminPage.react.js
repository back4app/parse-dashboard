import React            from 'react'
import { ActionTypes }  from 'lib/stores/SchemaStore';
import Parse            from 'parse';
import axios            from 'axios'
import DashboardView    from 'dashboard/DashboardView.react';
import subscribeTo      from 'lib/subscribeTo';
import LoaderContainer  from 'components/LoaderContainer/LoaderContainer.react'
import Field            from 'components/Field/Field.react';
import Fieldset         from 'components/Fieldset/Fieldset.react';
import FormNote         from 'components/FormNote/FormNote.react';
import Label            from 'components/Label/Label.react';
import Button           from 'components/Button/Button.react';
import styles           from 'dashboard/B4aAdminPage/B4aAdminPage.scss'
import B4aAdminModal    from 'dashboard/B4aAdminPage/B4aAdminModal'
import B4aAdminParams   from 'dashboard/B4aAdminPage/B4aAdminParams'
import Toolbar          from 'components/Toolbar/Toolbar.react';
import Icon             from 'components/Icon/Icon.react';
import ReactPlayer      from 'react-player';

// const EMAIL_VERIFICATION_URL = `${b4aSettings.BACK4APP_API_PATH}/email-verification`;

@subscribeTo('Schema', 'schema')
class B4aAdminPage extends DashboardView {
  constructor() {
    super()
    this.section = 'More';
    this.subsection = 'Admin App';
    this.adminDomain = b4aSettings.ADMIN_DOMAIN
    this.protocol = 'https://'

    this.state = {
      loading: true,
      username: '',
      password: '',
      host: '',
      adminURL: '',
      isRoleCreated: false,
      adminParams: {}
    }

    this.legend = 'Admin App Setup'
    this.description = 'Admin App is a web browser-based tool designed to manage the app data using a non-tech user interface.'
  }

  async componentDidMount() {
    const adminParams = B4aAdminParams({ appName: this.context.name })
    await this.setState({ adminParams })

    const adminHost = await this.context.getAdminHost()
    const adminURL = adminHost ? this.protocol + adminHost : ''
    const isRoleCreated = await this.checkRole()
    this.setState({ isRoleCreated, adminHost, adminURL, loading: false })

    if (typeof back4AppNavigation !== 'undefined' && typeof back4AppNavigation.atAdminPageEvent === 'function') {
      back4AppNavigation.atAdminPageEvent()
    }
  }

  displayMessage(colorNotification, message) {
    return (
      <FormNote
        show={true}
        color={colorNotification}>
        <div>
          {message}
          {this.state.inviteCollab ?
            <span> -&nbsp;
              <a onClick={() => {this.setState({showDialog: true})}} style={{ fontWeight: 'bold' }}>Send Invite</a>
            </span>
            : null}
        </div>
      </FormNote>
    );
  }

  async checkRole() {
    const { adminParams } = this.state

    const queryRole = new Parse.Query(Parse.Role)
    queryRole.equalTo('name', adminParams.adminRole)
    const result = await queryRole.first({ useMasterKey: true })
    return !!result
  }

  async createHost() {
    const { host } = this.state

    // Create admin host
    await this.context.addAdminHost(host + this.adminDomain)
    return this.protocol + host + this.adminDomain
  }

  async createAdmin() {
    const { username, password } = this.state
    await this.context.addAdminUser({ username, password })

    await this.setState({ isRoleCreated: true })
  }

  async createTextIndexes() {
    await this.context.createTextIndexes()
  }

  async renderModal() {
    await B4aAdminModal.show({
      domain: this.adminDomain,
      setState: this.setState.bind(this),
      createAdmin: this.createAdmin.bind(this),
      createAdminHost: this.createHost.bind(this),
      createTextIndexes: this.createTextIndexes.bind(this),
      ...this.state
    })

    if (typeof back4AppNavigation !== 'undefined' && typeof back4AppNavigation.onShowAdminModalEvent === 'function')
    {back4AppNavigation.onShowAdminModalEvent()}
  }

  renderButtonToEnable(){
    return (
      <div>
        <div className={styles['enable-feature-block']}>
          <Button value='Enable Admin App'
            onClick={this.renderModal.bind(this)}
            primary={true}
            className={styles['input-child']}/>
        </div>
      </div>
    )
  }

  renderContent() {
    const isAdminHostEnabled = this.state.adminURL || false
    const adminURL = this.state.adminURL

    const toolbar = (
      <Toolbar
        section='Admin App'>
      </Toolbar>
    );

    const fields = <Fieldset legend={this.legend} description={this.description}>
      <ReactPlayer
        url='https://www.youtube.com/watch?v=7CHdIniAACE'
        controls
        width="650px"
        style={{
          border: '1px solid #000',
          borderRadius: '4px',
          marginBottom: '20'
        }} />
      <Field
        height='120px'
        textAlign='center'
        label={<Label text='Is Enabled?' description="Enabling will automatically add three new classes, new indexes and a new role to your application’s schema." />}
        input={<div
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          className={styles['input']}>
          {
            isAdminHostEnabled
              ? <Icon name='admin-app-check' width={50} height={50}
                fill='#4CAF50' className={styles['input-child']}></Icon>
              : this.renderButtonToEnable()
          }
        </div>
        }>
      </Field>
      {
        isAdminHostEnabled
          ? <Field
            height='120px'
            textAlign='center'
            label={<Label text='Admin App URL' description='Use this address to share your Admin App with trusted users. Only users with the B4aAdminUser role will be allowed to log in.' />}
            input={<div className={styles['input']}><a target='_blank' href={adminURL} className={styles['input-child']}>{adminURL}</a></div>}>
          </Field>
          : ''
      }
    </Fieldset>

    return (
      <LoaderContainer className={styles.loading} loading={this.state.loading} hideAnimation={false} solid={true}>
        <div className={styles['admin-page']}>
          {toolbar}
          {fields}
        </div>
      </LoaderContainer>
    )
  }
}

export default B4aAdminPage
