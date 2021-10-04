/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes  from 'lib/PropTypes';
import ParseApp   from 'lib/ParseApp';
import React      from 'react';

export default class SettingsData extends React.Component {
  constructor() {
    super();

    this.state = {
      fields: undefined,
      appSettings: undefined
    };
  }

  componentDidMount() {
    this.context.currentApp.fetchSettingsFields().then(({ fields }) => {
      this.setState({ fields });
    });
    this.context.currentApp.fetchAppSettings().then(( data ) => {
      this.setState({ appSettings: data });
    });
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      // check if the changes are in currentApp serverInfo status
      // if not return without making any request
      if (this.props.apps !== nextProps.apps) {
        let updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.params.appId);
        let prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.params.appId);
        const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
        if (!shouldUpdate) return;
      }
      this.setState({ fields: undefined });
      nextContext.currentApp.fetchSettingsFields().then(({ fields }) => {
        this.setState({ fields });
      });
      nextContext.currentApp.fetchAppSettings().then(( data ) => {
        this.setState({ appSettings: data });
      });
    }
  }

  saveChanges(changes) {
    let promise = this.context.currentApp.saveSettingsFields(changes)
    promise.then(({successes}) => {
      let newFields = {...this.state.fields, ...successes};
      this.setState({fields: newFields});
    });
    return promise;
  }

  render() {
    return this.props.children({
      initialFields: this.state.fields,
      initialAppSettings: this.state.appSettings,
      saveChanges: this.saveChanges.bind(this)
    })
  }
}

SettingsData.contextTypes = {
  currentApp: PropTypes.instanceOf(ParseApp)
};
