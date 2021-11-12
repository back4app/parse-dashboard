/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React        from 'react';
import Field        from 'components/VisibilityField/VisibilityField.react';
import Label        from 'components/Label/Label.react';
import Toggle       from 'components/Toggle/Toggle.react';
import TextInput    from 'components/TextInput/TextInput.react';
import FormButton   from 'components/FormButton/FormButton.react';

export const component = Field;

export const demos = [
  {
    render: () => (
      <Field
        onVisibleComponent={() => <Label text='Are you a monster hunter?' description='Or have you become the monster' />}
        onHiddenComponent={
          (props) => <FormButton
            onClick={() => props.toggleVisibility(true)}
            value='Show Label'/>
        }
        />
    )
  }
];
