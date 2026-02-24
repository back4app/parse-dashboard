/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import { withRouter } from 'lib/withRouter';
import TableView from 'dashboard/TableView.react';
import TableHeader from 'components/Table/TableHeader.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import Icon from 'components/Icon/Icon.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import B4aFormModal from 'components/FormModal/B4aFormModal.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import TextInput from 'components/TextInput/TextInput.react';
import FormNote from 'components/FormNote/FormNote.react';
import B4aNotification from 'dashboard/Data/Browser/B4aNotification.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';
import B4aModal from 'components/B4aModal/B4aModal.react';
import styles from './EnvironmentVariableSettings.scss';

@withRouter
export default class EnvironmentVariableSettings extends TableView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Environment Variables';

    this.state = {
      loading: true,
      loadError: null,
      initialEnvVars: {},
      draftEnvVars: {},
      initialSignature: '[]',
      rows: [],
      isDirty: false,
      saving: false,

      note: null,
      isErrorNote: false,

      showNewModal: false,
      showEditModal: false,
      showDeleteModal: false,

      modalOriginalKey: '',
      modalKey: '',
      modalValue: '',
      modalTouched: false,

      deletingKey: '',

      modal: null,
    };

    this.unblock = null;
    this.onBeforeUnloadEnvVars = null;
  }

  hasWritePermission() {
    return this.context?.isOwner !== false;
  }

  setNote(note, isErrorNote = false) {
    this.setState({ note, isErrorNote });
  }

  isValidEnvVarName(name) {
    return /^[_a-zA-Z]\w*$/.test(name);
  }

  envVarsSignature(envVarsObj) {
    const env = envVarsObj && typeof envVarsObj === 'object' ? envVarsObj : {};
    const normalized = Object.keys(env)
      .sort((a, b) => a.localeCompare(b))
      .map(k => ({
        key: String(k),
        value: env[k] == null ? '' : String(env[k]),
      }));
    return JSON.stringify(normalized);
  }

  buildRowsFromEnvVars(envVarsObj) {
    const env = envVarsObj && typeof envVarsObj === 'object' ? envVarsObj : {};
    const hiddenByKey = new Map((this.state.rows || []).map(r => [r.key, !!r.hidden]));
    return Object.keys(env)
      .sort((a, b) => a.localeCompare(b))
      .map(key => ({
        key,
        value: env[key] == null ? '' : String(env[key]),
        hidden: hiddenByKey.has(key) ? hiddenByKey.get(key) : true,
      }));
  }

  setDraftEnvVars = (nextDraft) => {
    this.setState(prev => {
      const signature = this.envVarsSignature(nextDraft);
      const rows = this.buildRowsFromEnvVars(nextDraft);
      return {
        draftEnvVars: nextDraft,
        rows,
        isDirty: signature !== prev.initialSignature,
      };
    });
  };

  async loadData() {
    try {
      this.setState({ loading: true, loadError: null });
      const result = await this.context.getEnvVars();
      const envVars = (result && result.envVars) || {};
      const rows = this.buildRowsFromEnvVars(envVars);
      const initialSignature = this.envVarsSignature(envVars);
      this.setState({
        initialEnvVars: envVars,
        draftEnvVars: envVars,
        initialSignature,
        rows,
        isDirty: false,
      });
    } catch (e) {
      this.setState({ loadError: e?.message || String(e) });
    } finally {
      this.setState({ loading: false });
    }
  }

  componentDidMount() {
    this.loadData();

    // Block in-app navigation (e.g. Sidebar) when there are unsaved changes
    if (this.props.navigator && typeof this.props.navigator.block === 'function') {
      this.unblock = this.props.navigator.block(tx => {
        if (this.state.isDirty && this.state.saving === false) {
          const unblock = this.unblock && this.unblock.bind(this);
          const autoUnblockingTx = {
            ...tx,
            retry() {
              if (unblock) {
                unblock();
              }
              tx.retry();
            },
          };

          const modal = (
            <B4aModal
              type={B4aModal.Types.DEFAULT}
              showCancel={false}
              width={380}
              icon="b4a-warn-fill-icon"
              iconSize={44}
              iconFill="#cccccc"
              title="Leave this page?"
              subtitle="Changes you made may not be saved."
              customFooter={
                <div style={{ textAlign: 'center' }}>
                  <Button
                    color="white"
                    width="auto"
                    additionalStyles={{ border: '1px solid #ccc', color: '#303338', marginRight: 12 }}
                    value="Cancel"
                    onClick={() => this.setState({ modal: null })}
                  />
                  <Button
                    primary={true}
                    color="blue"
                    width="auto"
                    value="Leave"
                    onClick={() => {
                      this.setState({ modal: null });
                      autoUnblockingTx.retry();
                    }}
                  />
                </div>
              }
            />
          );
          this.setState({ modal });
        } else {
          if (this.unblock) {
            this.unblock();
          }
          tx.retry();
        }
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const wasDirty = !!prevState?.isDirty;
    const isDirty = !!this.state.isDirty;

    if (!wasDirty && isDirty) {
      if (!this.onBeforeUnloadEnvVars) {
        this.onBeforeUnloadEnvVars = (e) => {
          e.preventDefault();
          // eslint-disable-next-line no-param-reassign
          e.returnValue = '';
          return '';
        };
      }
      window.addEventListener('beforeunload', this.onBeforeUnloadEnvVars);
    } else if (wasDirty && !isDirty) {
      window.removeEventListener('beforeunload', this.onBeforeUnloadEnvVars);
    }
  }

  componentWillUnmount() {
    if (this.unblock) {
      this.unblock();
    }
    window.removeEventListener('beforeunload', this.onBeforeUnloadEnvVars);
  }

  onRefresh = () => {
    if (this.state.isDirty) {
      const modal = (
        <B4aModal
          type={B4aModal.Types.DEFAULT}
          showCancel={false}
          width={380}
          icon="b4a-warn-fill-icon"
          iconSize={44}
          iconFill="#cccccc"
          title="Leave this page?"
          subtitle="Changes you made may not be saved."
          customFooter={
            <div style={{ textAlign: 'center' }}>
              <Button
                color="white"
                width="auto"
                additionalStyles={{ border: '1px solid #ccc', color: '#303338', marginRight: 12 }}
                value="Cancel"
                onClick={() => this.setState({ modal: null })}
              />
              <Button
                primary={true}
                color="blue"
                width="auto"
                value="Leave"
                onClick={() => {
                  this.setState({ modal: null });
                  this.cancelChanges();
                  this.loadData();
                }}
              />
            </div>
          }
        />
      );
      this.setState({ modal });
      return;
    }
    this.loadData();
  };

  toggleHidden = (key) => {
    this.setState(prev => ({
      rows: prev.rows.map(r => (r.key === key ? { ...r, hidden: !r.hidden } : r)),
    }));
  };

  validateKeyValue({ keyRaw, valueRaw, originalKey }) {
    const key = keyRaw == null ? '' : String(keyRaw);
    const value = valueRaw == null ? '' : String(valueRaw);

    if (!key.length) {
      return { error: 'Each variable must have a NAME.' };
    }
    if (!this.isValidEnvVarName(key)) {
      return { error: `Invalid variable name: ${key}` };
    }

    const keyTrim = key.trim();
    const valueTrim = value.trim();

    if (originalKey !== keyTrim && Object.prototype.hasOwnProperty.call(this.state.draftEnvVars || {}, keyTrim)) {
      return { error: `Duplicated variable name: ${keyTrim}` };
    }

    return { keyTrim, valueTrim, error: null };
  }

  cancelChanges = () => {
    const rows = this.buildRowsFromEnvVars(this.state.initialEnvVars || {});
    this.setState({
      draftEnvVars: this.state.initialEnvVars || {},
      rows,
      isDirty: false,
      note: null,
      isErrorNote: false,
      loadError: null,
      modal: null,
      showNewModal: false,
      showEditModal: false,
      showDeleteModal: false,
      modalOriginalKey: '',
      modalKey: '',
      modalValue: '',
      modalTouched: false,
      deletingKey: '',
    });
  };

  saveSettings = async () => {
    if (this.state.saving || !this.state.isDirty) {
      return;
    }
    try {
      this.setState({ saving: true, loadError: null });
      await this.context.updateEnvVars(this.state.draftEnvVars || {});
      this.setNote('Environment variables saved. Your app is being rebuilt.', false);
      await this.loadData();
    } catch (e) {
      const msg = e?.message || String(e);
      this.setNote(msg, true);
    } finally {
      this.setState({ saving: false });
    }
  };

  openNewModal = () => {
    this.setState({ showNewModal: true, modalTouched: false });
  };

  openEditModal = (row) => {
    this.setState({
      showEditModal: true,
      modalOriginalKey: row.key,
      modalKey: row.key,
      modalValue: row.value,
      modalTouched: false,
    });
  };

  openDeleteModal = (key) => {
    this.setState({ showDeleteModal: true, deletingKey: key });
  };

  clearModalFields = () => {
    this.setState({
      modalOriginalKey: '',
      modalKey: '',
      modalValue: '',
      modalTouched: false,
      deletingKey: '',
    });
  };

  modalValidationError(originalKey) {
    if (!this.state.modalTouched) {
      return '';
    }
    const { error } = this.validateKeyValue({
      keyRaw: this.state.modalKey,
      valueRaw: this.state.modalValue,
      originalKey,
    });
    return error || '';
  }

  submitCreate = () => {
    if (!this.hasWritePermission()) {
      return Promise.reject({ message: "Forbidden - You don't have permission to edit this feature." });
    }
    const { keyTrim, valueTrim, error } = this.validateKeyValue({
      keyRaw: this.state.modalKey,
      valueRaw: this.state.modalValue,
      originalKey: null,
    });
    if (error) {
      return Promise.reject({ message: error });
    }
    const next = { ...(this.state.draftEnvVars || {}) };
    next[keyTrim] = valueTrim;
    this.setDraftEnvVars(next);
    return Promise.resolve();
  };

  submitEdit = () => {
    if (!this.hasWritePermission()) {
      return Promise.reject({ message: "Forbidden - You don't have permission to edit this feature." });
    }
    const originalKey = this.state.modalOriginalKey || '';
    const { keyTrim, valueTrim, error } = this.validateKeyValue({
      keyRaw: this.state.modalKey,
      valueRaw: this.state.modalValue,
      originalKey,
    });
    if (error) {
      return Promise.reject({ message: error });
    }
    const next = { ...(this.state.draftEnvVars || {}) };
    if (originalKey && originalKey !== keyTrim) {
      delete next[originalKey];
    }
    next[keyTrim] = valueTrim;
    this.setDraftEnvVars(next);
    return Promise.resolve();
  };

  submitDelete = () => {
    if (!this.hasWritePermission()) {
      return Promise.reject({ message: "Forbidden - You don't have permission to edit this feature." });
    }
    const key = this.state.deletingKey || '';
    const next = { ...(this.state.draftEnvVars || {}) };
    delete next[key];
    this.setDraftEnvVars(next);
    return Promise.resolve();
  };

  renderToolbar() {
    const canWrite = this.hasWritePermission();
    const showBatchActions = canWrite && this.state.isDirty;
    return (
      <Toolbar section="Settings" subsection="Environment Variables">
        {showBatchActions ? (
          <>
            <Button
              color="white"
              width="auto"
              dark={true}
              additionalStyles={{ border: '1px solid rgba(249, 249, 249, .0588235294)', color: '#FFFFFF' }}
              value="Cancel"
              onClick={this.cancelChanges}
              disabled={this.state.saving}
            />
            <Button
              primary={true}
              color="green"
              width="auto"
              additionalStyles={{ marginLeft: '10px', marginRight: '30px' }}
              value={this.state.saving ? 'Saving…' : 'Save changes'}
              onClick={this.saveSettings}
              disabled={this.state.saving}
            />
          </>
        ) : null}

        <a
          className={browserStyles.toolbarButton}
          style={{
            margin: 0,
            height: '30px',
            border: '1px solid rgba(249, 249, 249, .0588235294)',
            marginRight: '10px',
          }}
          onClick={this.onRefresh}
          role="button"
          title="Refresh"
        >
          <Icon name="b4a-refresh-icon" width={18} height={18} />
        </a>

        <a
          className={browserStyles.addBtn}
          style={{
            opacity: !canWrite ? 0.5 : 1,
            cursor: !canWrite ? 'not-allowed' : 'pointer',
            marginLeft: 0,
            marginRight: 0,
            height: '30px',
            width: '30px',
            padding: '4px',
            border: '1px solid rgba(249, 249, 249, .0588235294)',
          }}
          onClick={() => {
            if (!canWrite) {
              return;
            }
            this.openNewModal();
          }}
          role="button"
          title="Add variable"
          aria-label="Add variable"
        >
          <Icon name="add-outline" width={18} height={18} />
        </a>
      </Toolbar>
    );
  }

  renderHeaders() {
    return [
      <TableHeader width={35} key="Key">
        Key
      </TableHeader>,
      <TableHeader width={55} key="Value">
        Value
      </TableHeader>,
      <TableHeader width={10} key="Delete">
        &nbsp;
      </TableHeader>,
    ];
  }

  renderRow(row) {
    const canWrite = this.hasWritePermission();
    const rowStyle = canWrite ? { cursor: 'pointer' } : {};
    const showEdit = canWrite ? () => this.openEditModal(row) : null;

    const valueText = row.hidden ? (row.value ? '••••••••' : '') : row.value;

    return (
      <tr key={row.key} className={styles.envVarRow}>
        <td style={rowStyle} onClick={showEdit} width={'35%'}>
          {row.key}
        </td>
        <td style={rowStyle} onClick={showEdit} width={'55%'}>
          <div className={styles.valueCell}>
            <span className={styles.valueText}>{valueText}</span>
            <button
              type="button"
              className={styles.valueToggleButton}
              onClick={(e) => {
                e.stopPropagation();
                this.toggleHidden(row.key);
              }}
              aria-label={row.hidden ? 'Show value' : 'Hide value'}
              title={row.hidden ? 'Show' : 'Hide'}
            >
              <Icon
                name={row.hidden ? 'b4a-visibility-off-icon' : 'b4a-visibility-icon'}
                width={18}
                height={18}
                fill="#27AE60"
              />
            </button>
          </div>
        </td>
        <td width={'10%'}>
          <button
            type="button"
            className={styles.deleteButton}
            disabled={!canWrite}
            onClick={(e) => {
              e.stopPropagation();
              if (!canWrite) {
                return;
              }
              this.openDeleteModal(row.key);
            }}
            aria-label="Delete variable"
            title="Delete"
          >
            <Icon name="b4a-delete-icon" fill="#E85C3E" width={16} height={16} />
          </button>
        </td>
      </tr>
    );
  }

  renderEmpty() {
    if (this.state.loadError) {
      return (
        <div className={styles.errorStateWrapper}>
          <EmptyGhostState
            title="Error loading environment variables"
            description={this.state.loadError}
          />
        </div>
      );
    }

    const canWrite = this.hasWritePermission();
    return (
      <B4aEmptyState
        title="Environment Variables"
        description="Customize your environment variables using KEY=VALUE format. Put each variable in one line."
        cta={canWrite ? 'Add variable' : ''}
        action={() => {
          if (!canWrite) {
            return;
          }
          this.openNewModal();
        }}
      />
    );
  }

  tableData() {
    if (this.state.loading) {
      return undefined;
    }
    if (this.state.loadError) {
      return [];
    }
    return this.state.rows;
  }

  renderExtras() {
    const canWrite = this.hasWritePermission();
    const createError = this.modalValidationError(null);
    const editError = this.modalValidationError(this.state.modalOriginalKey || '');

    const createEnabled = canWrite && (() => {
      const { error } = this.validateKeyValue({
        keyRaw: this.state.modalKey,
        valueRaw: this.state.modalValue,
        originalKey: null,
      });
      return !error;
    })();

    const editEnabled = canWrite && (() => {
      const { error } = this.validateKeyValue({
        keyRaw: this.state.modalKey,
        valueRaw: this.state.modalValue,
        originalKey: this.state.modalOriginalKey || '',
      });
      return !error;
    })();

    const newModal = (
      <B4aFormModal
        key="new"
        title="Add variable"
        open={this.state.showNewModal}
        onSubmit={this.submitCreate}
        onClose={() => this.setState({ showNewModal: false })}
        submitText="Create"
        inProgressText={'Creating\u2026'}
        clearFields={this.clearModalFields}
        enabled={createEnabled}
      >
        <Field
          label={<Label text="Key" />}
          input={
            <TextInput
              padding="0 1rem"
              dark={false}
              placeholder="MY_VARIABLE"
              onChange={(value) => this.setState({ modalKey: String(value ?? ''), modalTouched: true })}
              value={this.state.modalKey}
            />
          }
        />
        <Field
          label={<Label text="Value" />}
          input={
            <TextInput
              padding="0 1rem"
              dark={false}
              placeholder="••••••••"
              name="env_var_modal_value"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              onChange={(value) => this.setState({ modalValue: String(value ?? ''), modalTouched: true })}
              value={this.state.modalValue}
            />
          }
        />
        <FormNote show={!!createError} color="red">
          {createError}
        </FormNote>
      </B4aFormModal>
    );

    const editModal = (
      <B4aFormModal
        key="edit"
        title="Edit variable"
        open={this.state.showEditModal}
        onSubmit={this.submitEdit}
        onClose={() => this.setState({ showEditModal: false })}
        submitText="Save"
        inProgressText={'Saving\u2026'}
        clearFields={this.clearModalFields}
        enabled={editEnabled}
      >
        <Field
          label={<Label text="Key" />}
          input={
            <TextInput
              padding="0 1rem"
              dark={false}
              placeholder="MY_VARIABLE"
              onChange={(value) => this.setState({ modalKey: String(value ?? ''), modalTouched: true })}
              value={this.state.modalKey}
            />
          }
        />
        <Field
          label={<Label text="Value" />}
          input={
            <TextInput
              padding="0 1rem"
              dark={false}
              placeholder="••••••••"
              name="env_var_modal_value"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              onChange={(value) => this.setState({ modalValue: String(value ?? ''), modalTouched: true })}
              value={this.state.modalValue}
            />
          }
        />
        <FormNote show={!!editError} color="red">
          {editError}
        </FormNote>
      </B4aFormModal>
    );

    const deleteModal = (
      <B4aFormModal
        key="delete"
        title="Delete variable"
        subtitle="This action is irreversible."
        open={this.state.showDeleteModal}
        type={B4aModal.Types.DANGER}
        onSubmit={this.submitDelete}
        onClose={() => this.setState({ showDeleteModal: false })}
        submitText="Delete"
        inProgressText={'Deleting\u2026'}
        clearFields={this.clearModalFields}
        enabled={canWrite && !!this.state.deletingKey}
      />
    );

    const notification = (
      <B4aNotification
        key="note"
        note={this.state.note}
        isErrorNote={this.state.isErrorNote}
      />
    );

    return [newModal, editModal, deleteModal, notification, this.state.modal];
  }
}
