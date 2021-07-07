/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React     from 'react';
import Field     from 'components/Field/Field.react';
import Fieldset  from 'components/Fieldset/Fieldset.react';
import Label     from 'components/Label/Label.react';
import styles    from './TextInput.example.scss';
import NumericInput from 'components/NumericInput/NumericInput.react';

class Wrapper extends React.Component {
  render() {
    return <div>{this.props.children}</div>;
  }
}

export const component = TextInput;

export const demos = [
  {
    render: () => (
      <Wrapper>
        <Fieldset>
          <Field
            label={<Label text='Text input' description='This one is a single line' />}
            input={<NumericInput onChange={function(){}} />} />
          <Field
            label={<Label text='Text input' description='This one is multiline' />}
            input={<NumericInput multiline={true} onChange={function(){}} />} />
          <Field
            label={<Label text='Code input' description='This one is monospaced' />}
            input={<NumericInput monospace={true} onChange={function(){}} />} />
          <Field
            label={<Label text='Disabled input' description='This one is disabled' />}
            input={<NumericInput placeholder='Disabled' disabled={true} onChange={function(){}} />} />
          <Field
            label={<Label text='Taller input' description='This one is taller' />}
            input={<div className={styles.textarea_wrap}>
              <NumericInput height={200} placeholder='Some placeholder' multiline={true} onChange={function(){}} />
              </div>} />
        </Fieldset>
      </Wrapper>
    )
  }
];
