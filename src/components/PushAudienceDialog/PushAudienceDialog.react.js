/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as Filters from 'lib/Filters';
import * as PushUtils from 'lib/PushUtils';
import * as PushConstants from 'dashboard/Push/PushConstants';
import Button from 'components/Button/Button.react';
import Field from 'components/Field/Field.react';
import Filter from 'components/Filter/Filter.react';
import FormNote from 'components/FormNote/FormNote.react';
import InstallationCondition from 'components/PushAudienceDialog/InstallationCondition.react';
import Label from 'components/Label/Label.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import B4aMultiSelect from 'components/MultiSelect/B4aMultiSelect.react';
import B4aMultiSelectOption from 'components/MultiSelect/B4aMultiSelectOption.react';
import PropTypes from 'lib/PropTypes';
import queryFromFilters from 'lib/queryFromFilters';
import React from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/PushAudienceDialog/PushAudienceDialog.scss';
import TextInput from 'components/TextInput/TextInput.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';
import { List, Map } from 'immutable';
import { CurrentApp } from 'context/currentApp';

const PARSE_SERVER_SUPPORTS_SAVED_AUDIENCES = true;
const AUDIENCE_SIZE_FETCHING_ENABLED = true;

const filterFormatter = (filters, schema) => {
  return filters.map(filter => {
    let type = schema[filter.get('field')];
    if (
      Object.prototype.hasOwnProperty.call(Filters.Constraints[filter.get('constraint')], 'field')
    ) {
      type = Filters.Constraints[filter.get('constraint')].field;
    }
    // Format any stringified fields
    if (type === 'Number') {
      return filter.set('compareTo', parseFloat(filter.get('compareTo')));
    }
    return filter;
  });
};

export default class PushAudienceDialog extends React.Component {
  static contextType = CurrentApp;
  constructor() {
    super();
    this.xhrHandle = null;
    this.state = {
      platforms: [],
      filters: new List(),
      saveForFuture: false,
      disabled: true,
      audienceName: '',
      audienceSize: undefined,
      approximate: false,
      errorMessage: undefined,
    };
  }

  componentWillMount() {
    const stateSettings = {};
    const audienceInfo = this.props.audienceInfo;
    //this case is only for 'New Segment' to prepopulate existing audience
    if (audienceInfo) {
      if (audienceInfo.query) {
        const { deviceType } = audienceInfo.query;
        stateSettings.platforms = deviceType.$in || [];
      }
      if (audienceInfo.filters) {
        stateSettings.filters = audienceInfo.filters;
      }
      if (audienceInfo.name) {
        stateSettings.audienceName = audienceInfo.name;
      }
      this.setState(stateSettings, this.fetchAudienceSize.bind(this));
    }
  }

  componentWillUnmount() {
    if (this.xhrHandle) {
      this.xhrHandle.abort();
    }
  }

  handleChange(newValue) {
    this.setState({ platforms: newValue }, this.fetchAudienceSize.bind(this));
  }

  handleAddCondition() {
    if (!this.props.schema || !Object.keys(this.props.schema).length) {
      this.setState({
        errorMessage:
          'You first need to create the Installation class before adding conditions to an audience.',
      });
      return;
    }
    const available = Filters.availableFilters(this.props.schema, this.state.filters);
    const field = Object.keys(available)[0];
    this.setState(
      ({ filters }) => ({
        filters: filters.push(new Map({ field: field, constraint: available[field][0] })),
      }),
      this.fetchAudienceSize.bind(this)
    );
  }

  handleAudienceName(name) {
    //TODO: add some client side regex validation for immediate feedback
    this.setState({ audienceName: name });
  }

  handleSaveForFuture(value) {
    this.setState({ saveForFuture: value });
  }

  fetchAudienceSize() {
    if (!this.context) {
      //so we don't break the PIG demo
      return;
    }

    let query = {};
    const parseQuery = queryFromFilters('_Installation', this.state.filters);

    if (parseQuery && parseQuery.toJSON()) {
      query = parseQuery.toJSON().where || {};
    }
    query.deviceType = { $in: this.state.platforms };
    const { xhr, promise } = this.context.fetchPushSubscriberCount(
      PushConstants.NEW_SEGMENT_ID,
      query
    );
    if (this.xhrHandle) {
      //cancel existing xhr - prevent from stacking
      this.xhrHandle.abort();
    }
    this.xhrHandle = xhr;
    promise.then(({ approximate, count }) => {
      this.setState({
        approximate,
        audienceSize: count,
      });
    });
  }

  valid() {
    if (this.state.platforms.length === 0) {
      //check that at least one platform is chosen
      return false;
    }

    if (
      (this.state.saveForFuture || this.props.disableNewSegment) &&
      this.state.audienceName.length === 0
    ) {
      //check that a name is written
      return false;
    }
    //TODO check if conditions are valid
    return true;
  }

  render() {
    const options = [];
    const availableDevices = this.props.availableDevices;
    // TODO: handle empty case when 0 devices - should display link to device creation.
    // TODO: handle misconfigured device link
    for (const index in availableDevices) {
      options.push(
        <B4aMultiSelectOption key={`device${index}`} value={availableDevices[index]}>
          {PushConstants.DEVICE_MAP[availableDevices[index]]}
        </B4aMultiSelectOption>
      );
    }
    const platformSelect = (
      <B4aMultiSelect
        endDelineator="or"
        fixed={true}
        value={this.state.platforms}
        onChange={this.handleChange.bind(this)}
        placeHolder="Choose some platforms..."
      >
        {options}
      </B4aMultiSelect>
    );
    const nonEmptyConditions = this.state.filters.size !== 0 ? true : false;
    const audienceSize = PushUtils.formatCountDetails(
      this.state.audienceSize,
      this.state.approximate,
      true
    );
    const customFooter = (
      <div className={styles.footer}>
        {AUDIENCE_SIZE_FETCHING_ENABLED ? (
          <div className={styles.audienceSize}>
            <div className={styles.audienceSizeText}>Audience size: </div>
            <div className={styles.audienceSizeDescription}>{audienceSize}</div>
          </div>
        ) : null}
        <div>
          <Button value="Cancel" color="white" onClick={this.props.secondaryAction} width="auto" additionalStyles={{ marginRight: '0.5rem' }} />
          <Button
            primary={true}
            progress={this.props.progress}
            value={this.props.progress ? 'Creating audience...' : 'Use this audience'}
            color="blue"
            disabled={!this.valid()}
            onClick={this.props.primaryAction.bind(undefined, {
              platforms: this.state.platforms,
              name: this.state.audienceName,
              filters: this.state.filters,
              formattedFilters: filterFormatter(this.state.filters, this.props.schema),
              saveForFuture: this.state.saveForFuture,
            })}
          />
        </div>
      </div>
    );

    const futureUseSegment = [];

    if (!this.props.disableNewSegment) {
      if (PARSE_SERVER_SUPPORTS_SAVED_AUDIENCES) {
        futureUseSegment.push(
          <Field
            key={'saveForFuture'}
            labelWidth={51}
            label={<Label text="Save this audience for future use?" />}
            input={
              <div style={{ padding: '0 1rem', width: '100%' }}>
                <B4aToggle
                  value={this.state.saveForFuture}
                  type={B4aToggle.Types.YES_NO}
                  onChange={this.handleSaveForFuture.bind(this)}
                />
              </div>
            }
          />
        );
      }

      if (this.state.saveForFuture) {
        futureUseSegment.push(
          <Field
            key={'audienceName'}
            labelWidth={51}
            label={<Label text="Audience name" />}
            input={
              <TextInput
                dark={false}
                padding="0 1rem"
                placeholder="Choose a name..."
                onChange={this.handleAudienceName.bind(this)}
              />
            }
          />
        );
      }
    } else {
      futureUseSegment.push(
        <Field
          key={'audienceName'}
          labelWidth={51}
          label={<Label text="Audience name" />}
          input={
            <TextInput
              dark={false}
              padding="0 1rem"
              placeholder="Choose a name..."
              onChange={this.handleAudienceName.bind(this)}
            />
          }
        />
      );
    }

    return (
      <B4aModal
        title={this.props.editMode ? 'Edit audience' : 'Create a new audience'}
        type={B4aModal.Types.DEFAULT}
        width={900}
        customFooter={customFooter}
        onCancel={this.props.secondaryAction}
      >
        <Field
          labelWidth={51}
          label={<Label text="Which platforms should be included?" />}
          input={platformSelect}
        />
        {futureUseSegment}
        <div className={styles.filter}>
          <Filter
            schema={this.props.schema}
            filters={this.state.filters}
            onChange={filters => {
              this.setState({ filters }, this.fetchAudienceSize.bind(this));
            }}
            renderRow={props => <InstallationCondition {...props} />}
          />
        </div>
        <div
          className={[
            styles.addConditions,
            nonEmptyConditions ? styles.nonEmptyConditions : '',
          ].join(' ')}
        >
          <Button
            value={<span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Icon name="b4a-add-outline-circle" width="16" height="16" fill="#10203A" />
              {nonEmptyConditions ? 'Add another condition' : 'Add a condition'}
            </span>}
            color="white"
            width="auto"
            additionalStyles={{ border: 'none' }}
            onClick={this.handleAddCondition.bind(this)}
          />
        </div>
        <FormNote
          show={Boolean(
            (this.props.errorMessage && this.props.errorMessage.length > 0) ||
              (this.state.errorMessage && this.state.errorMessage.length > 0)
          )}
          color="red"
        >
          {this.props.errorMessage || this.state.errorMessage}
        </FormNote>
      </B4aModal>
    );
  }
}

PushAudienceDialog.propTypes = {
  editMode: PropTypes.bool.describe('Flag if true to be edit mode of dialog.'),
  primaryAction: PropTypes.func.isRequired.describe(
    'Primary callback triggered when submitting modal.'
  ),
  secondaryAction: PropTypes.func.isRequired.describe(
    'Secondary callback triggered when submitting modal.'
  ),
  schema: PropTypes.object.isRequired.describe(
    'A class schema, mapping field names to their Type strings.'
  ),
  audienceInfo: PropTypes.object.describe(
    'Audience info (name, query, platforms) to prepopulate the dialog.'
  ),
  disableNewSegment: PropTypes.bool.describe(
    'Flag if true to be disable creation of a temp one time use segment.'
  ),
  availableDevices: PropTypes.arrayOf(PropTypes.string).describe(
    'List of all availableDevices devices for push notifications.'
  ),
};
