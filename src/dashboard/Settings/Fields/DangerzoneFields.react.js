import React from 'react';

import Fieldset                          from 'components/Fieldset/Fieldset.react';
import Field                             from 'components/Field/Field.react';
import Label                             from 'components/Label/Label.react';
import FormButton                        from 'components/FormButton/FormButton.react';
import FormNote                          from 'components/FormNote/FormNote.react';
import Toggle                            from 'components/Toggle/Toggle.react';
import {
  DEFAULT_SETTINGS_LABEL_WIDTH
}                                        from 'dashboard/Settings/Fields/Constants';
import PropTypes                         from 'lib/PropTypes';

export const DangerzoneFields = ({
  cleanUpFiles,
  cleanUpFilesMessage,
  cleanUpMessageColor = 'orange',
  clientPush,
  setClientPush,
  clientClassCreation,
  setClientClassCreation,
  restartApp,
  transferApp,
  cloneApp,
  deleteApp,
  isCollaborator
}) => <Fieldset
  legend='Danger Zone'
  description='These options will effect your app'>
    <Field
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Push Notification from Client'
        description={<span>For security reasons, we recommend to disable this option.</span>} />}
      input={
        <span style={{ textAlign: 'center' }}>
          <Toggle
            additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
            value={ clientPush === true }
            onChange={ clientPush => setClientPush(clientPush) } />
        </span>
      }
      />
    <Field
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Client Class Creation'
        description={<span>For security reasons, we recommend to disable this option.</span>} />}
      input={
        <span style={{ textAlign: 'center' }}>
          <Toggle
            additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
            value={ clientClassCreation }
            onChange={ clientClassCreation => setClientClassCreation(clientClassCreation) } />
        </span>
      }
    />
    <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Clean up app'
          description={<span>This will delete any files that are not referenced by any objects. Don&apos;t use the feature if you have Arrays of Files, or Files inside Object columns.</span>} />}
      input={<FormButton
      onClick={cleanUpFiles}
      value='Clean Up Files'/>} />
    <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Restart App'
          description={<span>This will restart the app. (This might cause the app might not be available while it restarts) </span>} />}
        input={<FormButton
          onClick={restartApp}
          value='Restart App'/>} />
    { isCollaborator == false &&
    <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Transfer App'
          description={<span>This will transfer the app to another user. (You may not be able to access this app after it's transfered to another user.) </span>} />}
        input={<FormButton
        // additionalStyles={{ backgroundColor: 'transparent', borderColor: '#f90015', color: '#f90015' }}
        onClick={transferApp}
        value='Transfer App'/>} />}
    { isCollaborator == false &&
    <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Clone App'
          description={<span>Make a new clone app from this app.</span>} />}
        input={<FormButton
        onClick={cloneApp}
        value='Clone App'/>} />}
    { isCollaborator == false &&
     <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Delete App'
          description={<span>Delete this app.</span>} />}
        input={<FormButton
        additionalStyles={{ backgroundColor: '#f90015', borderColor: '#f90015', color: 'white' }}
        onClick={deleteApp}
        value='Delete App'/>} /> }
    {cleanUpFilesMessage ? <FormNote
      show={true}
      color={cleanUpMessageColor}>
      <div>{cleanUpFilesMessage}</div>
    </FormNote> : null}
</Fieldset>;

DangerzoneFields.propTypes = {
  cleanUpFiles: PropTypes.func.isRequired.describe('Cleanup files function'),
  cleanUpFilesMessage: PropTypes.string.isRequired.describe('Cleanup file message'),
  cleanUpMessageColor: PropTypes.string.describe('Cleanup files note color'),
  clientPush: PropTypes.bool.isRequired.describe('Client push settings'),
  setClientPush: PropTypes.func.isRequired.describe('Set client push settings'),
  clientClassCreation: PropTypes.bool.isRequired.describe('Client class creation settings'),
  setClientClassCreation: PropTypes.func.isRequired.describe('Set client class creation settings'),
  restartApp: PropTypes.func.isRequired.describe('Restart app function'),
  transferApp: PropTypes.func.isRequired.describe('Transfer app function'),
  cloneApp: PropTypes.func.isRequired.describe('Clone app function'),
  deleteApp: PropTypes.func.isRequired.describe('Delete app function'),
  isCollaborator: PropTypes.bool.isRequired.describe('The current user is collaborator')
};