import React from 'react';
import Field                             from 'components/Field/Field.react';
import VisibilityField                   from 'components/VisibilityField/VisibilityField.react';
import FieldSettings                     from 'components/FieldSettings/FieldSettings.react';
import Fieldset                          from 'components/Fieldset/Fieldset.react';
import FlowView                          from 'components/FlowView/FlowView.react';
import FormButton                        from 'components/FormButton/FormButton.react';
import FormModal                         from 'components/FormModal/FormModal.react';
import FormNote                          from 'components/FormNote/FormNote.react';
import Label                             from 'components/Label/Label.react';
import LabelSettings                     from 'components/LabelSettings/LabelSettings.react';
import NumericInputSettings              from 'components/NumericInputSettings/NumericInputSettings.react';
import Toggle                            from 'components/Toggle/Toggle.react';
import TextInputSettings                 from 'components/TextInputSettings/TextInputSettings.react';
import {
  getSettingsFromKey, convertStringToInt
}                                        from 'lib/ParseOptionUtils';

import {
  DEFAULT_SETTINGS_LABEL_WIDTH
}                                        from 'dashboard/Settings/Fields/Constants';

export const ManageAppFields = ({
  isCollaborator,
  hasCollaborators,
  mongoURL,
  changeConnectionString,
  startMigration,
  hasInProgressMigration,
  appSlug,
  cleanUpFiles,
  cleanUpFilesMessage,
  cleanUpMessageColor = 'orange',
  cleanUpSystemLog,
  cleanUpSystemLogMessage,
  exportData,
  exportDataMessage,
  exportMessageColor = 'orange',
  cloneApp,
  cloneAppMessage,
  transferApp,
  transferAppMessage,
  deleteApp,
  parseOptions,
  setParseOptions,
  appSettings
}) => {
  let migrateAppField = null;
  if (!mongoURL && !hasInProgressMigration) {
    migrateAppField = <Field
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Migrate to external database'
        description='Move your data and queries to your own database.' />
      }
      input={<FormButton
        color='red'
        onClick={startMigration}
        value='Migrate' />
      } />;
  } else if (hasInProgressMigration) {
    migrateAppField = <Field
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Migrate to external database'
        description='View your migration progress.' />}
      input={<FormButton
        color='blue'
        onClick={() => history.push(`/apps/${appSlug}/migration`)}
        value='View progress' />} />
  } else {
    migrateAppField = [<Field
      key='show'
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Migration complete'
        description='Your database has been migrated to an external database.'
      />}
      //TODO: KeyField bascially does what we want, but is maybe too specialized. Maybe at some point we should have a component dedicated to semi-secret stuff that we want to prevent shoulder surfers from seeing, and emphasizing that stuff something should be secret.
      input={<KeyField
        hidden={true}
        whenHiddenText='Show connection string'
      >
        <TextInput
          value={mongoURL}
          onChange={() => {}} //Make propTypes happy
          disabled={true}
          monospace={true}
        />
      </KeyField>}
    />,
    <Field
      key='new'
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Change connection string'
        description='Upgrate or change your database.'/>}
      input={<FormButton
        additionalStyles={{fontSize: '13px'}}
        color='red'
        onClick={changeConnectionString}
        value='Change connection string' />} />
    ];
  }

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
                description={<p style={{ wordBreak: 'break-word', height: 'auto', padding: 0 }}>{appSettings?.dashboardAPI}</p>}
              />}
            />
            <FieldSettings
              containerStyles={{ borderBottom: 'none' }}
              padding={'7px 0px'}
              labelWidth={'50%'}
              label={<LabelSettings
                text='Parse Version'
                description={<span>{appSettings?.parseVersion}</span>}
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
                    description={<p style={{ wordBreak: 'break-word', height: 'auto', padding: 0 }}>{appSettings?.databaseURL}</p>}
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
              description={<span>{appSettings?.databaseURL?.split('://')[0]} {appSettings?.mongoVersion}</span>}
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
                value={parseOptions?.passwordPolicy?.resetTokenValidityDuration}
                onChange={resetTokenValidityDuration => {
                  setParseOptions({
                    ...parseOptions,
                    passwordPolicy: {
                      ...parseOptions.passwordPolicy,
                      resetTokenValidityDuration: convertStringToInt(resetTokenValidityDuration)
                    }
                  });
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
                value={ getSettingsFromKey(parseOptions.passwordPolicy, 'resetTokenReuseIfValid') }
                onChange={resetTokenReuseIfValid => {
                  setParseOptions({
                    ...parseOptions,
                    passwordPolicy: {
                      ...parseOptions.passwordPolicy,
                      resetTokenReuseIfValid: resetTokenReuseIfValid
                    }
                  });
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
                value={parseOptions?.passwordPolicy?.validatorPattern}
                onChange={validatorPattern => {
                  setParseOptions({
                    ...parseOptions,
                    passwordPolicy: {
                      ...parseOptions.passwordPolicy,
                      validatorPattern: validatorPattern
                    }
                  });
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
                value={parseOptions?.passwordPolicy?.validationError}
                onChange={validationError => {
                  setParseOptions({
                    ...parseOptions,
                    passwordPolicy: {
                      ...parseOptions.passwordPolicy,
                      validationError: validationError
                    }
                  });
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
                value={parseOptions?.passwordPolicy?.doNotAllowUsername}
                onChange={doNotAllowUsername => {
                  setParseOptions({
                    ...parseOptions,
                    passwordPolicy: {
                      ...parseOptions.passwordPolicy,
                      doNotAllowUsername: doNotAllowUsername
                    }
                  });
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
                value={parseOptions?.passwordPolicy?.maxPasswordAge}
                onChange={maxPasswordAge => {
                  setParseOptions({
                    ...parseOptions,
                    passwordPolicy: {
                      ...parseOptions.passwordPolicy,
                      maxPasswordAge: convertStringToInt(maxPasswordAge)
                    }
                  });
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
                value={ parseOptions?.passwordPolicy?.maxPasswordHistory }
                onChange={maxPasswordHistory => {
                  setParseOptions({
                    ...parseOptions,
                    passwordPolicy: {
                      ...parseOptions.passwordPolicy,
                      maxPasswordHistory: convertStringToInt(maxPasswordHistory)
                    }
                  });
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
                value={parseOptions?.accountLockout?.duration}
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
                  setParseOptions({
                    ...parseOptions,
                    accountLockout: {
                      ...parseOptions.accountLockout,
                      duration: convertStringToInt(duration)
                    }
                  });
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
                value={ parseOptions?.accountLockout?.threshold }
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
                  setParseOptions({
                    ...parseOptions,
                    accountLockout: {
                      ...parseOptions.accountLockout,
                      threshold: convertStringToInt(threshold)
                    }
                  });
                }} />
            }
          />
          </div>
        }
      />
  </Fieldset>
  );
}
