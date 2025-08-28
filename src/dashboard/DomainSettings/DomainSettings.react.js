/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountManager from 'lib/AccountManager';
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { withRouter } from 'lib/withRouter';
import DashboardView from 'dashboard/DashboardView.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import styles from './DomainSettings.scss';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import Button from 'components/Button/Button.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';
import Icon from 'components/Icon/Icon.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Label from 'components/Label/Label.react';
import Field from 'components/Field/Field.react';
import TextInput from 'components/TextInput/TextInput.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import B4aNotification from 'dashboard/Data/Browser/B4aNotification.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';
import StripeValidateCard from 'components/StripeValidateCard/StripeValidateCard.react';
import { Link } from 'react-router-dom';
import back4app2 from 'lib/back4app2';

@withRouter
class DomainSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Domain Settings';
    this.state = {
      isLoading: true,
      domainSettings: {},
      domainSettingsError: null,

      isUserVerified: false,
      canChangeCustomDomain: false,
      showCardValidation: true,

      subdomainName: '',
      currentSubdomain: '',
      customDomain: '',
      customDomainArray: [],

      activated: false,
      isActivated: false,
      hasPermission: false,
      availableDomains: ['b4a.app'],
      currentDomain: 'b4a.app',

      updating: false,
      isEditing: false,
      hasToggleChanged: false,

      errorCustomDomain: null,
      successCustomDomain: null,
      errorUpdateWebHost: null,
      successUpdateWebHost: null,

      // Session verification states
      isVerifyingSession: false,
      sessionVerificationError: null,
      verifiedSessionId: null,
      showSuccessMessage: false,

    };
    this.onRefresh = this.onRefresh.bind(this);
    this.handleSubdomainChange = this.handleSubdomainChange.bind(this);
    this.handleAddCustomDomain = this.handleAddCustomDomain.bind(this);
    this.handleRemoveCustomDomain = this.handleRemoveCustomDomain.bind(this);
    this.handleToggleChange = this.handleToggleChange.bind(this);
  }

  componentWillMount() {
    this.loadData();
    this.checkForStripeSession();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      // check if the changes are in currentApp serverInfo status
      // if not return without any request
      if (this.props.apps !== nextProps.apps) {
        const updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.match.params.appId);
        const prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.match.params.appId);
        const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
        if (!shouldUpdate) {return;}
      }
      // nextProps.config.dispatch(ActionTypes.FETCH);
    }
  }

  onRefresh() {
    this.setState({ isLoading: true });
    this.loadData();
  }

  async loadData() {
    try {
      const response = await this.context.getCustomDomain();
      this.setState({ domainSettings: response });
      await this.loadHostSettings(response);
    } catch (error) {
      this.setState({ domainSettingsError: error });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async loadHostSettings(response) {
    const { hostSettings: appHostSettings, domains, canChangeCustomDomain, createdAt } = response;

    let customDomainArray = [];
    let subdomainName = '';
    let currentSubdomain = '';
    let activated = false;
    let isActivated = false;
    let hasPermission = false;
    let isUserVerified = false;
    let alertValidationCreditCard = true;

    if (domains && domains.length > 0) {
      customDomainArray = domains;
    }

    if (domains && domains.length > 0) {
      customDomainArray = domains;
    }

    if (appHostSettings && appHostSettings.webhost) {
      const subDomainName = appHostSettings.webhost
      currentSubdomain = subDomainName
      subdomainName = subDomainName.replace(/\.(b4a|back4app|b4a|b4app)\.(app|io)$/, '');
      this.listAvailableDomains(subDomainName)
      activated = true;
      isActivated = activated && subDomainName ? true : false;
    } else {
      subdomainName = appHostSettings.appName.replace(/[^A-Z0-9]+/ig, '').toLowerCase();
    }

    hasPermission = (!response.featuresPermission || response.featuresPermission.webHostLiveQuery === 'Write');
    if (response && ((appHostSettings.serverURL && appHostSettings.activated) || (createdAt && ((new Date() - new Date(createdAt)) > (6 * 30 * 24 * 60 * 60 * 1000))))) {
      isUserVerified = true;
      alertValidationCreditCard = false;
    }

    if (!isUserVerified) {
      try {
        const plan = await this.context.getAppPlanData();
        if (plan && plan.planName && (plan.planName.indexOf('Free') < 0) && (plan.planName.indexOf('Public') < 0)) {
          isUserVerified = true;
          alertValidationCreditCard = false;
        } else {
          const currentUser = AccountManager.currentUser();
          if (currentUser && currentUser.verification.cardValidation) {
            isUserVerified = true;
            alertValidationCreditCard = false;
          }
        }
      } catch (planError) {
        const currentUser = AccountManager.currentUser();
        if (currentUser && currentUser.verification.cardValidation) {
          isUserVerified = true;
          alertValidationCreditCard = false;
        }
      }
    }

    this.setState({
      isUserVerified,
      showCardValidation: alertValidationCreditCard,

      subdomainName,
      currentSubdomain,
      customDomainArray,

      activated,
      isActivated,
      isEditing: !isActivated,

      hasPermission,
      canChangeCustomDomain,
    });
  }

  listAvailableDomains(appDomain) {
    const domain = appDomain.substring(appDomain.lastIndexOf('.', appDomain.lastIndexOf('.') - 1) + 1)
    if (this.state.availableDomains.indexOf(domain) == -1) { this.state.availableDomains.push(domain) }
    this.setState({ currentDomain: domain });
  }

  renderToolbar() {
    return (
      <Toolbar section="App Settings" subsection="Domain Settings">
        <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>
        {this.state.hasToggleChanged && (
          <Button
            value="Save Changes"
            primary={true}
            onClick={this.handleUpdateHostSettings.bind(this)}
            disabled={this.state.updating}
            width="auto"
            additionalStyles={{ marginLeft: '10px' }}
          />
        )}
      </Toolbar>
    );
  }

  handleSubdomainChange(e) {
    this.setState({ subdomainName: e.target.value });
  }

  handleToggleChange(value) {
    const originalActivated = this.state.isActivated;
    this.setState({
      activated: value,
      hasToggleChanged: originalActivated && !value // Only true when changing from true to false
    });
  }

  async handleAddCustomDomain() {
    try {
      this.setState({ updating: true });
      await this.context.addCustomDomain({ domain: this.state.customDomain });
      this.setState({ customDomainArray: [...this.state.customDomainArray, this.state.customDomain], customDomain: '' });

      // Send amplitude event for custom domain configuration
      amplitudeLogEvent('Custom Domain configured');

      this.setState({ successCustomDomain: 'Custom domain added successfully' });
      setTimeout(() => {
        this.setState({ successCustomDomain: null });
      }, 5000);
    } catch (error) {
      this.setState({ errorCustomDomain: error });
      setTimeout(() => {
        this.setState({ errorCustomDomain: null });
      }, 5000);
    } finally {
      this.setState({ updating: false });
    }
  }

  async handleRemoveCustomDomain(domain) {
    try {
      this.setState({ updating: true });
      await this.context.removeCustomDomain({ domain });
      this.setState({ customDomainArray: this.state.customDomainArray.filter(d => d !== domain) });
      this.setState({ successCustomDomain: 'Custom domain removed successfully' });
      setTimeout(() => {
        this.setState({ successCustomDomain: null });
      }, 5000);
    } catch (error) {
      this.setState({ errorCustomDomain: error.message || 'Something went wrong!' });
      setTimeout(() => {
        this.setState({ errorCustomDomain: null });
      }, 5000);
    } finally {
      this.setState({ updating: false });
    }
  }

  async handleUpdateHostSettings() {
    try {
      this.setState({ updating: true });
      await this.context.updateHostAddress({ currentSubdomain: this.state.currentSubdomain,
        subdomainName: this.state.subdomainName + '.' + this.state.currentDomain,
        activated: this.state.activated
      });

      // Send amplitude event for web hosting configuration
      amplitudeLogEvent('Webhosting configured');

      this.setState({
        successUpdateWebHost: 'Subdomain updated successfully',
        hasToggleChanged: false // Reset the toggle change flag
      }, () => {
        this.onRefresh();
        setTimeout(() => {
          this.setState({ successUpdateWebHost: null });
        }, 5000);
      });
    } catch (error) {
      this.setState({ errorUpdateWebHost: error.message || 'Something went wrong!' }, () => {
        setTimeout(() => {
          this.setState({ errorUpdateWebHost: null });
        }, 5000);
      });
    } finally {
      this.setState({ updating: false });
    }
  }

  async verifyUser() {
    try {
      const user = await back4app2.me();
      if (user && user.verification.cardValidation) {
        this.setState({ isUserVerified: true, showCardValidation: false });
      }
    } catch (e) {
      console.log('user validation failed!')
    }
  }

  checkForStripeSession() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId && sessionId !== this.state.verifiedSessionId) {
      this.verifyStripeSession(sessionId);
    }
  }

  async verifyStripeSession(sessionId) {
    try {
      this.setState({
        isVerifyingSession: true,
        sessionVerificationError: null
      });

      await back4app2.stripeSessionStatus(sessionId);

      // Session verification successful
      this.setState({
        isVerifyingSession: false,
        verifiedSessionId: sessionId,
        showSuccessMessage: true
      });

      const user = AccountManager.currentUser();
      user.verification.cardValidation = true;
      AccountManager.setCurrentUser({ user });

      // Show success message for 2 seconds, then close modal and update state
      setTimeout(() => {
        this.setState({
          showSuccessMessage: false,
          isUserVerified: true,
          showCardValidation: false
        });
      }, 2000);

    } catch (error) {
      console.error('Error verifying stripe session:', error);

      this.setState({
        isVerifyingSession: false,
        sessionVerificationError: error.message || 'Failed to verify payment. Please try again.',
        showCardValidation: true
      });
    } finally {
      // Clean up URL regardless of success or error
      const url = new URL(window.location);
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url);
    }
  }

  getDisplayContent() {
    let content = null;

    if (this.state.isVerifyingSession || this.state.showSuccessMessage) {
      content = <B4aModal
        type={B4aModal.Types.DEFAULT}
        title={this.state.showSuccessMessage ? 'Payment Verified' : 'Verifying payment'}
        subtitle={this.state.showSuccessMessage ? 'Your payment has been successfully verified!' : 'Please wait while we verify your payment...'}
        width={'60vw'}
        customFooter={<div></div>}
      >
        <div className={styles.paymentVerificationModal}>
          {this.state.showSuccessMessage ? (
            <div className={styles.successContainer}>
              <Icon name="b4a-success-check" width={24} height={24} />
              <div className={styles.successText}>Payment verification successful!</div>
            </div>
          ) : (
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
              <div className={styles.spinnerText}>Loading...</div>
            </div>
          )}
        </div>
      </B4aModal>
    } else if (this.state.showCardValidation) {
      content = <Fieldset>
        <Field
          label={<Label text="Verify your card" dark={true} description="You must verify your card to activate your web hosting." />}
          input={<div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
            <StripeValidateCard
              onClick={() => this.setState({ cardValidationError: null, sessionVerificationError: null })}
              onError={(err) => this.setState({ cardValidationError: err.message || 'Something went wrong!' })}
              onSuccess={() => this.verifyUser()}
            />
          </div>}
          theme={Field.Theme.BLUE}
        />
        {(this.state.cardValidationError || this.state.sessionVerificationError) && (
          <div className={styles.error}>
            {this.state.cardValidationError || this.state.sessionVerificationError}
          </div>
        )}
      </Fieldset>
    } else if (this.state.isUserVerified) {
      content = <><Fieldset>
        <Field
          label={<Label text="Activate Web Hosting" dark={true} description="Toggle to enable or disable web hosting for your app." />}
          input={
            <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
              <B4aToggle
                value={this.state.activated}
                onChange={this.handleToggleChange}
                type={B4aToggle.Types.YES_NO}
              />
            </div>
          }
          theme={Field.Theme.BLUE}
        />
        {this.state.activated && <Field
          label={<Label text="Subdomain Name" dark={true} description="Enter your subdomain name" />}
          input={
            <div style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              padding: '0 1rem',
              justifyContent: 'space-between'
            }}>
              {this.state.isEditing ? <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                  <TextInput
                    value={this.state.subdomainName}
                    onChange={(name) => this.setState({ subdomainName: name })}
                    placeholder={this.state.currentSubdomain || 'yourapp'}
                    disabled={this.state.updating}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}>
                .
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {this.state.availableDomains.length > 1 ? (<select
                    value={this.state.currentDomain}
                    onChange={(e) => this.setState({ currentDomain: e.target.value })}
                    disabled={this.state.updating}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      padding: '0.25rem',
                      outline: 'none',
                    }}
                  >
                    {this.state.availableDomains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>) : (<span style={{ display:'inline-block', marginLeft: '0.5rem' }}>{this.state.currentDomain}</span>)}
                  <Button
                    value={this.state.updating ? 'saving...' : 'save'}
                    onClick={this.handleUpdateHostSettings.bind(this)}
                    disabled={this.state.updating || !this.state.subdomainName}
                    primary={true}
                  />
                  {this.state.domainSettings.hostSettings.webhost && <Button
                    value={'cancel'}
                    onClick={() => this.setState({ isEditing: false })}
                    disabled={this.state.updating}
                    color="red"
                  />}
                </div>
              </> : (
                <>
                  <span className={styles.subdomainContainer}><a className={styles.subdomain} href={`https://${this.state.domainSettings.hostSettings.webhost}`} target="_blank" rel="noopener noreferrer">{this.state.domainSettings.hostSettings.webhost}</a></span>
                  <Button
                    value={'Edit'}
                    color="blue"
                    secondary={true}
                    onClick={() => this.setState({ isEditing: true })}
                    disabled={this.state.updating}
                  /></>
              )}

            </div>
          }
          theme={Field.Theme.BLUE}
        />}
        {this.state.successUpdateWebHost && <div className={styles.success}>{this.state.successUpdateWebHost}</div>}
        {this.state.errorUpdateWebHost && <div className={styles.error}>{this.state.errorUpdateWebHost}</div>}
      </Fieldset>

      <Fieldset legend="Custom Domain" description={this.state.canChangeCustomDomain ? 'Configure a custom address to your app.' : 'Upgrade to Pay as You Go Plan to add your custom domain.'}>
        {!this.state.canChangeCustomDomain && <Link to={`/apps/${this.context.slug}/plan-usage`}>
          <Button
            value="Upgrade Plan"
            primary={true}
          />
        </Link>}

        <div style={{ marginTop: this.state.canChangeCustomDomain ? '0' : '1rem', opacity: this.state.canChangeCustomDomain ? 1 : 0.5, pointerEvents: this.state.canChangeCustomDomain ? 'auto' : 'none' }}>
          <Field
            label={<Label text="Custom domain" dark={true} description="Enter your custom domain" />}
            input={<div style={{ width: '100%', padding: '0 1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <TextInput
                value={this.state.customDomain}
                onChange={(val) => this.setState({ customDomain: val })}
                disabled={this.state.updating || !this.state.canChangeCustomDomain}
                placeholder="example.com"
              />
              <Button
                value="Add"
                color="green"
                onClick={this.handleAddCustomDomain}
                disabled={this.state.updating || !this.state.canChangeCustomDomain || this.state.customDomain.trim().length === 0}
                additionalStyles={{ background: 'transparent', border: '1px solid #4CAF50', color: '#4CAF50', borderRadius: '4px', padding: '0.5rem 1rem', fontSize: '14px', minWidth: '80px' }}
              />
            </div>}
            theme={Field.Theme.BLUE}
          />
          <div className={styles.note}>
            Note: To set up a custom domain, you'll first need to create a
            b4a.app subdomain (e.g. myapp.b4a.app). After that, create a CNAME DNS entry in your DNS provider.
            (myapp.mydomain.com - myapp.b4a.app)
          </div>
        </div>
      </Fieldset>

      <Fieldset legend="Custom domains added">
        <Field label={<Label text="Available Custom domains" dark={true} />}
          theme={Field.Theme.BLUE}
          input={<div className={styles.customDomainList}>
            {this.state.customDomainArray.length === 0 ? (
              <div className={styles.noDomains}>NA</div>
            ) : (
              this.state.customDomainArray.map((domain, index) => (
                <div
                  key={domain}
                  className={`${styles.customDomainItem} ${index === this.state.customDomainArray.length - 1 ? styles.lastItem : ''}`}
                >
                  <div className={styles.subdomainContainer}> <a style={{ color: '#fff' }} className={styles.subdomain} href={`https://${domain}`} target="_blank" rel="noopener noreferrer">{domain}</a></div>
                  <Button
                    value="x"
                    color="red"
                    onClick={() => this.handleRemoveCustomDomain(domain)}
                    width="auto"
                    additionalStyles={{
                      padding: '0 0.5rem',
                    }}
                    disabled={this.state.updating}
                  />
                </div>
              ))
            )}
          </div>}
        />
        {this.state.successCustomDomain && <div className={styles.success}>{this.state.successCustomDomain}</div>}
        {this.state.errorCustomDomain && <div className={styles.error}>{this.state.errorCustomDomain}</div>}
      </Fieldset>
      </>
    }

    return (
      <div className={styles.domainSettingsContainer}>
        <div className={styles.heading}>Web Hosting</div>
        <div className={styles.subheading}>You can use this section to enable a subdomain to host your pages and create your own custom domain.</div>
        <div className={styles.formContainer}>
          {content}
        </div>
      </div>
    );
  }

  renderContent() {
    const toolbar = this.renderToolbar();
    const loading = this.state.isLoading;

    let content = null;
    if (loading) {
      content = null;
    } else if (this.state.domainSettingsError) {
      content = <EmptyGhostState
        title="Error loading domain settings"
        description={this.state.domainSettingsError}
      />
    } else {
      content = <div className={styles.mainContent}>
        {this.getDisplayContent()}
      </div>
    }

    return (
      <div>
        <B4aLoaderContainer loading={loading}>
          <div className={styles.content}>
            {content}
          </div>
        </B4aLoaderContainer>
        {toolbar}

        {/* Notification Component */}
        {this.state.showNotification && (
          <B4aNotification
            message={this.state.notificationMessage}
            type={this.state.notificationType}
            onClose={this.hideNotification}
          />
        )}
      </div>
    );
  }
}

export default DomainSettings;

