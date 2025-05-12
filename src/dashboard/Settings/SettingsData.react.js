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
import B4aLoader from 'components/B4aLoader/B4aLoader.react';

const loaderContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: 'calc(100vh - 80px)',
};

export default class SettingsData extends React.Component {
  static contextType = CurrentApp;
  constructor() {
    super();

    this.state = {
      fields: undefined,
      appSettings: undefined,
      loadingSettings: true,
    };
  }

  componentDidMount() {
    console.log('mounting settings API CALLED!')
    this.context.fetchSettingsFields().then(({ fields }) => {
      this.setState({ fields, loadingSettings: false });
    });
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      // check if the changes are in currentApp serverInfo status
      // if not return without making any request
      // if (this.props.apps !== nextProps.apps) {
      //   const updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.params.appId);
      //   const prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.params.appId);
      //   const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
      //   if (!shouldUpdate) {return;}
      // }
      if (this.context.applicationId !== nextContext.applicationId) {
        console.log('received props settings API CALLED!')
        this.setState({ fields: undefined, loadingSettings: true });
        nextContext.fetchSettingsFields().then(({ fields }) => {
          this.setState({ fields, loadingSettings: false });
        });
      }
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
    if (this.state.loadingSettings) {
      return (
        <div style={loaderContainerStyle}>
          <B4aLoader />
        </div>
      );
    }

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
