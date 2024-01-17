/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import { CurrentApp } from 'context/currentApp';
import { Outlet } from 'react-router-dom';

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
        const updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.params.appId);
        const prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.params.appId);
        const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
        if (!shouldUpdate) {return;}
      }
      this.setState({ fields: undefined });
      nextContext.fetchSettingsFields().then(({ fields }) => {
        this.setState({ fields });
      });
    }
  }

  saveChanges(changes) {
    const promise = this.context.saveSettingsFields(changes);
    promise.then(({ successes }) => {
      const newFields = { ...this.state.fields, ...successes };
      this.setState({ fields: newFields });
    });
    return promise;
  }

  render() {
    return (
      <Outlet
        context={{
          initialFields: this.state.fields,
          saveChanges: this.saveChanges.bind(this),
        }}
      />
    );
  }
}
