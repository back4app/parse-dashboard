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
import FlowView from 'components/FlowView/FlowView.react';
import styles from './ServerURLLiveQuery.scss';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import Button from 'components/Button/Button.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';
import Label from 'components/Label/Label.react';
import Field from 'components/Field/Field.react';
import TextInput from 'components/TextInput/TextInput.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import renderFlowFooterChanges from 'lib/renderFlowFooterChanges';

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

const FOOTER_FIELD_OPTIONS = {
  activated: { friendlyName: 'Back4App subdomain', type: 'boolean' },
  subdomainName: { friendlyName: 'subdomain name', showTo: true },
  currentDomain: { friendlyName: 'domain', showTo: true },
  statusLiveQuery: { friendlyName: 'Live Query', type: 'boolean' },
  schemasChoose: { friendlyName: 'Live Query classes' },
};

@withRouter
class ServerURLLiveQuery extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Server URL & Live Query';
    this.state = {
      isLoading: true,
      loadingError: null,

      isUserVerified: false,
      hasPermission: true,

      isActivated: false,
      currentSubdomain: '',
      availableDomains: ['b4a.io'],
      schema: [],
      activatedLiveQuery: {},

      initialFields: {
        activated: false,
        subdomainName: '',
        currentDomain: 'b4a.io',
        statusLiveQuery: false,
        schemasChoose: {},
      },

      modal: null,
    };

    this._flowViewRef = React.createRef();
    this.unblock = null;
    this._onBeforeUnload = null;
  }

  _hasUnsavedChanges() {
    if (this._flowViewRef.current) {
      const { changes, saveState } = this._flowViewRef.current.state;
      return Object.keys(changes || {}).length > 0 && saveState !== 'SAVING';
    }
    return false;
  }

  componentDidMount() {
    super.componentDidMount();
    this.loadData();

    this._onBeforeUnload = (e) => {
      if (this._hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', this._onBeforeUnload);

    if (this.props.navigator && typeof this.props.navigator.block === 'function') {
      this.unblock = this.props.navigator.block(tx => {
        if (this._hasUnsavedChanges()) {
          const unblock = this.unblock && this.unblock.bind(this);
          const autoUnblockingTx = {
            ...tx,
            retry() {
              if (unblock) {
                unblock();
              }
              tx.retry();
            },
          };

          const modal = (
            <B4aModal
              type={B4aModal.Types.DEFAULT}
              showCancel={false}
              width={380}
              icon="b4a-warn-fill-icon"
              iconSize={44}
              iconFill="#cccccc"
              title="Leave this page?"
              subtitle="Changes you made may not be saved."
              customFooter={
                <div style={{ textAlign: 'center' }}>
                  <Button
                    color="white"
                    width="auto"
                    additionalStyles={{ border: '1px solid #ccc', color: '#303338', marginRight: 12 }}
                    value="Cancel"
                    onClick={() => this.setState({ modal: null })}
                  />
                  <Button
                    primary={true}
                    color="blue"
                    width="auto"
                    value="Leave"
                    onClick={() => {
                      this.setState({ modal: null });
                      autoUnblockingTx.retry();
                    }}
                  />
                </div>
              }
            />
          );
          this.setState({ modal });
        } else {
          if (this.unblock) {
            this.unblock();
          }
          tx.retry();
        }
      });
    }
  }

  componentWillUnmount() {
    if (this.unblock) {
      this.unblock();
    }
    window.removeEventListener('beforeunload', this._onBeforeUnload);
  }

  async loadData() {
    try {
      const response = await this.context.getWebHostForLiveQuery();
      await this.processSettings(response);
    } catch (error) {
      const message = typeof error === 'string'
        ? error
        : (error && error.message) || 'Failed to load settings';
      this.setState({ loadingError: message });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async processSettings(response) {
    const { settings, schema: rawSchema, createdAt } = response;

    const schema = Array.isArray(rawSchema)
      ? rawSchema.map(s => ({ _id: s._id }))
      : [];

    let subdomainName = '';
    let currentSubdomain = '';
    let currentDomain = 'b4a.io';
    let activated = false;
    let isActivated = false;
    let isUserVerified = false;
    const schemasChoose = {};
    let activatedLiveQuery = {};
    let statusLiveQuery = false;

    if (settings.subdomain) {
      const subDomainName = settings.subdomain;
      currentSubdomain = subDomainName;
      subdomainName = subDomainName.replace(/\.(b4a|back4app|b4app)\.(app|io)$/, '');
      currentDomain = this.updateAvailableDomains(subDomainName);
    } else {
      const appName = settings.appName || '';
      subdomainName = appName.replace(/[^A-Z0-9]+/ig, '').toLowerCase();
    }

    activated = !!settings.activated;
    isActivated = activated && !!settings.subdomain;

    if (settings.liveQuery) {
      activatedLiveQuery = settings.liveQuery;
      if (settings.liveQuery.statusLiveQuery) {
        statusLiveQuery = settings.liveQuery.statusLiveQuery;
      }
      if (settings.liveQuery.schemasChoose) {
        Object.assign(schemasChoose, settings.liveQuery.schemasChoose);
      }
    }

    const hasPermission = !settings.featuresPermission ||
      settings.featuresPermission.webHostLiveQuery === 'Write';

    if ((settings.activated && settings.subdomain) ||
        (createdAt && ((new Date() - new Date(createdAt)) > SIX_MONTHS_MS))) {
      isUserVerified = true;
    }

    if (!isUserVerified) {
      try {
        const plan = await this.context.getAppPlanData();
        if (plan && plan.planName &&
            plan.planName.indexOf('Free') < 0 &&
            plan.planName.indexOf('Public') < 0) {
          isUserVerified = true;
        } else {
          const currentUser = AccountManager.currentUser();
          if (currentUser && currentUser.verification && currentUser.verification.cardValidation) {
            isUserVerified = true;
          }
        }
      } catch (planError) {
        const currentUser = AccountManager.currentUser();
        if (currentUser && currentUser.verification && currentUser.verification.cardValidation) {
          isUserVerified = true;
        }
      }
    }

    this.setState({
      isUserVerified,
      hasPermission,
      isActivated,
      currentSubdomain,
      schema,
      activatedLiveQuery,
      initialFields: {
        activated,
        subdomainName,
        currentDomain,
        statusLiveQuery,
        schemasChoose,
      },
    });
  }

  updateAvailableDomains(appDomain) {
    const domain = appDomain.substring(
      appDomain.lastIndexOf('.', appDomain.lastIndexOf('.') - 1) + 1
    );
    const availableDomains = this.state.availableDomains.indexOf(domain) === -1
      ? [...this.state.availableDomains, domain]
      : this.state.availableDomains;
    this.setState({ availableDomains });
    return domain;
  }

  renderToolbar() {
    return (
      <Toolbar section="App Settings" subsection="Server URL & Live Query" />
    );
  }

  filterVisibleChanges(changes) {
    const { initialFields } = this.state;
    const filtered = { ...changes };
    const activated = changes.activated !== undefined
      ? changes.activated
      : initialFields.activated;

    if (!activated) {
      delete filtered.subdomainName;
      delete filtered.currentDomain;
      delete filtered.statusLiveQuery;
      delete filtered.schemasChoose;
    } else {
      const statusLiveQuery = changes.statusLiveQuery !== undefined
        ? changes.statusLiveQuery
        : initialFields.statusLiveQuery;
      if (!statusLiveQuery) {
        delete filtered.schemasChoose;
      }
    }
    return filtered;
  }

  renderForm({ fields, setField }) {
    const toggleClass = (classId) => {
      const schemasChoose = { ...fields.schemasChoose };
      schemasChoose[classId] = !schemasChoose[classId];
      setField('schemasChoose', schemasChoose);
    };

    return (
      <div className={styles.formWrapper}>
        <div className={styles.settingsContainer}>
          <div className={styles.heading}>Server URL and Live Query</div>
          <div className={styles.subheading}>
            In this section, you can enable a custom Server URL that can be used for real-time database.
          </div>

          <Fieldset legend="Server URL" description="Activate a Back4App subdomain for your server URL.">
            <Field
              label={
                <Label
                  text="Activate your Back4App subdomain"
                  dark={true}
                  description="Toggle to enable or disable your server URL subdomain."
                />
              }
              input={
                <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
                  <B4aToggle
                    value={fields.activated}
                    onChange={(value) => setField('activated', value)}
                    type={B4aToggle.Types.YES_NO}
                  />
                </div>
              }
              theme={Field.Theme.BLUE}
            />
            {fields.activated && (
              <Field
                label={
                  <Label
                    text="Subdomain Name"
                    dark={true}
                    description="Enter your subdomain name"
                  />
                }
                input={
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    padding: '0 1rem',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                      <TextInput
                        value={fields.subdomainName}
                        onChange={(name) => setField('subdomainName', name)}
                        placeholder="yourapp"
                      />
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'normal' }}>.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {this.state.availableDomains.length > 1 ? (
                        <select
                          value={fields.currentDomain}
                          onChange={(e) => setField('currentDomain', e.target.value)}
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
                      ) : (
                        <span style={{ display: 'inline-block', marginLeft: '0.5rem' }}>
                          {fields.currentDomain}
                        </span>
                      )}
                    </div>
                  </div>
                }
                theme={Field.Theme.BLUE}
              />
            )}
          </Fieldset>

          {fields.activated && (
            <>
              <hr className={styles.fieldHr} />
              <Fieldset legend="Live Query" description="Enable Live Query to support real-time subscriptions on selected classes.">
                <Field
                  label={
                    <Label
                      text="Activate Live Query"
                      dark={true}
                      description="Toggle to enable or disable Live Query for your app."
                    />
                  }
                  input={
                    <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
                      <B4aToggle
                        value={fields.statusLiveQuery}
                        onChange={(value) => setField('statusLiveQuery', value)}
                        type={B4aToggle.Types.YES_NO}
                      />
                    </div>
                  }
                  theme={Field.Theme.BLUE}
                />
                {fields.statusLiveQuery && this.state.schema.length > 0 && (
                  <Field
                    label={
                      <Label
                        text="Live Query Classes"
                        dark={true}
                        description="Select which classes should support Live Query subscriptions."
                      />
                    }
                    input={
                      <div className={styles.classesList}>
                        {this.state.schema.map((cls) => (
                          <div key={cls._id} className={styles.classItem}>
                            <input
                              type="checkbox"
                              checked={!!fields.schemasChoose[cls._id]}
                              onChange={() => toggleClass(cls._id)}
                            />
                            <span>{cls._id}</span>
                          </div>
                        ))}
                      </div>
                    }
                    theme={Field.Theme.BLUE}
                  />
                )}
              </Fieldset>
            </>
          )}
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
    } else if (this.state.loadingError) {
      content = (
        <div className={styles.ghostMessage}>
          <EmptyGhostState
            title="Error loading settings"
            description={this.state.loadingError}
          />
        </div>
      );
    } else if (!this.state.isUserVerified) {
      content = (
        <div className={styles.formWrapper}>
          <div className={styles.settingsContainer}>
            <div className={styles.heading}>Server URL and Live Query</div>
            <div className={styles.subheading}>
              In this section, you can enable a custom Server URL that can be used for real-time database.
            </div>
            <Fieldset>
              <Field
                label={
                  <Label
                    text="Validate your card"
                    dark={true}
                    description="In order to enable this feature, you must validate your card."
                  />
                }
                input={
                  <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
                    <a
                      href="https://checkout.back4app.io/subscription/r4bsfi5CNH"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        value="Validate Card"
                        primary={true}
                      />
                    </a>
                  </div>
                }
                theme={Field.Theme.BLUE}
              />
            </Fieldset>
          </div>
        </div>
      );
    } else {
      const { initialFields, hasPermission } = this.state;

      content = (
        <div className={styles.mainContent}>
          <FlowView
            ref={this._flowViewRef}
            initialFields={initialFields}
            showFooter={changes => Object.keys(this.filterVisibleChanges(changes)).length > 0}
            validate={() => {
              if (!hasPermission) {
                return 'use default';
              }
              return '';
            }}
            defaultFooterMessage={<span>You don&apos;t have permission to edit this feature.</span>}
            hideButtonsOnDefaultMessage={true}
            onSubmit={({ fields }) => {
              const subdomainName = fields.subdomainName
                ? fields.subdomainName.toLowerCase()
                : fields.subdomainName;

              return this.context.enableHostForLiveQuery({
                currentSubdomain: this.state.currentSubdomain,
                subdomainName: subdomainName + '.' + fields.currentDomain,
                activated: fields.activated,
              }).then(() => {
                amplitudeLogEvent('Server URL configured');

                let schemasChoose = fields.schemasChoose;
                if (!fields.statusLiveQuery) {
                  schemasChoose = {};
                }

                const hasExistingLiveQuery = this.state.activatedLiveQuery.statusLiveQuery !== undefined;
                if (fields.statusLiveQuery || hasExistingLiveQuery) {
                  return this.context.setLiveQuery({
                    statusLiveQuery: fields.statusLiveQuery,
                    schemasChoose,
                  }).then(() => amplitudeLogEvent('Live Query configured'));
                }
              }).catch(err => {
                const message = typeof err === 'string' ? err : (err && err.message) || 'An error occurred';
                throw { message };
              });
            }}
            afterSave={({ fields, resetFields }) => {
              const savedSubdomain = fields.subdomainName
                ? fields.subdomainName.toLowerCase() + '.' + fields.currentDomain
                : this.state.currentSubdomain;

              this.setState({
                currentSubdomain: fields.activated ? savedSubdomain : this.state.currentSubdomain,
                isActivated: fields.activated && !!savedSubdomain,
                activatedLiveQuery: fields.statusLiveQuery
                  ? { ...this.state.activatedLiveQuery, statusLiveQuery: fields.statusLiveQuery, schemasChoose: fields.schemasChoose }
                  : this.state.activatedLiveQuery,
                initialFields: { ...fields },
              });
              resetFields();
            }}
            footerContents={({ changes }) => {
              const visibleChanges = this.filterVisibleChanges(changes);
              return renderFlowFooterChanges(visibleChanges, initialFields, FOOTER_FIELD_OPTIONS);
            }}
            renderForm={this.renderForm.bind(this)}
          />
        </div>
      );
    }

    return (
      <div>
        <B4aLoaderContainer loading={loading}>
          <div className={styles.content}>
            {content}
          </div>
        </B4aLoaderContainer>
        {toolbar}
        {this.state.modal}
      </div>
    );
  }
}

export default ServerURLLiveQuery;
