import React from 'react';

import Fieldset                          from 'components/Fieldset/Fieldset.react';
import Field                             from 'components/Field/Field.react';
import Label                             from 'components/Label/Label.react';
import TextInput                         from 'components/TextInput/TextInput.react';
import FormButton                        from 'components/FormButton/FormButton.react';
import FormNote                          from 'components/FormNote/FormNote.react';
import Toggle                            from 'components/Toggle/Toggle.react';
import {
  DEFAULT_SETTINGS_LABEL_WIDTH
}                                        from 'dashboard/Settings/Fields/Constants';

export const DangerzoneFields = ({
  cleanUpFiles,
  cleanUpFilesMessage,
  cleanUpMessageColor = 'orange',
<<<<<<< HEAD
=======
  clientPush,
  setClientPush,
  clientClassCreation,
  setClientClassCreation,
>>>>>>> 6270580cb484df46990d456af24b2e9154fbe1b1
  restartApp,
  transferApp,
  cloneApp,
  deleteApp,
<<<<<<< HEAD
  appSettings
=======
>>>>>>> 6270580cb484df46990d456af24b2e9154fbe1b1
}) => <Fieldset
  legend='Dangerzone'
  description='These options will effect your app'>
    <Field
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Push Notification from Client'
        description={<span>This settings will effect Push notifications from client permissions.
        </span>} />}
      input={
        <span style={{ textAlign: 'center' }}>
          <Toggle
            additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
            value={ clientPush === true }
            onChange={ clientPush => setClientPush(clientPush) } />
          { clientPush === true ? 'ALLOWED' : 'BLOCKED' }
        </span>
      }
      />
    <Field
      labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
      label={<Label
        text='Client Class Creation'
        description={<span>This settings will effect client class creation permission.
        </span>} />}
    input={
      <span style={{ textAlign: 'center' }}>
        <Toggle
          additionalStyles={{ display: 'block', textAlign: 'center', margin: '6px 0px 0 0' }}
          value={ clientClassCreation }
          onChange={ clientClassCreation => setClientClassCreation(clientClassCreation) } />
        { clientClassCreation === true ? 'ALLOWED' : 'BLOCKED' }
      </span>
    }
    />
    <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Clean up app'
          description={<span>This will delete any files that are not referenced by any objects. Don't use the feature if you have Arrays of Files, or Files inside Object columns.</span>} />}
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
    <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Transfer App'
          description={<span>This will transfer the app to another user. (You may not be able to access this app after it's transfered to another user.) </span>} />}
        input={<FormButton
        // additionalStyles={{ backgroundColor: 'transparent', borderColor: '#f90015', color: '#f90015' }}
        onClick={transferApp}
        value='Transfer App'/>} />
    <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Clone App'
          description={<span>Make a new clone app from this app.</span>} />}
        input={<FormButton
        // additionalStyles={{ backgroundColor: 'transparent', borderColor: '#f90015', color: '#f90015' }}
        onClick={cloneApp}
        value='Clone App'/>} />
     <Field
        labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
        label={<Label
          text='Delete App'
          description={<span>Delete this app.</span>} />}
        input={<FormButton
        additionalStyles={{ backgroundColor: '#f90015', borderColor: '#f90015', color: 'white' }}
        onClick={deleteApp}
        value='Delete App'/>} />
    {cleanUpFilesMessage ? <FormNote
      show={true}
      color={cleanUpMessageColor}>
      <div>{cleanUpFilesMessage}</div>
    </FormNote> : null}
</Fieldset>;

