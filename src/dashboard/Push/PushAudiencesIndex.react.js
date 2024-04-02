/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as PushAudiencesStore from 'lib/stores/PushAudiencesStore';
import * as SchemaStore from 'lib/stores/SchemaStore';
import * as PushConstants from './PushConstants';
import Button from 'components/Button/Button.react';
import CategoryList from 'components/CategoryList/CategoryList.react';
import CategoryItemAction from 'components/CategoryList/CategoryItemAction.js';
import DashboardView from 'dashboard/DashboardView.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import B4aFormModal from 'components/FormModal/B4aFormModal.react';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import Modal from 'components/Modal/Modal.react';
import PushAudienceDialog from 'components/PushAudienceDialog/PushAudienceDialog.react';
import PushAudiencesIndexRow from './PushAudiencesIndexRow.react';
import queryFromFilters from 'lib/queryFromFilters';
import React from 'react';
import stylesTable from 'dashboard/TableView.scss';
import subscribeTo from 'lib/subscribeTo';
import TableHeader from 'components/Table/TableHeader.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { formatAudienceSchema } from 'lib/PushUtils';
import { List } from 'immutable';
import generatePath from 'lib/generatePath';
import { withRouter } from 'lib/withRouter';

const XHR_KEY = 'PushAudiencesIndex';

@subscribeTo('Schema', 'schema')
@subscribeTo('PushAudiences', 'pushaudiences')
@withRouter
class PushAudiencesIndex extends DashboardView {
  constructor() {
    super();
    this.section = 'More';
    this.subsection = 'Push';
    this.state = {
      availableDevices: [],
      loading: true,
      audiences: new List(),
      showDeleteAudienceModal: false,
      deletionAudienceId: null,
      deleteionAudienceName: null,
      showCreateAudienceModal: false,
    };
  }

  renderSidebar() {
    const { pathname } = this.props.location;
    const current = pathname.substr(pathname.lastIndexOf('/') + 1, pathname.length - 1);
    return (
      <CategoryList
        current={current}
        linkPrefix={'push/'}
        categories={[
          { name: 'Send New Push', id: 'new' },
          { name: 'Past Pushes', id: 'activity' },
          {
            name: 'Audiences',
            id: 'audiences',
            currentActive: current === 'audiences',
            action: new CategoryItemAction(
              'Add audience',
              this.handleCreateAudienceClick.bind(this)
            )
          }
        ]}
      />
    );
  }

  getAudienceData(createdAudiences = 0) {
    this.props.schema.dispatch(SchemaStore.ActionTypes.FETCH);
    return this.props.pushaudiences
      .dispatch(PushAudiencesStore.ActionTypes.FETCH, {
        limit: PushConstants.SHOW_MORE_LIMIT,
        min: PushConstants.INITIAL_PAGE_SIZE + createdAudiences,
        xhrKey: XHR_KEY,
      })
  }

  componentWillMount() {
    this.getAudienceData().catch((err) => {
      console.error(err)
    }).finally(() => {
      this.setState({ loading: false });
    });

    this.context.fetchAvailableDevices().then(
      ({ available_devices }) => {
        this.setState({
          availableDevices: available_devices,
        });
      },
      () => {
        this.setState({
          availableDevices: PushConstants.DEFAULT_DEVICES,
        });
      }
    );
  }

  componentWillReceiveProps(props) {
    if (props.loaded) {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    this.props.pushaudiences.dispatch(PushAudiencesStore.ActionTypes.ABORT_FETCH, {
      xhrKey: XHR_KEY,
    });
  }

  handleCreateAudienceClick() {
    this.setState({
      showCreateAudienceModal: true,
    });
  }

  tableData() {
    const schema = formatAudienceSchema(this.props.schema.data.get('classes')) || {};
    const pushAudienceData = this.props.pushaudiences.data;
    let audiences = undefined;

    if (pushAudienceData) {
      audiences = pushAudienceData.get('audiences') || new List();
    }

    this.schema = schema;
    return audiences;
  }

  handleDelete(objectId, objectName) {
    this.setState({
      showDeleteAudienceModal: true,
      deletionAudienceId: objectId,
      deleteionAudienceName: objectName,
    });
  }

  handleSendPush(objectId) {
    this.props.navigate(generatePath(this.context, `push/new?audienceId=${objectId}`));
  }

  renderRow(audience) {
    return (
      <PushAudiencesIndexRow
        key={audience.objectId}
        id={`${audience.objectId}`}
        name={audience.name}
        query={audience.query}
        createdAt={new Date(audience.createdAt)}
        schema={this.schema}
        timesUsed={audience.timesUsed}
        onSendPush={this.handleSendPush.bind(this)}
        onDelete={this.handleDelete.bind(this)}
      />
    );
  }

  renderToolbar() {
    return (
      <Toolbar section="Push" subsection="Audiences">
        <Button
          color="green"
          primary={true}
          value="Create an audience"
          onClick={this.handleCreateAudienceClick.bind(this)}
        />
      </Toolbar>
    );
  }

  renderHeaders() {
    return [
      <TableHeader key="name" width={20}>
        Name
      </TableHeader>,
      <TableHeader key="size" width={10}>
        Size
      </TableHeader>,
      <TableHeader key="details" width={30}>
        Details
      </TableHeader>,
      <TableHeader key="created_on" width={20}>
        Created On
      </TableHeader>,
      <TableHeader key="pushes_sent" width={10}>
        # of sends
      </TableHeader>,
      <TableHeader key="action" width={10}>
        Action
      </TableHeader>,
    ];
  }

  renderEmpty() {
    if (this.state.availableDevices.length === 0) {
      return (
        <B4aEmptyState
          title="No registered devices"
          description="You have no registered installations of your app. You can get started with our Quick Start guide."
          icon="devices-solid"
          cta="Push Quick Start"
          action={'https://www.parse.com/apps/quickstart#parse_push'}
        />
      );
    } else {
      return (
        <B4aEmptyState
          title="No push audiences to display yet."
          icon="b4a-app-settings-icon"
          cta="Create your first audience"
          action={() => {
            this.setState({
              showCreateAudienceModal: true,
            });
          }}
        />
      );
    }
  }

  createAudience(modalState, { platforms, name, formattedFilters }) {
    let query = {};

    const parseQuery = queryFromFilters('_Installation', formattedFilters);

    if (parseQuery && parseQuery.toJSON()) {
      query = parseQuery.toJSON().where || {};
    }

    query.deviceType = { $in: platforms };
    //TODO: handle fail case - need to modify/extend <B4aFormModal> to handle custom footer
    this.props.pushaudiences
      .dispatch(PushAudiencesStore.ActionTypes.CREATE, {
        query: JSON.stringify(query),
        name,
      })
      .then(() => {
        this.setState({
          showCreateAudienceModal: false,
        });
        // After create the new audience update audience's list to get the
        // new objectId
        this.setState({ loading: true });
        this.getAudienceData(1).then(() => {
          this.setState({ loading: false });
        }).catch(err => {
          console.error(err)
          this.setState({ loading: false });
        })
      });
  }

  renderContent() {
    const toolbar = this.renderToolbar();
    const data = this.tableData();
    let content = null;
    let headers = null;

    const createAudienceModal = this.state.showCreateAudienceModal ? (
      <PushAudienceDialog
        availableDevices={this.state.availableDevices}
        schema={this.schema}
        disableNewSegment={true}
        audienceSize={999999}
        primaryAction={this.createAudience.bind(this, 'showCreateModal')}
        secondaryAction={() => {
          this.setState({
            showCreateAudienceModal: false,
          });
        }}
      />
    ) : null;

    const deleteSubtitle = (
      <div>
        Are you sure you want to delete <strong>{this.state.deleteionAudienceName}</strong>?
      </div>
    );

    const deleteAudienceModal = (
      <B4aFormModal
        title="Delete Audience"
        subtitle={deleteSubtitle}
        type={Modal.Types.DANGER}
        open={this.state.showDeleteAudienceModal}
        submitText="Delete"
        inProgressText={'Deleting\u2026'}
        onSubmit={() => {
          return this.props.pushaudiences.dispatch(PushAudiencesStore.ActionTypes.DESTROY, {
            objectId: this.state.deletionAudienceId,
          });
        }}
        onSuccess={() => {
          this.setState({
            showDeleteAudienceModal: false,
          });
        }}
        onClose={() => {
          this.setState({ showDeleteAudienceModal: false });
        }}
      ></B4aFormModal>
    );

    if (typeof data !== 'undefined') {
      if (data.size === 0) {
        content = <div className={stylesTable.empty}>{this.renderEmpty()}</div>;
      } else {
        content = (
          <div className={stylesTable.rows}>
            <table>
              <tbody>{data.map(row => this.renderRow(row))}</tbody>
            </table>
          </div>
        );
        headers = this.renderHeaders();
      }
    }
    const extras = this.renderExtras ? this.renderExtras() : null;
    return (
      <div>
        <B4aLoaderContainer loading={this.state.loading}>
          <div className={stylesTable.content}>{content}</div>
        </B4aLoaderContainer>
        {toolbar}
        <div className={stylesTable.headers}>{headers}</div>
        {extras}
        {deleteAudienceModal}
        {createAudienceModal}
      </div>
    );
  }
}

export default PushAudiencesIndex;
