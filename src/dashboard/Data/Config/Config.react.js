/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import { ActionTypes } from 'lib/stores/ConfigStore';
import Button from 'components/Button/Button.react';
import ConfigDialog from 'dashboard/Data/Config/ConfigDialog.react';
import DeleteParameterDialog from 'dashboard/Data/Config/DeleteParameterDialog.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import Icon from 'components/Icon/Icon.react';
import { isDate } from 'lib/DateUtils';
import Parse from 'parse';
import React from 'react';
import SidebarAction from 'components/Sidebar/SidebarAction';
import subscribeTo from 'lib/subscribeTo';
import TableHeader from 'components/Table/TableHeader.react';
import TableView from 'dashboard/TableView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';

@subscribeTo('Config', 'config')
class Config extends TableView {
  constructor() {
    super();
    this.section = 'More';
    this.subsection = 'Config';
    this.action = new SidebarAction(<span><Icon width={16} height={16} name="b4a-add-outline-circle" />Add parameter</span>, this.createParameter.bind(this));
    this.state = {
      modalOpen: false,
      showDeleteParameterDialog: false,
      modalParam: '',
      modalType: 'String',
      modalValue: '',
      modalMasterKeyOnly: false,
    };
  }

  componentWillMount() {
    this.loadData();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      // check if the changes are in currentApp serverInfo status
      // if not return without making any request
      if (this.props.apps !== nextProps.apps) {
        const updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.match.params.appId);
        const prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.match.params.appId);
        const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
        if (!shouldUpdate) {return;}
      }
      nextProps.config.dispatch(ActionTypes.FETCH);
    }
  }

  onRefresh() {
    this.loadData();
  }

  loadData() {
    this.props.config.dispatch(ActionTypes.FETCH);
  }

  renderToolbar() {
    return (
      <Toolbar section="Config" >
        <a className={browserStyles.toolbarButton} style={{ margin: 0, border: 'none' }} onClick={this.onRefresh.bind(this)}>
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>
        <Button
          primary={true}
          value={
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" style={{ display: 'inline-block', marginRight: '0.5rem' }} />Add parameter</span>
          }
          color="green"
          width="auto"
          additionalStyles={{ marginLeft: '1rem', padding: '0 0.5rem', fontSize: '12px', position: 'relative' }}
          onClick={this.createParameter.bind(this)}
        />
      </Toolbar>
    );
  }

  renderExtras() {
    let extras = null;
    if (this.state.modalOpen) {
      extras = (
        <ConfigDialog
          onConfirm={this.saveParam.bind(this)}
          onCancel={() => this.setState({ modalOpen: false })}
          param={this.state.modalParam}
          type={this.state.modalType}
          value={this.state.modalValue}
          masterKeyOnly={this.state.modalMasterKeyOnly}
          parseServerVersion={this.context.serverInfo?.parseServerVersion}
        />
      );
    } else if (this.state.showDeleteParameterDialog) {
      extras = (
        <DeleteParameterDialog
          param={this.state.modalParam}
          onCancel={() => this.setState({ showDeleteParameterDialog: false })}
          onConfirm={this.deleteParam.bind(this, this.state.modalParam)}
        />
      );
    }
    return extras;
  }

  renderRow(data) {
    let value = data.value;
    let modalValue = value;
    let type = typeof value;

    if (type === 'object') {
      if (isDate(value)) {
        type = 'Date';
        value = value.toISOString();
      } else if (Array.isArray(value)) {
        type = 'Array';
        value = JSON.stringify(value);
        modalValue = value;
      } else if (value instanceof Parse.GeoPoint) {
        type = 'GeoPoint';
        value = `(${value.latitude}, ${value.longitude})`;
        modalValue = data.value.toJSON();
      } else if (data.value instanceof Parse.File) {
        type = 'File';
        value = (
          <a target="_blank" href={data.value.url()}>
            Open in new window
          </a>
        );
      } else {
        type = 'Object';
        value = JSON.stringify(value);
        modalValue = value;
      }
    } else {
      if (type === 'boolean') {
        value = value ? 'true' : 'false';
      }
      type = type.substr(0, 1).toUpperCase() + type.substr(1);
    }
    const openModal = () =>
      this.setState({
        modalOpen: true,
        modalParam: data.param,
        modalType: type,
        modalValue: modalValue,
        modalMasterKeyOnly: data.masterKeyOnly,
      });
    const columnStyleLarge = { width: '30%', cursor: 'pointer' };
    const columnStyleSmall = { width: '15%', cursor: 'pointer' };

    const openModalValueColumn = () => {
      if (data.value instanceof Parse.File) {
        return;
      }
      openModal();
    };

    const openDeleteParameterDialog = () =>
      this.setState({
        showDeleteParameterDialog: true,
        modalParam: data.param,
      });

    return (
      <tr key={data.param}>
        <td style={columnStyleLarge} onClick={openModal}>
          {data.param}
        </td>
        <td style={columnStyleSmall} onClick={openModal}>
          {type}
        </td>
        <td style={columnStyleLarge} onClick={openModalValueColumn}>
          {value}
        </td>
        <td style={columnStyleSmall} onClick={openModal}>
          {data.masterKeyOnly.toString()}
        </td>
        <td style={{ textAlign: 'center' }}>
          <a onClick={openDeleteParameterDialog}>
            <Icon width={16} height={16} name="b4a-delete-icon" fill="#E85C3E" />
          </a>
        </td>
      </tr>
    );
  }

  renderHeaders() {
    return [
      <TableHeader key="parameter" width={30}>
        Parameter
      </TableHeader>,
      <TableHeader key="type" width={15}>
        Type
      </TableHeader>,
      <TableHeader key="value" width={30}>
        Value
      </TableHeader>,
      <TableHeader key="masterKeyOnly" width={25}>
        Master key only
      </TableHeader>,
    ];
  }

  renderEmpty() {
    return (
      <B4aEmptyState
        title="Dynamically configure your app"
        description="Set up parameters that let you control the appearance or behavior of your app."
        icon="b4a-app-settings-icon"
        cta="Create your first parameter"
        action={this.createParameter.bind(this)}
      />
    );
  }

  tableData() {
    let data = undefined;
    if (this.props.config.data) {
      const params = this.props.config.data.get('params');
      const masterKeyOnlyParams = this.props.config.data.get('masterKeyOnly') || {};
      if (params) {
        data = [];
        params.forEach((value, param) => {
          const masterKeyOnly = masterKeyOnlyParams.get(param) || false;
          const type = typeof value;
          if (type === 'object' && value.__type == 'File') {
            value = Parse.File.fromJSON(value);
          } else if (type === 'object' && value.__type == 'GeoPoint') {
            value = new Parse.GeoPoint(value);
          }
          data.push({
            param: param,
            value: value,
            masterKeyOnly: masterKeyOnly,
          });
        });
        data.sort((object1, object2) => {
          return object1.param.localeCompare(object2.param);
        });
      }
    }
    return data;
  }

  saveParam({ name, value, masterKeyOnly }) {
    this.props.config
      .dispatch(ActionTypes.SET, {
        param: name,
        value: value,
        masterKeyOnly: masterKeyOnly,
      })
      .then(
        () => {
          // Send track event
          // eslint-disable-next-line no-undef
          // back4AppNavigation && back4AppNavigation.createConfigParameterEvent()
          this.setState({ modalOpen: false });
        },
        () => {
          // Catch the error
        }
      );
  }

  deleteParam(name) {
    this.props.config.dispatch(ActionTypes.DELETE, { param: name }).then(() => {
      this.setState({ showDeleteParameterDialog: false });
    });
  }

  createParameter() {
    this.setState({
      modalOpen: true,
      modalParam: '',
      modalType: 'String',
      modalValue: '',
      modalMasterKeyOnly: false,
    });
  }
}

export default Config;
