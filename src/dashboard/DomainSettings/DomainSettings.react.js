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
import { initializePaddle } from '@paddle/paddle-js';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Label from 'components/Label/Label.react';
import Field from 'components/Field/Field.react';
import TextInput from 'components/TextInput/TextInput.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import B4aNotification from 'dashboard/Data/Browser/B4aNotification.react';

@withRouter
class DomainSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Domain Settings';
    this.state = {
      isOwner: false,
      isLoading: true,
      domainSettings: null,
      domainSettingsError: null,
      openCheckout: false,

      // Domain form states from customDomain.service.js
      isActivated: false,
      buttonMessage: 'Loading...',
      subdomainName: '',
      showForm: false,
      updating: false,
      errorMessage: null,
      customDomain: '',
      customDomainArray: [],
      isNew: false,
      availableDomains: ['b4a.app'],
      currentDomain: 'b4a.app',
      currentSubdomain: '',
      currentWebhost: '', // Stores the current webhost value,
      canChangeCustomDomain: false,

      // Notification states
      showNotification: false,
      notificationMessage: '',
      notificationType: 'success',
    };
    this.onRefresh = this.onRefresh.bind(this);

    // host settings handlers
    this.handleSubdomainChange = this.handleSubdomainChange.bind(this);
    this.handleCustomDomainChange = this.handleCustomDomainChange.bind(this);
    this.handleUpdateHostSettings = this.handleUpdateHostSettings.bind(this);

    // custom domain handlers
    this.handleAddCustomDomain = this.handleAddCustomDomain.bind(this);
    this.handleRemoveCustomDomain = this.handleRemoveCustomDomain.bind(this);

    // notification handlers
    this.showNotification = this.showNotification.bind(this);
    this.hideNotification = this.hideNotification.bind(this);
  }

  componentWillMount() {
    this.loadData();
    this.setState({ isOwner: this.context.custom.isOwner });
  }

  componentDidUnmount() {
    this.setState({ openCheckout: false });
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
    this.loadData();
  }

  loadData() {
    this.setState({ isLoading: true });
    this.context.getCustomDomain().then(data => {
      this.setState({ isLoading: false, domainSettings: data });

      // Load domain settings from the service logic
      this.loadHostSettings(data);
    }).catch(err => this.setState({ domainSettingsError: err }));

  }

  // Load host settings logic from customDomain.service.js
  loadHostSettings(app) {
    let customDomainArray = [];

    if (app.domains && app.domains.length > 0) {
      customDomainArray = app.domains;
    }

    const appDetails = app.hostSettings;
    let subdomainName = '';
    let currentWebhost = '';
    let currentSubdomain = '';
    let showForm = false;
    let isActivated = false;
    const availableDomains = ['b4a.app'];
    const currentDomain = 'b4a.app';

    if (app && appDetails.webhost) {
      const subDomainName = appDetails.webhost;
      currentWebhost = appDetails.webhost;
      currentSubdomain = subDomainName;
      subdomainName = subDomainName.replace(/\.(b4a|back4app|b4a|b4app)\.(app|io)$/, '');
      this.listAvailableDomains(subDomainName);
      showForm = true;
      isActivated = showForm && subDomainName ? true : false;
    } else {
      const appName = appDetails.appName;
      subdomainName = appName.replace(/[^A-Z0-9]+/ig, '').toLowerCase();
      // If no current domain, still show the form but with default values
    }

    this.setState({
      customDomainArray,
      subdomainName,
      currentWebhost,
      currentSubdomain,
      showForm,
      isActivated,
      availableDomains,
      currentDomain,
      buttonMessage: 'SAVE',
      canChangeCustomDomain: app.canChangeCustomDomain
    });
  }

  // List available domains logic
  listAvailableDomains(appDomain) {
    const domain = appDomain.substring(appDomain.lastIndexOf('.', appDomain.lastIndexOf('.') - 1) + 1);
    this.setState(prevState => {
      const availableDomains = [...prevState.availableDomains];
      if (availableDomains.indexOf(domain) === -1) {
        availableDomains.push(domain);
      }
      return {
        availableDomains,
        currentDomain: domain
      };
    });
  }

  // Handle subdomain change
  handleSubdomainChange(value) {
    const domain = value + '.' + this.state.currentDomain;
    const isNew = this.state.isActivated && domain === this.state.currentSubdomain;

    this.setState({
      subdomainName: value,
      isNew
    });
  }

  // Handle domain change
  handleDomainChange(value) {
    this.setState({
      currentDomain: value
    });
  }

  // Handle custom domain change
  handleCustomDomainChange(value) {
    this.setState({
      customDomain: value,
      arrayMessage: ''
    });
  }

  // Update host settings
  handleUpdateHostSettings() {
    if (!this.state.updating) {
      this.setState({
        updating: true,
        buttonMessage: 'Saving...'
      });

      const subdomainName = this.state.subdomainName.toLowerCase();
      const subdomainFull = subdomainName + '.' + this.state.currentDomain;

      // Call the API to update host settings
      this.context.updateHostAddress(
        {
          currentSubdomain: this.state.currentWebhost,
          subdomainName: subdomainFull,
          activated: this.state.showForm
        }
              ).then(() => {
          this.setState({
            buttonMessage: 'SAVE',
            updating: false
          });
          // Send track event if available
          amplitudeLogEvent('Web Hosting Configured');
          this.showNotification('Domain settings updated successfully!', 'success');
        }).catch(error => {
          this.setState({
            buttonMessage: 'SAVE',
            updating: false,
            errorMessage: error.message
          });
          this.showNotification('Failed to update domain settings. Please try again.', 'error');
        });
    }
  }

  // Add custom domain
  handleAddCustomDomain() {
    if (!this.state.customDomainArray.find(domain => domain === this.state.customDomain)) {
      this.setState({ updating: true });

              this.context.postCustomDomain({
          domain: this.state.customDomain
        }).then(() => {
          this.setState(prevState => ({
            customDomainArray: [...prevState.customDomainArray, this.state.customDomain],
            customDomain: '',
            updating: false
          }));

          // Send track event if available
          if (window.back4AppNavigation && window.back4AppNavigation.customDomainConfiguredEvent) {
            window.back4AppNavigation.customDomainConfiguredEvent();
          }
          this.showNotification('Custom domain added successfully!', 'success');
        }).catch(error => {
          this.setState({
            updating: false,
            arrayMessage: error.message
          });
          this.showNotification('Failed to add custom domain. Please try again.', 'error');
        });
    }
  }

  // Remove custom domain
  handleRemoveCustomDomain(customDomain) {
    this.setState({ updating: true });

    this.context.removeCustomDomain({
      domain: customDomain
    }).then(() => {
      this.setState(prevState => ({
        customDomainArray: prevState.customDomainArray.filter(domain => domain !== customDomain),
        updating: false
      }));
    }).catch(error => {
      this.setState({
        updating: false,
        errorMessage: error.message
      });
    });
  }

  // Show notification
  showNotification(message, type = 'success') {
    this.setState({
      showNotification: true,
      notificationMessage: message,
      notificationType: type
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  // Hide notification
  hideNotification() {
    this.setState({
      showNotification: false,
      notificationMessage: '',
      notificationType: 'success'
    });
  }

  // Select alert class
  selectClass(alert) {
    this.setState({
      alertWarning: false,
      alertSuccess: false,
      alertDanger: false,
      [alert === 'warning' ? 'alertWarning' : alert === 'success' ? 'alertSuccess' : 'alertDanger']: true
    });
  }

  loadPaddle() {
    const paddleOptions = {
      token: b4aSettings.PADDLE_TOKEN || 'test_0270ab179b4f4abd7aa228c7014',
      environment: process.env.SENTRY_ENV === 'production' ? 'production' : 'sandbox',
      pwCustomer: {}
    }

    const paddleEventCallback = async function (data) {
      if (data.name === 'checkout.completed') {
        const paymentData = {
          appId: data.data.custom_data.app_id,
          customerId: data.data.customer.id,
          planName: data.data.items[0].product.name,
          transactionId: data.data.transaction_id,
          checkoutId: data.data.id,
          results: data.data,
          planId: data.data.custom_data.plan_id,
          email: data.data.customer.email,
        };

        // confirm its value in homolog
        await fetch(`${b4aSettings.BACK4APP_CHECKOUT_URL}/save-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        // Amplitude event for successful checkout
        try {
          const amplitudePayload = {
            api_key: b4aSettings.BACK4APP_AMPLITUDE_KEY,
            events: [
              {
                user_id: paymentData.email || 'unknown',
                event_type: 'At Checkout - Subscription Successful',
                time: Date.now(),
                event_properties: {
                  appId: paymentData.appId,
                  planName: paymentData.planName,
                  planType: data.data.items[0].billing_cycle.interval,
                  subscriptionTotal: data.data.totals.total,
                }
              }
            ]
          };
          await fetch('https://api.amplitude.com/2/httpapi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(amplitudePayload)
          });
        } catch (error) {
          console.log('Amplitude error (checkout.completed):', error);
        }
      }
      if (data.name === 'checkout.closed') {
        window.location.href = `${b4aSettings.BACKEND_DASHBOARD_PATH}/apps/${this.context.appId}/plan-usage`;
      }
    }

    initializePaddle({ ...paddleOptions, eventCallback: paddleEventCallback }).then(
      (paddleInstance) => {
        if (paddleInstance) {
          this.setState({ paddle: paddleInstance });
        }
      },
    );
  }

  renderToolbar() {
    return (
      <Toolbar section="App Settings" subsection="Domain Settings">
        {/* <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a> */}
      </Toolbar>
    );
  }

  getDisplayContent() {
    const verification = AccountManager.currentUser().verification;
    const subHeading = 'You can use this section to enable a subdomain to host your pages and create your own custom domain.'
    let content = null;

    if (!verification.emailVerified || !verification.phoneNumberVerified || !verification.cardValidation) {
      content = <Fieldset
        description="You must verify your account to activate your web hosting."
      >
        {!verification.emailVerified && <>
          <Field
            label={<Label text="Verify your email" dark={true} description="You must verify your email to activate your web hosting." />}
            input={
              <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
                <Button 
                  additionalStyles={{ background: '#f9f9f9', color: '#000', border: 'none' }} 
                  width="auto" 
                  value="Resend Email" 
                  onClick={() => {
                    this.context.resendEmailVerification()
                      .then(() => {
                        this.showNotification('Verification email sent successfully!', 'success');
                      })
                      .catch((error) => {
                        this.showNotification('Failed to send verification email. Please try again.', 'error');
                      });
                  }} 
                />
              </div>
            }
            theme={Field.Theme.BLUE}
          /> <hr className={styles.fieldHr} /></>}

        {!verification.phoneNumberVerified && <>
          <Field
            label={<Label text="Verify your phone number" dark={true} description="You must verify your phone number to activate your web hosting." />}
            input={
              <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
                <Button 
                  additionalStyles={{ background: '#f9f9f9', color: '#000', border: 'none' }} 
                  width="auto" 
                  value={
                    <a href="/phone-number/confirm">Confirm Number</a>
                  } 
                  onClick={() => {
                    this.showNotification('Redirecting to phone number confirmation...', 'info');
                  }}
                />
              </div>
            }
            theme={Field.Theme.BLUE}
          /> <hr className={styles.fieldHr} /></>}

        {!verification.cardValidation && <Field
          label={<Label text="Verify your card" dark={true} description="You must verify your card to activate your web hosting." />}
          input={<div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
            <Button 
              additionalStyles={{ background: '#f9f9f9', color: '#000', border: 'none' }} 
              width="auto" 
              value={
                <a href="https://checkout.back4app.io/subscription/0EeFjudf6H">Validate Card</a>
              } 
              onClick={() => {
                this.showNotification('Redirecting to card validation...', 'info');
              }}
            />
          </div>}
          theme={Field.Theme.BLUE}
        />
        }
      </Fieldset>
    } else {
      // Domain form content when user is verified
      content = (
        <Fieldset description="Configure your web hosting domain settings.">
          <Field
            label={<Label text="Activate Web Hosting" dark={true} description="Toggle to enable or disable web hosting for your app." />}
            input={
              <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
                <B4aToggle
                  value={this.state.showForm}
                  onChange={value => this.setState({ showForm: value })}
                  type={B4aToggle.Types.YES_NO}
                />
              </div>
            }
            theme={Field.Theme.BLUE}
          />

          {/* Domain Form - Show/Hide based on activation */}
          {this.state.showForm && (
            <>
              <Field
                label={<Label text="Subdomain Name" dark={true} description="Enter your subdomain name and select domain" />}
                input={
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                  }}>
                    <TextInput
                      value={this.state.subdomainName}
                      onChange={this.handleSubdomainChange}
                      placeholder="yourapp"
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
                    <select
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
                    </select>
                    <Button
                      value={this.state.buttonMessage}
                      onClick={this.handleUpdateHostSettings}
                      disabled={this.state.updating || !this.state.subdomainName}
                      additionalStyles={{
                        background: 'transparent',
                        border: '1px solid #4CAF50',
                        color: '#4CAF50',
                        borderRadius: '4px',
                        padding: '0.5rem 1rem',
                        fontSize: '14px',
                        minWidth: '80px'
                      }}
                    />
                  </div>
                }
                theme={Field.Theme.BLUE}
              />

              {/* Custom Domains Section */}
              <div style={{ marginTop: '2rem' }}>
                {!this.state.canChangeCustomDomain && (
                  // Upgrade Plan Section
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.5rem' }}>Custom Domain</h4>
                    <div style={{
                      color: '#fff',
                      marginBottom: '0.5rem',
                      fontSize: '14px'
                    }}>
                      Upgrade to <strong>Pay as You Go Plan</strong> to add your custom domain.
                    </div>
                    <Button
                      value="Upgrade Plan"
                      primary={true}
                      onClick={() => {
                        // Handle upgrade plan click
                        amplitudeLogEvent('Upgrade Plan Clicked - Custom Domain');
                      }}
                      additionalStyles={{
                        background: '#4CAF50',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    />
                  </div>
                )}
                <>
                  <h4>Custom Domains</h4>
                  <Field
                    label={<Label text="Add Custom Domain" dark={true} description="Add your own custom domain (e.g., myapp.com)" />}
                    input={
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 1rem', width: '100%' }}>
                        <TextInput
                          value={this.state.customDomain}
                          onChange={this.handleCustomDomainChange}
                          placeholder="Enter custom domain"
                          disabled={this.state.updating}
                          style={{ flex: 1 }}
                        />
                        <Button
                          primary
                          value="Add"
                          onClick={this.handleAddCustomDomain}
                          disabled={this.state.updating || !this.state.customDomain || !this.state.canChangeCustomDomain}
                        />
                      </div>
                    }
                    theme={Field.Theme.BLUE}
                  />
                  <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '1rem' }}>Note: To set up a custom domain, you'll first need to create a b4a.app subdomain (e.g. myapp.b4a.app). After that, create a CNAME DNS entry in your DNS provider. (myapp.mydomain.com -> myapp.b4a.app)</div>
                  <hr className={styles.fieldHr} />

                  {/* Custom Domains List */}
                  {this.state.customDomainArray.length > 0 && (
                    <Field
                      label={<Label text="Current Custom Domains" dark={true} />}
                      input={
                        <div style={{ width: '100%', paddingTop: '0.5rem' }}>
                          {this.state.customDomainArray.map((domain, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '14px',
                              padding: '0.5rem 1rem',
                              borderBottom: index === this.state.customDomainArray.length - 1 ? 'none' : '1px solid #1c293d59',
                            }}>
                              <span>{domain}</span>
                              <Button
                                color="red"
                                value="-"
                                onClick={() => this.handleRemoveCustomDomain(domain)}
                                disabled={this.state.updating}
                              />
                            </div>
                          ))}
                        </div>
                      }
                      theme={Field.Theme.BLUE}
                    />
                  )}

                  {/* Error Messages */}
                  {this.state.errorMessage && (
                    <div style={{ color: '#ff4444', marginTop: '1rem' }}>
                      {this.state.errorMessage}
                    </div>
                  )}
                  {this.state.arrayMessage && (
                    <div style={{ color: '#ff4444', marginTop: '1rem' }}>
                      {this.state.arrayMessage}
                    </div>
                  )}
                </>
              </div>
            </>
          )}
        </Fieldset>
      );
    }

    return (
      <div className={styles.domainSettingsContainer}>
        <div className={styles.heading}>Web Hosting</div>
        <div className={styles.subheading}>
          {subHeading}
        </div>
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
    }  else {
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

        {this.state.openCheckout ? (
          <B4aModal
            type={B4aModal.Types.INFO}
            width={'80vw'}
            customFooter={<div></div>}
            onCancel={() => this.setState({ openCheckout: false })}
          >
            <div className="checkout-container"></div>
          </B4aModal>
        ) : null}
      </div>
    );
  }
}

export default DomainSettings;

