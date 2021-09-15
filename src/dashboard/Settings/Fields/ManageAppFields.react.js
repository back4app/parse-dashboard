import React from 'react';
import Field                             from 'components/Field/Field.react';
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
import {
  getSettingsFromKey
}                                        from 'lib/ParseOptionUtils';

const DEFAULT_SETTINGS_LABEL_WIDTH = 55;

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
  setParseOptions
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

  let parseOptionsJson = { accountLockout: {}, passwordPolicy: {} };
  if ( parseOptions ) {
    if ( typeof parseOptions === 'string' ) {
      parseOptionsJson = JSON.parse(parseOptions);
    }
    if ( parseOptions instanceof Array ) {
      parseOptionsJson = {
        ...parseOptionsJson,
        ...parseOptions[0]
      };
    }
    else if ( parseOptions instanceof Object ) {
      parseOptionsJson = { accountLockout: { ...parseOptions.accountLockout }, passwordPolicy: { ...parseOptions.passwordPolicy } };
    }
  }

  return (
    <Fieldset
      legend='App Management'
      description='These options will affect your entire app.' >
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        // TODO replace with password policy
        label={<Label text='Password policy' description={'Manage password policies for this'} />}
        input={
          <div>
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Token Duration'
              description='Reset token validity duration'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={getSettingsFromKey(parseOptionsJson.passwordPolicy, 'resetTokenValidityDuration') || 24*60*60}
                onChange={resetTokenValidityDuration => {
                  parseOptionsJson.passwordPolicy.resetTokenValidityDuration = resetTokenValidityDuration;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
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
                value={ getSettingsFromKey(parseOptionsJson.passwordPolicy, 'resetTokenReuseIfValid') || false }
                onChange={resetTokenReuseIfValid => {
                  parseOptionsJson.passwordPolicy.resetTokenReuseIfValid = resetTokenReuseIfValid;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Validator Callback'
              description='Callback for the validator'
            />}
            input={
              <CodeEditor
                placeHolder={getSettingsFromKey(parseOptionsJson.passwordPolicy, 'validatorCallback') || '(password) => { return validatePassword(password) }'}
                onCodeChange={ validatorCallback => {
                  parseOptionsJson.passwordPolicy.validatorCallback = validatorCallback;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
                } }
                fontSize={'10px'}
                style={{ height: '60px', marginTop: '10px' }}
              />
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
                defaultValue={getSettingsFromKey(parseOptionsJson.passwordPolicy, 'validatorPattern') || '/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/'}
                onChange={validatorPattern => {
                  parseOptionsJson.passwordPolicy.validatorCallback = validatorPattern;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
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
                defaultValue={getSettingsFromKey(parseOptionsJson.passwordPolicy, 'validationError') || 'Password must contain at least 1 digit.'}
                onChange={validationError => {
                  parseOptionsJson.passwordPolicy.validationError = validationError;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
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
                value={getSettingsFromKey(parseOptionsJson.passwordPolicy, 'doNotAllowUsername') !== undefined ? getSettingsFromKey(parseOptionsJson.passwordPolicy, 'doNotAllowUsername') : true }
                onChange={doNotAllowUsername => {
                  parseOptionsJson.passwordPolicy.doNotAllowUsername = doNotAllowUsername;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
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
                defaultValue={getSettingsFromKey(parseOptionsJson.passwordPolicy, 'maxPasswordAge') || 90 }
                onChange={maxPasswordAge => {
                  parseOptionsJson.passwordPolicy.maxPasswordAge = maxPasswordAge;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Max Password History'
              description='The maximum password history'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={ getSettingsFromKey(parseOptionsJson.passwordPolicy, 'maxPasswordHistory') || 5 }
                onChange={maxPasswordHistory => {
                  parseOptionsJson.passwordPolicy.maxPasswordHistory = maxPasswordHistory;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
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
          <div>
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
                defaultValue={getSettingsFromKey(parseOptionsJson.accountLockout, 'duration') || 5}
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
                  parseOptionsJson.accountLockout.duration = duration;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
                }} />
            }
          />
          <FieldSettings
            padding={'7px 0px'}
            labelWidth={'50%'}
            label={<LabelSettings
              text='Threshold'
              description='Failed login attempts threshold'
            />}
            input={
              <NumericInputSettings
                min={0}
                defaultValue={ getSettingsFromKey(parseOptionsJson.accountLockout, 'threshold') || 3}
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
                  parseOptionsJson.accountLockout.threshold = threshold;
                  setParseOptions(JSON.stringify( parseOptionsJson ));
                }} />
            }
          />
          </div>
        }
      />
      <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Clean up app'
          description={<span>This will delete any files that are not referenced by any objects.
          (Don't use the feature if you have Arrays of Files,<br/>or Files inside Object columns!)
          </span>} />}
      input={<FormButton
      onClick={cleanUpFiles}
      value='Clean Up Files'/>} />
      {cleanUpFilesMessage ? <FormNote
      show={true}
      color={cleanUpMessageColor}>
      <div>{cleanUpFilesMessage}</div>
    </FormNote> : null}
  </Fieldset>
  );
}
