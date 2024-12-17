import React from 'react';
import Field from 'components/Field/Field.react';
import VisibilityField from 'components/VisibilityField/VisibilityField.react';
import FieldSettings from 'components/FieldSettings/FieldSettings.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import FormButton from 'components/FormButton/FormButton.react';
import B4aKeyField from 'components/KeyField/B4aKeyField.react';
import Label from 'components/Label/Label.react';
import LabelSettings from 'components/LabelSettings/LabelSettings.react';
import NumericInputSettings from 'components/NumericInputSettings/NumericInputSettings.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';
import TextInputSettings from 'components/TextInputSettings/TextInputSettings.react';
import {
  DEFAULT_SETTINGS_LABEL_WIDTH
} from 'dashboard/Settings/Fields/Constants';
import PropTypes from 'lib/PropTypes';
import getError from 'dashboard/Settings/Util/getError';
import styles from 'dashboard/Settings/GeneralSettings.scss';

export const ManageAppFields = ({
  parseOptions,
  setParseOptions,
  dashboardAPI,
  databaseURL,
  parseVersion,
  mongoVersion,
  errors,
  isGDPR,
  databaseVersion,
  useLatestDashboardVersion,
  setUseLatestDashboardVersion,
  backendBetaUser
}) => {

  const checkDB = databaseURL?.split('://')[0];

  return (
    <Fieldset
      legend='App Management'
      description='These options will affect your entire app.' >
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO replace with password policy
        label={<Label text='Parse API' description={'Parse API configurations'} dark={true} />}
        input={
          <div style={{ flex: 1 }}>
            <FieldSettings
              containerStyles={{ borderTop: 'none' }}
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Parse API Address'
                description={<p style={{ wordBreak: 'break-word', height: 'auto', padding: 0, textAlign: 'right' }}>{dashboardAPI}</p>}
              />}
            />
            <FieldSettings
              containerStyles={{ borderBottom: 'none' }}
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Parse Version'
                description={<span>{parseVersion}</span>}
              />}
            />
          </div>
        }
        theme={Field.Theme.BLUE}
      />
      <hr className={styles.fieldHr} />
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO replace with password policy
        label={<Label text='Database' description={'Database configurations'} dark={true} />}
        input={
          <div style={{ flex: 1 }}>
            {
              (isGDPR !== true) &&
              <div style={{ padding: '11px 0' }}>
                <B4aKeyField name="Show Database" hidden={true} showKeyName={true} keyText="URI">
                  {databaseURL}
                </B4aKeyField>
              </div>}
            <FieldSettings
              containerStyles={{ borderBottom: 'none' }}
              padding="16px 0px"
              labelWidth="50%"
              label={(
                <LabelSettings
                  text="Database Version"
                  description={
                    <>
                      <span>
                        {checkDB.split('+srv')[0]} {!databaseVersion ? mongoVersion : databaseVersion}
                      </span>
                    </>
                  }
                />
              )}
            />
          </div>
        }
        theme={Field.Theme.BLUE}
      />
      <hr className={styles.fieldHr} />      
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Dashboard'
          description={<span>Use latest backend dashboard version</span>} dark={true} />}
        input={
          <span style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
            <B4aToggle
              additionalStyles={{ margin: '6px 16px 0 0' }}
              value={ useLatestDashboardVersion !== false }
              onChange={ value => setUseLatestDashboardVersion(value) } />
          </span>
        }
        theme={Field.Theme.BLUE}
      />
      <hr className={styles.fieldHr} />
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO replace with password policy
        label={<Label text='Password policy' description={'Manage password policies for this app'} dark={true} />}
        input={
          <div style={{ flex: 1 }}>
            <FieldSettings
              containerStyles={{ borderTop: 'none' }}
              padding={'16px 0px'}
              labelWidth={'50%'}
              error={getError(errors, 'parseOptions.passwordPolicy.resetTokenValidityDuration')}
              label={<LabelSettings
                text='Reset Token Validity Duration.'
                description='Set the validity duration of the password reset token in seconds after which the token expires.'
              />}
              input={
                <NumericInputSettings
                  placeholder={0}
                  min={0}
                  value={parseOptions?.passwordPolicy?.resetTokenValidityDuration}
                  error={getError(errors, 'parseOptions.passwordPolicy.resetTokenValidityDuration')}
                  onChange={(resetTokenValidityDuration) => {
                    setParseOptions({ passwordPolicy: { resetTokenValidityDuration: parseInt(resetTokenValidityDuration) } });
                  }} />
              }
            />
            <FieldSettings
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Reset Token Reuse If Valid'
                description='If a password reset token should be reused in case another token is requested but there is a token that is still valid.'
              />}
              input={
                <B4aToggle
                  additionalStyles={{ margin: '6px 16px' }}
                  value={parseOptions?.passwordPolicy?.resetTokenReuseIfValid}
                  onChange={resetTokenReuseIfValid => {
                    setParseOptions({ passwordPolicy: { resetTokenReuseIfValid: resetTokenReuseIfValid } });
                  }} />
              }
            />
            <FieldSettings
              padding={'16px 0px'}
              labelWidth={'50%'}
              error={getError(errors, 'parseOptions.passwordPolicy.validatorPattern')}
              label={<LabelSettings
                text='Password Validator Pattern'
                description='Set the regular expression validation pattern a password must match to be accepted.'
              />}
              input={
                <TextInputSettings
                  error={getError(errors, 'parseOptions.passwordPolicy.validatorPattern')}
                  value={parseOptions?.passwordPolicy?.validatorPattern}
                  onChange={({ target: { value } }) => {
                    setParseOptions({ passwordPolicy: { validatorPattern: value } });
                  }} />
              }
            />
            <FieldSettings
              padding={'16px 0px'}
              labelWidth={'50%'}
              error={getError(errors, 'parseOptions.passwordPolicy.validationError')}
              label={<LabelSettings
                text='Validation Error Message'
                description='Set the error message to be sent for failed password validation'
              />}
              input={
                <TextInputSettings
                  value={parseOptions?.passwordPolicy?.validationError}
                  error={getError(errors, 'parseOptions.passwordPolicy.validationError')}
                  onChange={({ target: { value } }) => {
                    setParseOptions({ passwordPolicy: { validationError: value } });
                  }} />
              }
            />
            <FieldSettings
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Do Not Allow Username'
                description='Set to true to disallow the username as part of the password.'
              />}
              input={
                <B4aToggle
                  additionalStyles={{ margin: '6px 16px' }}
                  value={parseOptions?.passwordPolicy?.doNotAllowUsername}
                  onChange={doNotAllowUsername => {
                    setParseOptions({ passwordPolicy: { doNotAllowUsername } });
                  }} />
              }
            />
            <FieldSettings
              error={getError(errors, 'parseOptions.passwordPolicy.maxPasswordAge')}
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Max Password Age'
                description='Set the number of days after which a password expires.'
              />}
              input={
                <NumericInputSettings
                  error={getError(errors, 'parseOptions.passwordPolicy.maxPasswordAge')}
                  min={0}
                  value={parseOptions?.passwordPolicy?.maxPasswordAge}
                  onChange={(maxPasswordAge) => {
                    setParseOptions({ passwordPolicy: { maxPasswordAge: parseInt(maxPasswordAge) } });
                  }} />
              }
            />
            <FieldSettings
              error={getError(errors, 'parseOptions.passwordPolicy.maxPasswordHistory')}
              containerStyles={{ borderBottom: 'none' }}
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Max Password History'
                description='Set the number of previous password that will not be allowed to be set as new password.'
              />}
              input={
                <NumericInputSettings
                  error={getError(errors, 'parseOptions.passwordPolicy.maxPasswordHistory')}
                  min={0}
                  value={parseOptions?.passwordPolicy?.maxPasswordHistory}
                  onChange={(maxPasswordHistory) => {
                    setParseOptions({ passwordPolicy: { maxPasswordHistory: parseInt(maxPasswordHistory) } });
                  }} />
              }
            />
          </div>
        }
        theme={Field.Theme.BLUE}
      />
      <hr className={styles.fieldHr} />
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO Account lockout
        label={<Label text='Account lockout' description='Manage account lockout policies' dark={true} />}
        input={
          <div style={{ flex: 1 }}>
            <FieldSettings
              error={getError(errors, 'parseOptions.accountLockout.duration')}
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Duration'
                description='Set the duration in minutes that a locked-out account remains locked out before automatically becoming unlocked.'
              />}
              input={
                <NumericInputSettings
                  error={getError(errors, 'parseOptions.accountLockout.duration')}
                  min={0}
                  value={parseOptions?.accountLockout?.duration}
                  onChange={(duration) => {
                    setParseOptions({ accountLockout: { duration: parseInt(duration) } });
                  }} />
              }
            />
            <FieldSettings
              error={getError(errors, 'parseOptions.accountLockout.threshold')}
              containerStyles={{ borderBottom: 'none' }}
              padding={'16px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Threshold'
                description='Set the number of failed sign-in attempts that will cause a user account to be locked. '
              />}
              input={
                <NumericInputSettings
                  error={getError(errors, 'parseOptions.accountLockout.threshold')}
                  min={0}
                  value={parseOptions?.accountLockout?.threshold}
                  onChange={(threshold) => {
                    setParseOptions({ accountLockout: { threshold: parseInt(threshold) } });
                  }} />
              }
            />
          </div>
        }
        theme={Field.Theme.BLUE}
      />
    </Fieldset>
  );
}

ManageAppFields.propTypes = {
  parseOptions: PropTypes.object.isRequired.describe('Parse options for the fields'),
  cleanUpFiles: PropTypes.func.isRequired.describe('Cleanup files function'),
  setParseOptions: PropTypes.func.isRequired.describe('Set parse options'),
  toggleVisibility: PropTypes.bool.describe('Toggle visibility'),
  dashboardAPI: PropTypes.string.describe('Parse Server API URL'),
  databaseURL: PropTypes.string.describe('Dashboard API URL'),
  parseVersion: PropTypes.string.describe('Parse server version'),
  databaseVersion: PropTypes.string.describe('Database version'),
  mongoVersion: PropTypes.string.describe('Database version'),
  errors: PropTypes.array.describe('An array of errors'),
  isGDPR: PropTypes.bool.isRequired.describe('GDPR app identifier')
}
