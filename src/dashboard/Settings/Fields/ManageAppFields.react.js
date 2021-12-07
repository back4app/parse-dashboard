import React from 'react';
import Field                             from 'components/Field/Field.react';
import VisibilityField                   from 'components/VisibilityField/VisibilityField.react';
import FieldSettings                     from 'components/FieldSettings/FieldSettings.react';
import Fieldset                          from 'components/Fieldset/Fieldset.react';
import FormButton                        from 'components/FormButton/FormButton.react';
import Label                             from 'components/Label/Label.react';
import LabelSettings                     from 'components/LabelSettings/LabelSettings.react';
import NumericInputSettings              from 'components/NumericInputSettings/NumericInputSettings.react';
import Toggle                            from 'components/Toggle/Toggle.react';
import TextInputSettings                 from 'components/TextInputSettings/TextInputSettings.react';
import {
  getSettingsFromKey
}                                        from 'lib/ParseOptionUtils';

import {
  DEFAULT_SETTINGS_LABEL_WIDTH
}                                        from 'dashboard/Settings/Fields/Constants';

export const ManageAppFields = ({
  parseOptions,
  setParseOptions,
  dashboardAPI,
  databaseURL,
  parseVersion,
  mongoVersion
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
                value='Show Database URI'/>
            }
          />
          <FieldSettings
            containerStyles={{ borderBottom: 'none' }}
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Database Version'
              description={<span>{databaseURL?.split('://')[0]} {mongoVersion}</span>}
            />}
          />
          </div>
          }
      />
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
            label={<LabelSettings
              text='Token Duration'
              description='Reset token validity duration'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={getSettingsFromKey(parseOptions.passwordPolicy, 'resetTokenValidityDuration') || 24*60*60}
                onChange={resetTokenValidityDuration => {
                  setParseOptions( { passwordPolicy: { resetTokenValidityDuration } } );
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Reuse Reset Token'
              description='Reuse old reset token if the token is valid'
            />}
            input={
              <Toggle
                additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
                value={ getSettingsFromKey(parseOptions.passwordPolicy, 'resetTokenReuseIfValid') || false }
                onChange={resetTokenReuseIfValid => {
                  setParseOptions({ passwordPolicy: { resetTokenReuseIfValid } });
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Validator Pattern'
              description='The validator pattern'
            />}
            input={
              <TextInputSettings
                defaultValue={getSettingsFromKey(parseOptions.passwordPolicy, 'validatorPattern') || '/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/'}
                onChange={({ target: {value} }) => {
                  setParseOptions( { passwordPolicy: { validatorPattern: value } } );
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Validation Error'
              description='The validation error'
            />}
            input={
              <TextInputSettings
                defaultValue={getSettingsFromKey(parseOptions.passwordPolicy, 'validationError') || 'Password must contain at least 1 digit.'}
                onChange={({ target: {value} }) => {
                  setParseOptions({ passwordPolicy: { validationError: value } });
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Do Not Allow Username'
              description='Do not allow username'
            />}
            input={
              <Toggle
                additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
                defaultValue={getSettingsFromKey(parseOptions.passwordPolicy, 'doNotAllowUsername') !== undefined ? getSettingsFromKey(parseOptions.passwordPolicy, 'doNotAllowUsername') : true }
                onChange={doNotAllowUsername => {
                  setParseOptions({ passwordPolicy: { doNotAllowUsername } });
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Max Password Age'
              description='The maximum password age'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={getSettingsFromKey(parseOptions.passwordPolicy, 'maxPasswordAge') || 90 }
                onChange={maxPasswordAge => {
                  setParseOptions({ passwordPolicy: { maxPasswordAge } });
                }} />
            }
          />
          <FieldSettings
            containerStyles={{ borderBottom: 'none' }}
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Max Password History'
              description='The maximum password history'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={ getSettingsFromKey(parseOptions.passwordPolicy, 'maxPasswordHistory') || 5 }
                onChange={(maxPasswordHistory) => {
                  setParseOptions({ passwordPolicy: { maxPasswordHistory } });
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
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Duration'
              description='Account lockout duration'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={getSettingsFromKey(parseOptions.accountLockout, 'duration') || 5}
                onChange={duration => {
                  try {
                    const durationNum = parseInt(duration);
                    if ( durationNum <= 0 || durationNum > 99999 ) {
                      return;
                    }
                  }
                  catch(e) {
                    console.error(e);
                    return;
                  }
                  setParseOptions({ accountLockout: { duration } });
                }} />
            }
          />
          <FieldSettings
            containerStyles={{ borderBottom: 'none' }}
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Threshold'
              description='Failed login attempts threshold'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={ getSettingsFromKey(parseOptions.accountLockout, 'threshold') || 3}
                onChange={threshold => {
                  try {
                    const thresholdNum = parseInt(threshold);
                    if ( thresholdNum <= 0 || thresholdNum > 1000 ) {
                      return;
                    }
                  }
                  catch(e) {
                    console.error(e);
                    return;
                  }
                  setParseOptions({ accountLockout: { threshold } });
                }} />
            }
          />
          </div>
        }
      />
  </Fieldset>
  );
}
