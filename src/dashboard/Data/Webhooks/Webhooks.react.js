/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import Dropdown from 'components/Dropdown/Dropdown.react';
import DropdownOption from 'components/Dropdown/Option.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import Field from 'components/Field/Field.react';
import B4aFormModal from 'components/FormModal/B4aFormModal.react';
import Icon from 'components/Icon/Icon.react';
import Label from 'components/Label/Label.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import React from 'react';
import SidebarAction from 'components/Sidebar/SidebarAction';
import subscribeTo from 'lib/subscribeTo';
import TableHeader from 'components/Table/TableHeader.react';
import TableView from 'dashboard/TableView.react';
import TextInput from 'components/TextInput/TextInput.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { ActionTypes as SchemaActionTypes } from 'lib/stores/SchemaStore';
import { ActionTypes as WebhookActionTypes } from 'lib/stores/WebhookStore';
import styles from './Webhooks.scss';

const TableWarning = ({ text }) => (
  <div>
    <Icon name="warn-outline" fill="#343445" width={20} height={20} />
    <span style={{ position: 'relative', top: '2px' }}> {text}</span>
  </div>
);

export default
@subscribeTo('Webhooks', 'webhooks')
@subscribeTo('Schema', 'schema')
class Webhooks extends TableView {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Webhooks';
    this.action = new SidebarAction(<span><Icon width={16} height={16} name="b4a-add-outline-circle" />Add webHook</span>, this.openNewWebhookModal.bind(this));
    this.state = {
      showNewWebhookModal: false,
      showEditWebhookModal: false,
      showDeleteWebhookModal: false,

      hookType: 'function',
      functionName: '',
      triggerClass: '',
      hookURL: 'https://',
    };
  }

  componentWillMount() {
    this.props.webhooks.dispatch(WebhookActionTypes.FETCH);
    this.props.schema.dispatch(SchemaActionTypes.FETCH);
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
      nextProps.webhooks.dispatch(WebhookActionTypes.FETCH);
      nextProps.schema.dispatch(SchemaActionTypes.FETCH);
    }
  }

  renderToolbar() {
    return (
      <Toolbar section="Webhooks">
        <Button
          primary={true}
          color="green"
          value={<span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" style={{ display: 'inline-block', marginRight: '0.5rem' }} />Add webHook</span>}
          onClick={this.openNewWebhookModal.bind(this)}
        />
      </Toolbar>
    );
  }

  clearFields() {
    this.setState({
      hookType: 'function',
      functionName: '',
      triggerClass: '',
      hookURL: 'https://',
    });
  }

  renderExtras() {
    let classNames = [];
    if (this.props.schema.data) {
      const classes = this.props.schema.data.get('classes');
      if (classes) {
        classNames = Object.keys(classes.toObject());
      }
    }

    const webhookModalFields = (
      <div>
        <Field
          label={
            <Label
              text="Webhook type"
              description={
                <span>
                  Learn about{' '}
                  <a
                    target="_blank"
                    href="http://docs.parseplatform.org/cloudcode/guide#cloud-code-cloud-functions"
                  >
                    functions
                  </a>{' '}
                  and{' '}
                  <a
                    target="_blank"
                    href="http://docs.parseplatform.org/cloudcode/guide#cloud-code-beforesave-triggers"
                  >
                    triggers
                  </a>
                  .
                </span>
              }
            />
          }
          input={
            <Dropdown
              onChange={value => {
                this.setState({ hookType: value });
              }}
              disabled={!this.state.showNewWebhookModal}
              value={this.state.hookType}
              fixed={true}
            >
              <DropdownOption value={'function'} key={'function'}>
                Function
              </DropdownOption>
              <DropdownOption value={'beforeSave'} key={'beforeSave'}>
                beforeSave
              </DropdownOption>
              <DropdownOption value={'afterSave'} key={'afterSave'}>
                afterSave
              </DropdownOption>
              <DropdownOption value={'beforeDelete'} key={'beforeDelete'}>
                beforeDelete
              </DropdownOption>
              <DropdownOption value={'afterDelete'} key={'afterDelete'}>
                afterDelete
              </DropdownOption>
            </Dropdown>
          }
        />
        {this.state.hookType === 'function' ? (
          <Field
            label={
              <Label
                text="Function name"
                description="This is how you will reference your webhook"
              />
            }
            input={
              <TextInput
                padding="0 1rem"
                dark={false}
                placeholder="MyWebhook"
                disabled={!this.state.showNewWebhookModal}
                onChange={value => {
                  this.setState({ functionName: value });
                }}
                value={this.state.functionName}
              />
            }
          />
        ) : (
          <Field
            label={<Label text="Choose a Class" />}
            input={
              <Dropdown
                disabled={!this.state.showNewWebhookModal}
                onChange={value => {
                  this.setState({ triggerClass: value });
                }}
                value={this.state.triggerClass}
                fixed={true}
              >
                {/*TODO(drewgross)(non-blocking) display special classes without leading underscore*/}
                {classNames.map(name => (
                  <DropdownOption key={name} value={name}>
                    {name}
                  </DropdownOption>
                ))}
              </Dropdown>
            }
          />
        )}
        <Field
          label={<Label text="Webhook URL" />}
          input={
            <TextInput
              disabled={this.state.showDeleteWebhookModal}
              onChange={value => {
                this.setState({ hookURL: value });
              }}
              value={this.state.hookURL}
              padding="0 1rem"
              dark={false}
            />
          }
        />
      </div>
    );

    const hookRequestData = ({ hookURL, hookType, functionName, triggerClass }) => {
      const data = { hookURL: hookURL };
      if (hookType === 'function') {
        data.functionName = functionName;
      } else {
        data.triggerName = hookType;
        data.triggerClass = triggerClass;
      }
      return data;
    };

    const newHookModal = (
      <B4aFormModal
        key="new"
        title="Add WebHook"
        open={this.state.showNewWebhookModal}
        onSubmit={() => {
          // Send track event
          // back4AppNavigation && back4AppNavigation.createWebhookEvent()
          return this.props.webhooks.dispatch(
            WebhookActionTypes.CREATE,
            hookRequestData(this.state)
          );
        }}
        onClose={() => {
          this.setState({ showNewWebhookModal: false });
        }}
        submitText="Create"
        inProgressText={'Creating\u2026'}
        clearFields={this.clearFields.bind(this)}
        enabled={true /* TODO: do some validation here */}
      >
        {webhookModalFields}
      </B4aFormModal>
    );

    const editHookModal = (
      <B4aFormModal
        key="edit"
        title="Change your Webhook"
        subtitle="Webhooks on external servers can be edited here."
        open={this.state.showEditWebhookModal}
        onSubmit={() => {
          return this.props.webhooks.dispatch(WebhookActionTypes.EDIT, hookRequestData(this.state));
        }}
        onClose={() => {
          this.setState({ showEditWebhookModal: false });
        }}
        submitText="Save"
        inProgressText={'Saving\u2026'}
        clearFields={this.clearFields.bind(this)}
        enabled={true /* TODO: do some validation here */}
      >
        {webhookModalFields}
      </B4aFormModal>
    );

    const deleteHookModal = (
      <B4aFormModal
        key="delete"
        title="Delete your Webhook"
        subtitle="Webhooks on external servers can be deleted here."
        open={this.state.showDeleteWebhookModal}
        type={B4aModal.Types.DANGER}
        onSubmit={() => {
          if (this.state.hookType === 'function') {
            return this.props.webhooks.dispatch(WebhookActionTypes.DELETE, {
              functionName: this.state.functionName,
            });
          } else {
            return this.props.webhooks.dispatch(WebhookActionTypes.DELETE, {
              triggerName: this.state.hookType,
              triggerClass: this.state.triggerClass,
            });
          }
        }}
        onClose={() => {
          this.setState({ showDeleteWebhookModal: false });
        }}
        submitText="Delete"
        inProgressText={'Deleting\u2026'}
        clearFields={() => {
          this.setState({
            hookType: 'function',
            functionName: '',
            triggerClass: '',
            hookURL: 'https://',
          });
        }}
        enabled={true /* TODO: do some validation here */}
      >
        {webhookModalFields}
      </B4aFormModal>
    );
    return [newHookModal, editHookModal, deleteHookModal];
  }

  renderRow(hook) {
    const showEdit = hook.url
      ? () => {
        this.setState({
          hookType: hook.functionName ? 'function' : hook.triggerName,
          functionName: hook.functionName,
          triggerClass: hook.className,
          hookURL: hook.url,
          showEditWebhookModal: true,
        });
      }
      : null;

    const showDelete = hook.url
      ? () => {
        this.setState({
          hookType: hook.functionName ? 'function' : hook.triggerName,
          functionName: hook.functionName,
          triggerClass: hook.className,
          hookURL: hook.url,
          showDeleteWebhookModal: true,
        });
      }
      : null;
    const rowStyle = hook.url ? { cursor: 'pointer' } : {};
    let deleteColumnContents = null;
    if (hook.url) {
      deleteColumnContents = (
        <button type="button" onClick={showDelete} className={styles.deleteButton}>
          <Icon name="b4a-delete-icon" fill="#E85C3E" width={16} height={16} />
        </button>
      );
    } else {
      const isOverridden = !!this.tableData().find(
        otherHook =>
          otherHook.url &&
          otherHook.functionName == hook.functionName &&
          otherHook.triggerName == hook.triggerName
      );
      if (isOverridden) {
        deleteColumnContents = <TableWarning text="Overridden" />;
      }
    }
    return (
      <tr key={JSON.stringify(hook)}>
        <td style={rowStyle} onClick={showEdit} width={'15%'}>
          {hook.functionName ? 'Function' : 'Trigger'}
        </td>
        <td style={rowStyle} onClick={showEdit} width={'15%'}>
          {hook.className || ''}
        </td>
        <td style={rowStyle} onClick={showEdit} width={'20%'}>
          {hook.functionName || hook.triggerName}
        </td>
        <td style={rowStyle} onClick={showEdit} width={'40%'}>
          {hook.url || 'Cloud Code'}
        </td>
        <td width={'10%'}>{deleteColumnContents}</td>
      </tr>
    );
  }

  renderHeaders() {
    return [
      <TableHeader width={15} key="Type">
        Type
      </TableHeader>,
      <TableHeader width={15} key="Class">
        Class
      </TableHeader>,
      <TableHeader width={20} key="Method">
        Method
      </TableHeader>,
      <TableHeader width={40} key="Destination">
        Destination
      </TableHeader>,
      <TableHeader width={10} key="Delete">
        &nbsp;
      </TableHeader>,
    ];
  }

  renderEmpty() {
    return (
      <B4aEmptyState
        title="Webhooks"
        description={
          <span style={{ color: '#C1E2FF' }}>
            Use webhooks to run Cloud Code or connect Parse to your own server.{' '}
            <a
              href="http://docs.parseplatform.org/cloudcode/guide/#cloud-code-webhooks"
              target="_blank"
              className={styles.link}
            >
              Learn more
            </a>
            .
          </span>
        }
        icon="b4a-app-settings-icon"
        cta="Add WebHook"
        action={this.openNewWebhookModal.bind(this)}
      />
    );
  }

  tableData() {
    if (this.props.webhooks.data) {
      const hooks = this.props.webhooks.data.get('webhooks');
      if (hooks) {
        return hooks.toArray();
      }
    }
    return undefined;
  }

  openNewWebhookModal() {
    this.setState({ showNewWebhookModal: true });
  }
}
