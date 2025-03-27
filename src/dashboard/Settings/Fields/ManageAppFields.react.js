import React from 'react';
import Field from 'components/Field/Field.react';
import VisibilityField from 'components/VisibilityField/VisibilityField.react';
import FieldSettings from 'components/FieldSettings/FieldSettings.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import FormButton from 'components/FormButton/FormButton.react';
import Label from 'components/Label/Label.react';
import LabelSettings from 'components/LabelSettings/LabelSettings.react';
import NumericInputSettings from 'components/NumericInputSettings/NumericInputSettings.react';
import Toggle from 'components/Toggle/Toggle.react';
import TextInputSettings from 'components/TextInputSettings/TextInputSettings.react';
import {
  DEFAULT_SETTINGS_LABEL_WIDTH
} from 'dashboard/Settings/Fields/Constants';
import PropTypes from 'lib/PropTypes';
import getError from 'dashboard/Settings/Util/getError';

export const ManageAppFields = ({
  parseOptions,
  setParseOptions,
  dashboardAPI,
  databaseURL,
  parseVersion,
  errors,
  isGDPR,
  permissions,
  databaseVersion,
  useLatestDashboardVersion,
  setUseLatestDashboardVersion,
  backendBetaUser
}) => {

  return (
    <Fieldset
      legend='App Management'
      description='These options will affect your entire app.' >
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO replace with password policy
        label={<Label text='Parse API' description={'Parse API configurations'} />}
        input={
          <div style={{ flex: 1 }}>
            <FieldSettings
              containerStyles={{ borderTop: 'none' }}
              padding={'7px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Parse API Address'
                description={<p style={{ wordBreak: 'break-word', height: 'auto', padding: 0 }}>{dashboardAPI}</p>}
              />}
            />
            <FieldSettings
              containerStyles={{ borderBottom: 'none' }}
              padding={'7px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Parse Version'
                description={<span>{parseVersion}</span>}
              />}
            />
          </div>
        }
      />
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO replace with password policy
        label={<Label text='Database' description={'Database configurations'} />}
        input={
          <div style={{ flex: 1 }}>
            {
              (isGDPR !== true && permissions.hideDatabaseURL !== true) &&
              <VisibilityField
                onVisibleComponent={
                  () =>
                    <FieldSettings
                      containerStyles={{ borderTop: 'none' }}
                      padding={'7px 0px'}
                      labelWidth={'50%'}
                      label={<LabelSettings
                        text='Database URI'
                        description={<p style={{ wordBreak: 'break-word', height: 'auto', padding: 0 }}>{databaseURL}</p>}
                      />}
                    />}
                onHiddenComponent={
                  (props) => <FormButton
                    onClick={() => props.toggleVisibility(true)}
                    value='Show Database URI' />
                }
              />}
            <FieldSettings
              containerStyles={{ borderBottom: 'none' }}
              padding="7px 0px"
              labelWidth="50%"
              label={(
                <LabelSettings
                  text="Database Version"
                  description={
                    <>
                      <span>
                        {databaseVersion}
                      </span>
                    </>
                  }
                />
              )}
            />
          </div>
        }
      />
      {(backendBetaUser || !b4aSettings.BACKEND_DASHBOARD_IS_BETA) && (
        <>
          <Field
            labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
            label={
              <Label
                text="Dashboard"
                description={
                  'Use latest backend dashboard version'
                }
              />
            }
            input={
              <Toggle
                value={useLatestDashboardVersion}
                onChange={value => setUseLatestDashboardVersion(value)}
              />
            }
          />
        </>
      )}
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO replace with password policy
        label={<Label text='Password policy' description={'Manage password policies for this app'} />}
        input={
          <div style={{ flex: 1 }}>
            <FieldSettings
              containerStyles={{ borderTop: 'none' }}
              padding={'7px 0px'}
              labelWidth={'50%'}
              error={getError(errors, 'parseOptions.passwordPolicy.resetTokenValidityDuration')}
              label={<LabelSettings
                text='Reset Token Validity Duration.'
                description='Set the validity duration of the password reset token in seconds after which the token expires.'
              />}
              input={
                <NumericInputSettings
                  min={0}
                  value={parseOptions?.passwordPolicy?.resetTokenValidityDuration}
                  error={getError(errors, 'parseOptions.passwordPolicy.resetTokenValidityDuration')}
                  onChange={(resetTokenValidityDuration) => {
                    setParseOptions({ passwordPolicy: { resetTokenValidityDuration: parseInt(resetTokenValidityDuration) } });
                  }} />
              }
            />
            <FieldSettings
              padding={'7px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Reset Token Reuse If Valid'
                description='If a password reset token should be reused in case another token is requested but there is a token that is still valid.'
              />}
              input={
                <Toggle
                  additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
                  value={parseOptions?.passwordPolicy?.resetTokenReuseIfValid}
                  onChange={resetTokenReuseIfValid => {
                    setParseOptions({ passwordPolicy: { resetTokenReuseIfValid: resetTokenReuseIfValid } });
                  }} />
              }
            />
            <FieldSettings
              padding={'7px 0px'}
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
              padding={'7px 0px'}
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
              padding={'7px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Do Not Allow Username'
                description='Set to true to disallow the username as part of the password.'
              />}
              input={
                <Toggle
                  additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
                  value={parseOptions?.passwordPolicy?.doNotAllowUsername}
                  onChange={doNotAllowUsername => {
                    setParseOptions({ passwordPolicy: { doNotAllowUsername } });
                  }} />
              }
            />
            <FieldSettings
              error={getError(errors, 'parseOptions.passwordPolicy.maxPasswordAge')}
              padding={'7px 0px'}
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
              padding={'7px 0px'}
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
        } />

      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO Account lockout
        label={<Label text='Account lockout' description='Manage account lockout policies' />}
        input={
          <div style={{ flex: 1 }}>
            <FieldSettings
              error={getError(errors, 'parseOptions.accountLockout.duration')}
              padding={'7px 0px'}
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
              padding={'7px 0px'}
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
  isGDPR: PropTypes.bool.isRequired.describe('GDPR app identifier'),
  permissions: PropTypes.object.describe('App permissions')
}
