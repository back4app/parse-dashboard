/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
<<<<<<< HEAD
import PropTypes  from 'lib/PropTypes';
import ParseApp   from 'lib/ParseApp';
import React      from 'react';
=======
import React          from 'react';
import { CurrentApp } from 'context/currentApp';
import { Outlet } from 'react-router-dom';
>>>>>>> origin/upstream

export default class SettingsData extends React.Component {
  static contextType = CurrentApp;
  constructor() {
    super();

    this.state = {
      fields: undefined,
      appSettings: undefined
    };
  }

  componentDidMount() {
    this.context.fetchSettingsFields().then(({ fields }) => {
      this.setState({ fields });
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
<<<<<<< HEAD
      nextContext.currentApp.fetchSettingsFields().then(({ fields }) => {
=======
      context.fetchSettingsFields().then(({ fields }) => {
>>>>>>> origin/upstream
        this.setState({ fields });
      });
    }
  }

  saveChanges(changes) {
    let promise = this.context.saveSettingsFields(changes)
    promise.then(({successes}) => {
      let newFields = {...this.state.fields, ...successes};
      this.setState({fields: newFields});
    });
    return promise;
  }

  render() {
<<<<<<< HEAD
    return this.props.children({
      initialFields: this.state.fields,
      initialAppSettings: this.state.appSettings,
      saveChanges: this.saveChanges.bind(this)
    })
=======
    return (
      <Outlet
        context={{
          initialFields: this.state.fields,
          saveChanges: this.saveChanges.bind(this)
        }}
      />
    );
>>>>>>> origin/upstream
  }
}
