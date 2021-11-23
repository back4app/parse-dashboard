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
  clientPush,
  setClientPush,
  clientClassCreation,
  setClientClassCreation
}) => {
  return (
    <Fieldset
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
};
