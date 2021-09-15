import React from 'react';

import Fieldset                          from 'components/Fieldset/Fieldset.react';
import Field                             from 'components/Field/Field.react';
import Label                             from 'components/Label/Label.react';
import Range                             from 'components/Range/Range.react';
import { cost, features }                from 'dashboard/Settings/GeneralSettings.scss';
import {
  numJobsFromRequestLimit, DEFAULT_SETTINGS_LABEL_WIDTH
}                                        from 'dashboard/Settings/Fields/Constants';

export const CurrentPlan = ({requestLimit}) => {
  let costString = requestLimit === 30 ?
    'Free' :
    '$' + ((requestLimit-30) * 10).toString();
  return (
    <div>
      <div className={cost}>{costString}</div>
      <div className={features}>{requestLimit.toString() + ' requests per second'}<br/>{numJobsFromRequestLimit(requestLimit).toString() + ' background job' + (numJobsFromRequestLimit(requestLimit) > 1 ? 's' : '')}</div>
    </div>
)};

export const CurrentPlanFields = ({
  visible,
  requestLimit,
  setRequestLimit,
}) => visible ? <Fieldset
  legend='Current Plan'
  description={'Adjust your pricing and your app\u2019s request limit'}>
  <Field
    labelWidth={40}
    label={<Label
      text='Scale your app'
      description='This will take effect as soon as you save your changes.' />}
    input={<Range
      min={0}
      max={600}
      step={10}
      color='#169CEE'
      value={requestLimit}
      track={true}
      units={value => {
        let numJobs = numJobsFromRequestLimit(value);
        return value + 'req/s & ' + numJobs + ' job' + (numJobs == 1 ? '' : 's')
      }}
      width={220}
      onChange={limit => {
        if (limit < 30) {
          limit = 30;
        }
        setRequestLimit(limit);
      }} />} />
  <Field
    labelWidth={DEFAULT_SETTINGS_LABEL_WIDTH}
    label={<Label text='Your plan' />}
    input={<CurrentPlan requestLimit={requestLimit} />} />
</Fieldset> : <noscript/>;
