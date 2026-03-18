/* eslint-disable indent, react/jsx-indent */
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { withRouter } from 'lib/withRouter';
import DashboardView from 'dashboard/DashboardView.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import FlowView from 'components/FlowView/FlowView.react';
import layoutStyles from '../CustomParseOptions/CustomParseOptions.scss';
import fbStyles from './SocialAuth.scss';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';

import Label from 'components/Label/Label.react';
import Field from 'components/Field/Field.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import FieldSettings from 'components/FieldSettings/FieldSettings.react';
import BaseLabelSettings from 'components/LabelSettings/LabelSettings.react';
import TextInputSettings from 'components/TextInputSettings/TextInputSettings.react';
import Icon from 'components/Icon/Icon.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {return false;}
  if (a.length !== b.length) {return false;}
  return a.every((v, i) => v === b[i]);
}

function renderOauthFooterChanges(changes, initialFields) {
  if (!changes || !changes.oauth) {return null;}

  const current = changes.oauth;
  const initial = (initialFields && initialFields.oauth) || {};
  const descriptions = [];

  const curApple = current.apple || {};
  const initApple = initial.apple || {};
  if ((curApple.enabled ?? false) !== (initApple.enabled ?? false)) {
    descriptions.push(curApple.enabled ? 'enabled Apple Login' : 'disabled Apple Login');
  }
  if ((curApple.client_id || '') !== (initApple.client_id || '')) {
    descriptions.push(
      initApple.client_id
        ? 'changed Apple Login Bundle ID'
        : 'added Apple Login Bundle ID'
    );
  }

  const curFb = current.facebook || {};
  const initFb = initial.facebook || {};
  if ((curFb.enabled ?? false) !== (initFb.enabled ?? false)) {
    descriptions.push(curFb.enabled ? 'enabled Facebook Login' : 'disabled Facebook Login');
  }
  const curFbIds = (curFb.appIds) || [];
  const initFbIds = (initFb.appIds) || [];
  if (!arraysEqual(curFbIds, initFbIds)) {
    const added = curFbIds.filter(id => !initFbIds.includes(id));
    const removed = initFbIds.filter(id => !curFbIds.includes(id));
    if (added.length && removed.length) {
      descriptions.push('updated Facebook Login App IDs');
    } else if (added.length) {
      descriptions.push('added Facebook Login App ID' + (added.length > 1 ? 's' : ''));
    } else if (removed.length) {
      descriptions.push('removed Facebook Login App ID' + (removed.length > 1 ? 's' : ''));
    }
  }

  const curTw = current.twitter || {};
  const initTw = initial.twitter || {};
  if ((curTw.enabled ?? false) !== (initTw.enabled ?? false)) {
    descriptions.push(curTw.enabled ? 'enabled Twitter Login' : 'disabled Twitter Login');
  }
  const twChanges = [];
  if ((curTw.consumer_key || '') !== (initTw.consumer_key || '')) {twChanges.push('Consumer Key');}
  if ((curTw.consumer_secret || '') !== (initTw.consumer_secret || '')) {twChanges.push('Consumer Secret');}
  if (twChanges.length) {
    const verb = twChanges.some(k => initTw[k === 'Consumer Key' ? 'consumer_key' : 'consumer_secret'])
      ? 'changed' : 'added';
    descriptions.push(`${verb} Twitter Login ${twChanges.join(' and ')}`);
  }

  const curVk = current.vkontakte || {};
  const initVk = initial.vkontakte || {};
  if ((curVk.enabled ?? false) !== (initVk.enabled ?? false)) {
    descriptions.push(curVk.enabled ? 'enabled VKontakte Login' : 'disabled VKontakte Login');
  }
  const vkChanges = [];
  if ((curVk.appIds || '') !== (initVk.appIds || '')) {vkChanges.push('Application Id');}
  if ((curVk.appSecret || '') !== (initVk.appSecret || '')) {vkChanges.push('Application Secret');}
  if (vkChanges.length) {
    const verb = vkChanges.some(k => initVk[k === 'Application Id' ? 'appIds' : 'appSecret'])
      ? 'changed' : 'added';
    descriptions.push(`${verb} VKontakte Login ${vkChanges.join(' and ')}`);
  }

  if (descriptions.length === 0) {return null;}

  const last = descriptions.length > 1 ? descriptions.pop() : null;
  const text = last
    ? descriptions.join(', ') + ' and ' + last
    : descriptions[0];

  return (
    <span>You've <strong>{text}</strong>.</span>
  );
}

@withRouter
class SocialAuth extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Authentication';
    this.state = {
      isLoading: true,
      loadingError: null,
      initialFields: { oauth: {} },
      fbAppIdInput: '',
      fbAppIdError: null,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    try {
      const result = await this.context.getOauth();
      const oauth = (result && result.oauth) || {};
      if (oauth.apple) {
        oauth.apple.enabled = !!oauth.apple.client_id;
      }
      if (oauth.facebook) {
        oauth.facebook.enabled = Array.isArray(oauth.facebook.appIds) && oauth.facebook.appIds.length > 0;
      }
      if (oauth.twitter) {
        oauth.twitter.enabled = !!(oauth.twitter.consumer_key || oauth.twitter.consumer_secret);
      }
      if (oauth.vkontakte) {
        oauth.vkontakte.enabled = !!(oauth.vkontakte.appIds || oauth.vkontakte.appSecret);
      }
      this.setState({
        initialFields: { oauth: JSON.parse(JSON.stringify(oauth)) },
      });
    } catch (e) {
      const errText =
        (e && e.message) ||
        (e && e.error && (typeof e.error === 'string' ? e.error : e.error.message)) ||
        String(e);
      this.setState({ loadingError: errText });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  renderToolbar() {
    return (
      <Toolbar section='App Settings' subsection='Authentication'>
      </Toolbar>
    );
  }

  handleFbAddAppId(oauth, setField) {
    const input = (this.state.fbAppIdInput || '').trim();
    if (!input) {
      return;
    }
    const appIds = oauth.facebook?.appIds || [];
    if (appIds.includes(input)) {
      this.setState({ fbAppIdError: 'This appId is already included' });
      return;
    }
    const next = JSON.parse(JSON.stringify(oauth));
    next.facebook = next.facebook || {};
    next.facebook.appIds = [...appIds, input];
    setField('oauth', next);
    this.setState({ fbAppIdInput: '', fbAppIdError: null });
  }

  renderOauthForm({ fields, setField }) {
    const oauth = fields.oauth || {};

    const setProviderField = (provider, key, value) => {
      const next = JSON.parse(JSON.stringify(oauth));
      if (!next[provider]) {
        next[provider] = {};
      }
      next[provider][key] = value;
      setField('oauth', next);
    };

    const apple = oauth.apple || {};
    const appleEnabled = apple.enabled ?? false;
    const facebook = oauth.facebook || {};
    const facebookEnabled = facebook.enabled ?? false;
    const facebookAppIds = facebook.appIds || [];
    const twitter = oauth.twitter || {};
    const twitterEnabled = twitter.enabled ?? false;
    const vkontakte = oauth.vkontakte || {};
    const vkontakteEnabled = vkontakte.enabled ?? false;

    return (
      <div className={fbStyles.socialAuthFormWrapper}>
        <div className={layoutStyles.domainSettingsContainer}>
          <div className={layoutStyles.heading}>OAuth Provider Configuration</div>
          <div className={layoutStyles.subheading}>Configure OAuth authentication providers for your Parse Server application.</div>

          <Fieldset
            legend='Apple Login'
            description='Configure Apple Sign-In with your Bundle ID.'
          >
            <Field
              label={
                <Label
                  text='Apple Login'
                  description='Configure Apple authentication'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none', borderBottom: appleEnabled ? undefined : 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    // label={<BaseLabelSettings text='Enabled' description='Enable Apple Sign-In authentication' />}
                    input={
                      <B4aToggle
                        type={B4aToggle.Types.YES_NO}
                        value={appleEnabled}
                        onChange={(val) => setProviderField('apple', 'enabled', val)}
                        additionalStyles={{ margin: '0', marginRight: '16px' }}
                      />
                    }
                  />
                  {appleEnabled && (
                    <FieldSettings
                      containerStyles={{ borderBottom: 'none' }}
                      padding={'16px 0px'}
                      labelWidth={'50%'}
                      label={<BaseLabelSettings text='Bundle ID' description='Apple client_id (Bundle Identifier)' />}
                      input={
                        <TextInputSettings
                          placeholder='Bundle ID'
                          value={apple.client_id ?? ''}
                          onChange={({ target: { value } }) =>
                            setProviderField('apple', 'client_id', value)
                          }
                        />
                      }
                    />
                  )}
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

          <hr className={layoutStyles.fieldHr} />

          <Fieldset
            legend='Facebook Login'
            description='Manage Facebook App IDs for authentication.'
          >
            <Field
              label={
                <Label
                  text='Facebook Login'
                  description='Configure Facebook authentication'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none', borderBottom: facebookEnabled ? undefined : 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    // label={<BaseLabelSettings text='Enabled' description='Enable Facebook authentication' />}
                    input={
                      <B4aToggle
                        type={B4aToggle.Types.YES_NO}
                        value={facebookEnabled}
                        onChange={(val) => setProviderField('facebook', 'enabled', val)}
                        additionalStyles={{ margin: '0', marginRight: '16px' }}
                      />
                    }
                  />
                  {facebookEnabled && (
                    <>
                      <FieldSettings
                        padding={'16px 0px'}
                        labelWidth={'50%'}
                        label={<BaseLabelSettings text='Facebook appId' description='Add Facebook App IDs for OAuth' />}
                        input={
                          <div className={fbStyles.fbInputRow}>
                            <input
                              className={fbStyles.fbInput}
                              type='text'
                              placeholder='Enter to add'
                              value={this.state.fbAppIdInput}
                              onChange={({ target: { value } }) =>
                                this.setState({ fbAppIdInput: value, fbAppIdError: null })
                              }
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  this.handleFbAddAppId(oauth, setField);
                                }
                              }}
                            />
                            <button
                              className={fbStyles.fbAddBtn}
                              onClick={() => this.handleFbAddAppId(oauth, setField)}
                            >+</button>
                          </div>
                        }
                      />
                      {this.state.fbAppIdError && (
                        <div className={fbStyles.fieldError}>{this.state.fbAppIdError}</div>
                      )}
                      {facebookAppIds.length > 0 && (
                        <FieldSettings
                          containerStyles={{ borderBottom: 'none' }}
                          padding={'16px 0px'}
                          labelWidth={'50%'}
                          label={<BaseLabelSettings text="Facebook appId's added" />}
                          input={
                            <div className={fbStyles.fbAppIdList}>
                              {facebookAppIds.map(appId => (
                                <div key={appId} className={fbStyles.fbAppIdRow}>
                                  <span className={fbStyles.fbAppIdText}>{appId}</span>
                                  <button
                                    className={fbStyles.fbRemoveBtn}
                                    onClick={() => {
                                      const next = JSON.parse(JSON.stringify(oauth));
                                      next.facebook = next.facebook || {};
                                      next.facebook.appIds = (next.facebook.appIds || []).filter(id => id !== appId);
                                      setField('oauth', next);
                                    }}
                                    title="Remove"
                                  >
                                    <Icon name="b4a-delete-icon" fill="#E85C3E" width={16} height={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

          <hr className={layoutStyles.fieldHr} />

          <Fieldset
            legend='Twitter Login'
            description='Configure Twitter OAuth credentials.'
          >
            <Field
              label={
                <Label
                  text='Twitter Login'
                  description='Configure Twitter authentication'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none', borderBottom: twitterEnabled ? undefined : 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    // label={<BaseLabelSettings text='Enabled' description='Enable Twitter authentication' />}
                    input={
                      <B4aToggle
                        type={B4aToggle.Types.YES_NO}
                        value={twitterEnabled}
                        onChange={(val) => setProviderField('twitter', 'enabled', val)}
                        additionalStyles={{ margin: '0', marginRight: '16px' }}
                      />
                    }
                  />
                  {twitterEnabled && (
                    <>
                      <FieldSettings
                        padding={'16px 0px'}
                        labelWidth={'50%'}
                        label={<BaseLabelSettings text='Consumer Key' description='Twitter OAuth consumer key' />}
                        input={
                          <TextInputSettings
                            placeholder='consumerKey'
                            value={twitter.consumer_key ?? ''}
                            onChange={({ target: { value } }) =>
                              setProviderField('twitter', 'consumer_key', value)
                            }
                          />
                        }
                      />
                      <FieldSettings
                        containerStyles={{ borderBottom: 'none' }}
                        padding={'16px 0px'}
                        labelWidth={'50%'}
                        label={<BaseLabelSettings text='Consumer Secret' description='Twitter OAuth consumer secret' />}
                        input={
                          <TextInputSettings
                            placeholder='consumerSecret'
                            value={twitter.consumer_secret ?? ''}
                            onChange={({ target: { value } }) =>
                              setProviderField('twitter', 'consumer_secret', value)
                            }
                          />
                        }
                      />
                    </>
                  )}
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

          <hr className={layoutStyles.fieldHr} />

          <Fieldset
            legend='VKontakte Login'
            description='Configure VKontakte authentication credentials.'
          >
            <Field
              label={
                <Label
                  text='VKontakte Login'
                  description='Configure VKontakte authentication'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none', borderBottom: vkontakteEnabled ? undefined : 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    // label={<BaseLabelSettings text='Enabled' description='Enable VKontakte authentication' />}
                    input={
                      <B4aToggle
                        type={B4aToggle.Types.YES_NO}
                        value={vkontakteEnabled}
                        onChange={(val) => setProviderField('vkontakte', 'enabled', val)}
                        additionalStyles={{ margin: '0', marginRight: '16px' }}
                      />
                    }
                  />
                  {vkontakteEnabled && (
                    <>
                      <FieldSettings
                        padding={'16px 0px'}
                        labelWidth={'50%'}
                        label={<BaseLabelSettings text='Application Id' description='VKontakte application ID' />}
                        input={
                          <TextInputSettings
                            placeholder='appId'
                            value={vkontakte.appIds ?? ''}
                            onChange={({ target: { value } }) =>
                              setProviderField('vkontakte', 'appIds', value)
                            }
                          />
                        }
                      />
                      <FieldSettings
                        containerStyles={{ borderBottom: 'none' }}
                        padding={'16px 0px'}
                        labelWidth={'50%'}
                        label={<BaseLabelSettings text='Application Secret' description='VKontakte application secret' />}
                        input={
                          <TextInputSettings
                            placeholder='AppSecret'
                            value={vkontakte.appSecret ?? ''}
                            onChange={({ target: { value } }) =>
                              setProviderField('vkontakte', 'appSecret', value)
                            }
                          />
                        }
                      />
                    </>
                  )}
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

        </div>
      </div>
    );
  }

  renderContent() {
    const toolbar = this.renderToolbar();
    const loading = this.state.isLoading;
    const initialFields = this.state.initialFields || { oauth: {} };

    let content = null;
    if (loading) {
      content = null;
    } else if (this.state.loadingError) {
      content = <div style={{ marginTop: '3rem' }}><EmptyGhostState
        title='Failed to load OAuth settings'
        description={this.state.loadingError}
        cta='Retry'
        action={() => {
          this.setState({ isLoading: true, loadingError: null });
          this.loadData();
        }}
      /></div>
    } else {
      content = (
        <div className={layoutStyles.mainContent}>
          <FlowView
            initialFields={initialFields}
            footerContents={({ changes }) =>
              renderOauthFooterChanges(changes, initialFields)
            }
            onSubmit={({ fields }) => {
              const oauth = fields.oauth || {};
              const payload = {};
              const validationErrors = [];

              for (const [provider, config] of Object.entries(oauth)) {
                if (!config || config.enabled === false) {
                  continue;
                }
                const rest = Object.assign({}, config);
                delete rest.enabled;

                switch (provider) {
                  case 'apple':
                    if (!rest.client_id || !rest.client_id.trim()) {
                      validationErrors.push('Apple Login requires a Bundle ID');
                    }
                    break;
                  case 'facebook':
                    if (!Array.isArray(rest.appIds) || rest.appIds.length === 0) {
                      validationErrors.push('Facebook Login requires at least one App ID');
                    }
                    break;
                  case 'twitter':
                    if (!rest.consumer_key || !rest.consumer_key.trim()) {
                      validationErrors.push('Twitter Login requires a Consumer Key');
                    }
                    if (!rest.consumer_secret || !rest.consumer_secret.trim()) {
                      validationErrors.push('Twitter Login requires a Consumer Secret');
                    }
                    break;
                  case 'vkontakte':
                    if (!rest.appIds || !String(rest.appIds).trim()) {
                      validationErrors.push('VKontakte Login requires an Application Id');
                    }
                    if (!rest.appSecret || !rest.appSecret.trim()) {
                      validationErrors.push('VKontakte Login requires an Application Secret');
                    }
                    break;
                }

                payload[provider] = rest;
              }

              if (validationErrors.length > 0) {
                return Promise.reject({ error: validationErrors[0] });
              }

              return this.context.updateOauth(payload);
            }}
            afterSave={({ resetFields }) => {
              this.loadData();
              setTimeout(() => resetFields(), 1200);
            }}
            validate={() => null}
            renderForm={this.renderOauthForm.bind(this)}
          />
        </div>
      );
    }

    return (
      <div>
        <B4aLoaderContainer loading={loading}>
          <div className={layoutStyles.content}>
            {content}
          </div>
        </B4aLoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default SocialAuth;
