/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import ParseApp      from 'lib/ParseApp';
import PropTypes     from 'lib/PropTypes';
import React, { Component } from 'react';
import { Provider } from 'react-redux'
import { Playground, store } from 'graphql-playground-react';
import EmptyState from 'components/EmptyState/EmptyState.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import styles from 'dashboard/Data/ApiConsole/ApiConsole.scss';
import { withRouter } from 'react-router';

class GraphQLConsole extends Component {

  componentDidMount () {
    if (typeof back4AppNavigation !== 'undefined' && typeof back4AppNavigation.atGraphQLConsole === 'function')
      back4AppNavigation.atGraphQLConsole()
  }

  render() {
    const { applicationId, clientKey, graphQLServerURL, masterKey, slug } = this.context.currentApp;
    let content;
    if (!graphQLServerURL) {
      content = (
        <div className={styles.empty}>
          <EmptyState
            title='GraphQL API Console'
            description='Please update Parse-Server to version equal or above
            3.5.0 and define the "graphQLServerURL" on your app configuration
            in order to use the GraphQL API Console.'
            cta="Change Parse Version"
            action={() => {
              this.props.history.push(`/apps/${slug}/server-settings/parse-version`)
            }}
            icon='info-solid' />
        </div>
      );
    } else {
      const headers = {
        'X-Parse-Application-Id': applicationId,
        'X-Parse-Master-Key': masterKey
      }
      if (clientKey) {
        headers['X-Parse-Client-Key'] = clientKey
      }
      content = (
        <Provider store={store}>
          <div className={styles.playgroundContainer}>
            <Playground endpoint={graphQLServerURL} headers={headers} />
          </div>
        </Provider>
      );
    }

    return (
      <>
        <Toolbar section='Core' subsection='GraphQL API Console' />
        <div className={styles.content}>
          {content}
        </div>
      </>
    );
  }
}

GraphQLConsole.contextTypes = {
  currentApp: PropTypes.instanceOf(ParseApp)
};

export default withRouter(GraphQLConsole);