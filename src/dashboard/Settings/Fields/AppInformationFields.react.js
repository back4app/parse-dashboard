import React from 'react';

import Fieldset                          from 'components/Fieldset/Fieldset.react';
import Field                             from 'components/Field/Field.react';
import Label                             from 'components/Label/Label.react';
import TextInput                         from 'components/TextInput/TextInput.react';
import {
  DEFAULT_SETTINGS_LABEL_WIDTH
}                                        from 'dashboard/Settings/Fields/Constants';

export const AppInformationFields = ({
  appName,
  setAppName,
  inProduction,
  setInProduction,
  iTunesURL,
  setiTunesURL,
  googlePlayURL,
  setGooglePlayURL,
  windowsAppStoreURL,
  setWindowsAppStoreURL,
  webAppURL,
  setWebAppURL,
  otherURL,
  setOtherURL,
}) => <Fieldset
  legend='App Information'
  description='Update general information about your app.'>
  <Field
    labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
    label={<Label text='App name' />}
    input={<TextInput
      value={appName}
      onChange={setAppName} />
    } />
</Fieldset>;
