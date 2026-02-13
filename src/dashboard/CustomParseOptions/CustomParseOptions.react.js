/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
/* eslint-disable indent, react/jsx-indent */
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { withRouter } from 'lib/withRouter';
import DashboardView from 'dashboard/DashboardView.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import FlowView from 'components/FlowView/FlowView.react';
import styles from './CustomParseOptions.scss';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';

import Label from 'components/Label/Label.react';
import Field from 'components/Field/Field.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import FieldSettings from 'components/FieldSettings/FieldSettings.react';
import LabelSettings from 'components/LabelSettings/LabelSettings.react';
import NumericInputSettings from 'components/NumericInputSettings/NumericInputSettings.react';
import TextInputSettings from 'components/TextInputSettings/TextInputSettings.react';
import Button from 'components/Button/Button.react';
import { Link } from 'react-router-dom';

import deepmerge from 'deepmerge';
import renderFlowFooterChanges from 'lib/renderFlowFooterChanges';
import CustomParseOptionsValidations from './CustomParseOptionsValidations';
import getError from 'dashboard/Settings/Util/getError';

@withRouter
class CustomParseOptions extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Parse Options';
    this.state = {
      isLoading: true,
      initialFields: {
        customOptions: {},
      },
      loadingError: null,
      canChangeCustomParseOptions: false,
    };
    this.onRefresh = this.onRefresh.bind(this);
  }

  componentWillMount() {
    this.loadData();
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
      const response = await this.context.getParseOptions();
      const { permissions = {} } = response;
      const otherConfigs = response.otherConfigs || {};
      const parseOptions = response.parseOptions || {};

      // Prefer otherConfigs for passwordPolicy/accountLockout; fall back to parseOptions for existing apps
      const passwordPolicy = otherConfigs.passwordPolicy || parseOptions.passwordPolicy;
      const accountLockout = otherConfigs.accountLockout || parseOptions.accountLockout;

      // Parse maxUploadSize: strip 'mb' suffix for the UI (e.g. "20mb" -> 20)
      const rawMaxUploadSize = otherConfigs.maxUploadSize;
      const parsedMaxUploadSize = typeof rawMaxUploadSize === 'string'
        ? parseInt(rawMaxUploadSize, 10)
        : rawMaxUploadSize;

      const customOptions = {
        ...JSON.parse(JSON.stringify(otherConfigs)),
        ...(passwordPolicy ? { passwordPolicy: JSON.parse(JSON.stringify(passwordPolicy)) } : {}),
        ...(accountLockout ? { accountLockout: JSON.parse(JSON.stringify(accountLockout)) } : {}),
        ...(parsedMaxUploadSize != null && !isNaN(parsedMaxUploadSize) ? { maxUploadSize: parsedMaxUploadSize } : {}),
      };

      this.setState({
        canChangeCustomParseOptions: permissions.canChangeCustomParseOptions !== false,
        initialFields: { customOptions },
      });
    } catch (error) {
      this.setState({ loadingError: error });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  renderToolbar() {
    return (
      <Toolbar section="App Settings" subsection="Parse Options">
        {/* <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a> */}
      </Toolbar>
    );
  }

  renderParseOptionsForm({ fields, setFieldJson, errors }) {
    const customOptions = fields.customOptions || {};
    const passwordPolicy = customOptions?.passwordPolicy || {};
    const accountLockout = customOptions?.accountLockout || {};

    const parseIntegerValue = (value) => {
      if (value === '' || value === null || value === undefined) {
        return '';
      }
      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed)) {
        return '';
      }
      return parsed;
    };
    const setNestedCustomOption = (parentKey, key, value) =>
      setFieldJson('customOptions', {
        [parentKey]: {
          [key]: value,
        },
      });
    const setCustomOption = (key, value) =>
      setFieldJson('customOptions', { [key]: value });

    return (
      <div className={styles.formWrapper}>
        <div className={styles.domainSettingsContainer}>
          <div className={styles.heading}>Custom Parse Server Options</div>
          <div className={styles.subheading}>Change your custom parse-server configuration options below.</div>
          <div className={styles.warning}>Warning: This is a <strong>DANGER ZONE</strong>. Your app can stop working if you do something wrong. If you are not sure, ask for support.</div>

          {!this.state.canChangeCustomParseOptions && (
            <Fieldset>
              <Field
                label={
                  <Label
                    text='Upgrade your plan'
                    description='Please upgrade your plan to change custom parse options.'
                    dark={true}
                  />
                }
                input={
                  <div style={{ width: '100%', padding: '0 1rem', textAlign: 'right' }}>
                    <Link to={`/apps/${this.context.slug}/plan-usage`}>
                      <Button
                        value='Upgrade Plan'
                        primary={true}
                      />
                    </Link>
                  </div>
                }
                theme={Field.Theme.BLUE}
              />
            </Fieldset>
          )}

          <div style={!this.state.canChangeCustomParseOptions ? { pointerEvents: 'none', opacity: 0.6 } : {}}>

          <Fieldset
            legend='Server Settings'
            description='Configure server-level settings for file uploads.'
          >
            <Field
              label={
                <Label
                  text='Server Settings'
                  description='Manage server settings for file handling'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.maxUploadSize')}
                    label={
                      <LabelSettings
                        text='maxUploadSize'
                        description='Maximum file upload size in MB (0-100)'
                      />
                    }
                    input={
                      <NumericInputSettings
                        min={20}
                        max={100}
                        value={customOptions?.maxUploadSize ?? ''}
                        error={getError(errors, 'customOptions.maxUploadSize')}
                        onChange={value =>
                          setCustomOption('maxUploadSize', parseIntegerValue(value))
                        }
                      />
                    }
                  />
                  <FieldSettings
                    containerStyles={{ borderBottom: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='preserveFileName'
                        description='Preserve file names when uploading files'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={customOptions?.preserveFileName}
                        onChange={value =>
                          setCustomOption('preserveFileName', value)
                        }
                      />
                    }
                  />
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

          <hr className={styles.fieldHr} />

          <Fieldset
            legend='Password Policy'
            description='Manage password policies for this app.'
          >
            <Field
              label={
                <Label
                  text='Password policy'
                  description='Manage password policies for this app'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.passwordPolicy.resetTokenValidityDuration')}
                    label={
                      <LabelSettings
                        text='Reset Token Validity Duration'
                        description='Set the validity duration of the password reset token in seconds after which the token expires.'
                      />
                    }
                    input={
                      <NumericInputSettings
                        placeholder={0}
                        min={0}
                        value={passwordPolicy?.resetTokenValidityDuration ?? ''}
                        error={getError(errors, 'customOptions.passwordPolicy.resetTokenValidityDuration')}
                        onChange={resetTokenValidityDuration =>
                          setNestedCustomOption(
                            'passwordPolicy',
                            'resetTokenValidityDuration',
                            parseIntegerValue(resetTokenValidityDuration)
                          )
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='Reset Token Reuse If Valid'
                        description='If a password reset token should be reused in case another token is requested but there is a token that is still valid.'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={passwordPolicy?.resetTokenReuseIfValid}
                        onChange={resetTokenReuseIfValid =>
                          setNestedCustomOption('passwordPolicy', 'resetTokenReuseIfValid', resetTokenReuseIfValid)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.passwordPolicy.validatorPattern')}
                    label={
                      <LabelSettings
                        text='Password Validator Pattern'
                        description='Set the regular expression validation pattern a password must match to be accepted.'
                      />
                    }
                    input={
                      <TextInputSettings
                        value={passwordPolicy?.validatorPattern}
                        error={getError(errors, 'customOptions.passwordPolicy.validatorPattern')}
                        onChange={({ target: { value } }) =>
                          setNestedCustomOption('passwordPolicy', 'validatorPattern', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.passwordPolicy.validationError')}
                    label={
                      <LabelSettings
                        text='Validation Error Message'
                        description='Set the error message to be sent for failed password validation'
                      />
                    }
                    input={
                      <TextInputSettings
                        value={passwordPolicy?.validationError}
                        error={getError(errors, 'customOptions.passwordPolicy.validationError')}
                        onChange={({ target: { value } }) =>
                          setNestedCustomOption('passwordPolicy', 'validationError', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='Do Not Allow Username'
                        description='Set to true to disallow the username as part of the password.'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={passwordPolicy?.doNotAllowUsername}
                        onChange={doNotAllowUsername =>
                          setNestedCustomOption('passwordPolicy', 'doNotAllowUsername', doNotAllowUsername)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.passwordPolicy.maxPasswordAge')}
                    label={
                      <LabelSettings
                        text='Max Password Age'
                        description='Set the number of days after which a password expires.'
                      />
                    }
                    input={
                      <NumericInputSettings
                        min={0}
                        value={passwordPolicy?.maxPasswordAge ?? ''}
                        error={getError(errors, 'customOptions.passwordPolicy.maxPasswordAge')}
                        onChange={maxPasswordAge =>
                          setNestedCustomOption('passwordPolicy', 'maxPasswordAge', parseIntegerValue(maxPasswordAge))
                        }
                      />
                    }
                  />
                  <FieldSettings
                    containerStyles={{ borderBottom: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.passwordPolicy.maxPasswordHistory')}
                    label={
                      <LabelSettings
                        text='Max Password History'
                        description='Set the number of previous password that will not be allowed to be set as new password.'
                      />
                    }
                    input={
                      <NumericInputSettings
                        min={0}
                        value={passwordPolicy?.maxPasswordHistory ?? ''}
                        error={getError(errors, 'customOptions.passwordPolicy.maxPasswordHistory')}
                        onChange={maxPasswordHistory =>
                          setNestedCustomOption('passwordPolicy', 'maxPasswordHistory', parseIntegerValue(maxPasswordHistory))
                        }
                      />
                    }
                  />
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

          <hr className={styles.fieldHr} />

          <Fieldset
            legend='Account Lockout'
            description='Manage account lockout policies for this app.'
          >
            <Field
              label={
                <Label
                  text='Account lockout'
                  description='Manage account lockout policies'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.accountLockout.duration')}
                    label={
                      <LabelSettings
                        text='Duration'
                        description='Set the duration in minutes that a locked-out account remains locked out before automatically becoming unlocked.'
                      />
                    }
                    input={
                      <NumericInputSettings
                        min={0}
                        value={accountLockout?.duration ?? ''}
                        error={getError(errors, 'customOptions.accountLockout.duration')}
                        onChange={duration =>
                          setNestedCustomOption('accountLockout', 'duration', parseIntegerValue(duration))
                        }
                      />
                    }
                  />
                  <FieldSettings
                    containerStyles={{ borderBottom: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.accountLockout.threshold')}
                    label={
                      <LabelSettings
                        text='Threshold'
                        description='Set the number of failed sign-in attempts that will cause a user account to be locked.'
                      />
                    }
                    input={
                      <NumericInputSettings
                        min={0}
                        value={accountLockout?.threshold ?? ''}
                        error={getError(errors, 'customOptions.accountLockout.threshold')}
                        onChange={threshold =>
                          setNestedCustomOption('accountLockout', 'threshold', parseIntegerValue(threshold))
                        }
                      />
                    }
                  />
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

          <hr className={styles.fieldHr} />

          <Fieldset
            legend='Security & Authentication'
            description='Configure security and authentication settings for this app.'
          >
            <Field
              label={
                <Label
                  text='Security & Authentication'
                  description='Manage security and authentication options'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='Enable Anonymous Users'
                        description='Enable anonymous users to sign up without credentials'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={customOptions?.enableAnonymousUsers}
                        onChange={value =>
                          setCustomOption('enableAnonymousUsers', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='Allow Client Class Creation'
                        description='Allow clients to create new classes'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={customOptions?.allowClientClassCreation}
                        onChange={value =>
                          setCustomOption('allowClientClassCreation', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='Allow Custom ObjectId'
                        description='Allow custom objectId values on create'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={customOptions?.allowCustomObjectId}
                        onChange={value =>
                          setCustomOption('allowCustomObjectId', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='Enforce Private Users'
                        description='Make new users private by default'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={customOptions?.enforcePrivateUsers}
                        onChange={value =>
                          setCustomOption('enforcePrivateUsers', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.sessionLength')}
                    label={
                      <LabelSettings
                        text='Session Length'
                        description='Session token expiration (in seconds, default: 1 year)'
                      />
                    }
                    input={
                      <NumericInputSettings
                        min={0}
                        value={customOptions?.sessionLength ?? ''}
                        error={getError(errors, 'customOptions.sessionLength')}
                        onChange={value =>
                          setCustomOption('sessionLength', parseIntegerValue(value))
                        }
                      />
                    }
                  />
                  <FieldSettings
                    containerStyles={{ borderBottom: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    label={
                      <LabelSettings
                        text='Expire Inactive Sessions'
                        description='Expire inactive sessions automatically'
                      />
                    }
                    input={
                      <B4aToggle
                        additionalStyles={{ margin: '6px 16px' }}
                        value={customOptions?.expireInactiveSessions}
                        onChange={value =>
                          setCustomOption('expireInactiveSessions', value)
                        }
                      />
                    }
                  />
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>

          <hr className={styles.fieldHr} />

          <Fieldset
            legend='Custom Pages'
            description='Set custom page URLs for user-facing flows.'
          >
            <Field
              label={
                <Label
                  text='Custom pages'
                  description='Configure custom page URLs for password reset, email verification, and other user-facing flows.'
                  dark={true}
                />
              }
              input={
                <div style={{ flex: 1 }}>
                  <FieldSettings
                    containerStyles={{ borderTop: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.choosePassword')}
                    label={
                      <LabelSettings
                        text='Choose Password '
                        description='Custom page URL for choose password'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter choosePassword URL'
                        value={customOptions?.choosePassword ?? ''}
                        error={getError(errors, 'customOptions.choosePassword')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('choosePassword', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.verifyEmailSuccess')}
                    label={
                      <LabelSettings
                        text='Verify Email Success '
                        description='Custom page URL for email verification success'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter verifyEmailSuccess URL'
                        value={customOptions?.verifyEmailSuccess ?? ''}
                        error={getError(errors, 'customOptions.verifyEmailSuccess')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('verifyEmailSuccess', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.parseFrameURL')}
                    label={
                      <LabelSettings
                        text='Parse Frame '
                        description='Custom page URL for iFrame embeds'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter parseFrameURL URL'
                        value={customOptions?.parseFrameURL ?? ''}
                        error={getError(errors, 'customOptions.parseFrameURL')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('parseFrameURL', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.passwordResetSuccess')}
                    label={
                      <LabelSettings
                        text='Password Reset Success '
                        description='Custom page URL for password reset success'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter passwordResetSuccess URL'
                        value={customOptions?.passwordResetSuccess ?? ''}
                        error={getError(errors, 'customOptions.passwordResetSuccess')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('passwordResetSuccess', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.invalidLink')}
                    label={
                      <LabelSettings
                        text='Invalid Link '
                        description='Custom page URL for invalid links'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter invalidLink URL'
                        value={customOptions?.invalidLink ?? ''}
                        error={getError(errors, 'customOptions.invalidLink')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('invalidLink', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.invalidVerificationLink')}
                    label={
                      <LabelSettings
                        text='Invalid Verification Link '
                        description='Custom page URL for invalid verification links'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter invalidVerificationLink URL'
                        value={customOptions?.invalidVerificationLink ?? ''}
                        error={getError(errors, 'customOptions.invalidVerificationLink')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('invalidVerificationLink', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.linkSendSuccess')}
                    label={
                      <LabelSettings
                        text='Link Send Success '
                        description='Custom page URL for link sent success'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter linkSendSuccess URL'
                        value={customOptions?.linkSendSuccess ?? ''}
                        error={getError(errors, 'customOptions.linkSendSuccess')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('linkSendSuccess', value)
                        }
                      />
                    }
                  />
                  <FieldSettings
                    containerStyles={{ borderBottom: 'none' }}
                    padding={'16px 0px'}
                    labelWidth={'50%'}
                    error={getError(errors, 'customOptions.linkSendFail')}
                    label={
                      <LabelSettings
                        text='Link Send Fail '
                        description='Custom page URL for link sent failure'
                      />
                    }
                    input={
                      <TextInputSettings
                        placeholder='Enter Link Send Fail '
                        value={customOptions?.linkSendFail ?? ''}
                        error={getError(errors, 'customOptions.linkSendFail')}
                        onChange={({ target: { value } }) =>
                          setCustomOption('linkSendFail', value)
                        }
                      />
                    }
                  />
                </div>
              }
              theme={Field.Theme.BLUE}
            />
          </Fieldset>
          </div>
        </div>
      </div>
    )
  }

  renderContent() {
    const toolbar = this.renderToolbar();
    const loading = this.state.isLoading;
    const initialFields = this.state.initialFields || {
      customOptions: {},
    };
    const customParseOptionsFieldsOptions = {
      customOptions: { friendlyName: 'custom options', type: 'json' },
    };

    let content = null;
    if (loading) {
      content = null;
    } else if (this.state.loadingError) {
      content = <EmptyGhostState
        title="Error loading parse options"
        description={this.state.loadingError}
      />
    } else {
      content = <div className={styles.mainContent}>
          <FlowView
            initialFields={initialFields}
            validate={({ changes }) => {
              const merged = deepmerge(
                JSON.parse(JSON.stringify(initialFields)),
                changes
              );
              return CustomParseOptionsValidations
                .validate(merged, { abortEarly: false })
                .then(() => '')
                .catch(err => {
                  const errors = (err.inner || []).map(e => e.path + e.message);
                  return Promise.reject({ errors });
                });
            }}
            onSubmit={({ fields }) => {
              const payload = { ...fields.customOptions };
              if (payload.maxUploadSize != null && payload.maxUploadSize !== '') {
                payload.maxUploadSize = `${payload.maxUploadSize}mb`;
              }
              return this.context.saveParseOptions(payload);
            }}
            afterSave={({ fields }) => {
              this.setState({
                initialFields: {
                  customOptions: JSON.parse(JSON.stringify(fields.customOptions || {})),
                },
              });
            }}
            footerContents={({ changes }) =>
              renderFlowFooterChanges(changes, initialFields, customParseOptionsFieldsOptions)
            }
            renderForm={this.renderParseOptionsForm.bind(this)}
          />
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
      </div>
    );
  }
}

export default CustomParseOptions;

