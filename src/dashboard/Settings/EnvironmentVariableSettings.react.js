/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import DashboardView from 'dashboard/DashboardView.react';
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { withRouter } from 'lib/withRouter';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import TextInput from 'components/TextInput/TextInput.react';
import Icon from 'components/Icon/Icon.react';
import Button from 'components/Button/Button.react';
import B4aNotification from 'dashboard/Data/Browser/B4aNotification.react';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';
import styles from './EnvironmentVariableSettings.scss';

@withRouter
export default class EnvironmentVariableSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Environment Variables';

    this.state = {
      isLoading: true,
      loadError: null,
      rows: [],
      saving: false,
      note: null,
      isErrorNote: false,
      inlineError: null,
      isContentTooLong: false,
      initialRowsSignature: '[]',
      isDirty: false,
    };

    this._nextRowId = 1;
  }

  rowsSignature(rows) {
    const normalized = (Array.isArray(rows) ? rows : [])
      .map(r => ({
        name: (r?.name || '').trim(),
        value: r?.value == null ? '' : String(r.value),
      }))
      .filter(({ name, value }) => name.length > 0 || value.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name) || a.value.localeCompare(b.value));
    return JSON.stringify(normalized);
  }

  isRowContentTooLongAfterEdit(row) {
    const name = row?.name ? String(row.name) : '';
    const value = row?.value ? String(row.value) : '';
    return (
      (row?.nameTouched && name.length >= 100) ||
      (row?.valueTouched && value.length >= 100)
    );
  }

  computeIsContentTooLong(rows) {
    return Array.isArray(rows) && rows.some(r => this.isRowContentTooLongAfterEdit(r));
  }

  componentDidMount() {
    this.loadData();
  }

  setNote(note, isErrorNote = false) {
    this.setState({ note, isErrorNote });
  }

  async loadData() {
    try {
      this.setState({ isLoading: true, loadError: null, inlineError: null });
      const result = await this.context.getEnvVars(); // GET
      const envVarsObj = (result && result.envVars) || {};
      const rows = Object.keys(envVarsObj)
        .sort((a, b) => a.localeCompare(b))
        .map(name => ({
          id: String(this._nextRowId++),
          name,
          value: envVarsObj[name] == null ? '' : String(envVarsObj[name]),
          hidden: true,
          nameError: null,
          nameTouched: false,
          valueTouched: false,
        }));
      const initialRowsSignature = this.rowsSignature(rows);
      this.setState({
        rows,
        // do not show/trigger "Content is too long" on initial load
        isContentTooLong: false,
        initialRowsSignature,
        isDirty: false,
      });
    } catch (e) {
      this.setState({ loadError: e?.message || String(e) });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  save = async () => {
    const { envVars, error } = this.buildEnvVarsPayload();
    if (error) { /* ... */ return; }
  
    try {
      this.setState({ saving: true, inlineError: null });
      await this.context.updateEnvVars(envVars); // POST { envVars }
      this.setNote('Environment variables saved.', false);
      await this.loadData();
    } catch (e) {
      const msg = e?.message || String(e);
      this.setState({ inlineError: msg });
      this.setNote(msg, true);
    } finally {
      this.setState({ saving: false });
    }
  };
  
  addRow = () => {
    this.setState(prev => {
      const emptyIdx = prev.rows.findIndex(r => !(r.name || '').trim());
      if (emptyIdx !== -1) {
        const rows = prev.rows.map((r, idx) =>
          idx === emptyIdx ? { ...r, nameError: 'A variable name is must!' } : r
        );
        return { rows, inlineError: null };
      }

      const nextRows = [
        ...prev.rows,
        { id: String(this._nextRowId++), name: '', value: '', hidden: true, nameError: null, nameTouched: false, valueTouched: false },
      ];
      return {
        rows: nextRows,
        inlineError: null,
        isDirty: this.rowsSignature(nextRows) !== prev.initialRowsSignature,
      };
    });
  };

  deleteRow = (id) => {
    this.setState(prev => {
      const nextRows = prev.rows.filter(r => r.id !== id);
      return {
        rows: nextRows,
        inlineError: null,
        isDirty: this.rowsSignature(nextRows) !== prev.initialRowsSignature,
      };
    });
  };

  updateRow = (id, patch) => {
    this.setState(prev => {
      const rows = prev.rows.map(r => {
        if (r.id !== id) {
          return r;
        }
        const next = { ...r, ...patch };
        if (Object.prototype.hasOwnProperty.call(patch, 'name')) {
          next.nameTouched = true;
          next.name = String(next.name || '').slice(0, 100);
          if ((next.name || '').trim().length > 0) {
            next.nameError = null;
          }
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'value')) {
          next.valueTouched = true;
          next.value = String(next.value || '').slice(0, 100);
        }
        return next;
      });
      return {
        rows,
        inlineError: null,
        isContentTooLong: this.computeIsContentTooLong(rows),
        isDirty: this.rowsSignature(rows) !== prev.initialRowsSignature,
      };
    });
  };

  toggleHidden = (id) => {
    this.setState(prev => ({
      rows: prev.rows.map(r => (r.id === id ? { ...r, hidden: !r.hidden } : r)),
    }));
  };

  buildEnvVarsPayload() {
    const trimmed = this.state.rows.map(r => ({
      ...r,
      name: (r.name || '').trim(),
      value: r.value == null ? '' : String(r.value),
    }));

    // ignore completely empty rows (new row before typing)
    const meaningful = trimmed.filter(r => r.name.length > 0 || r.value.length > 0);

    for (const row of meaningful) {
      if (!row.name.length) {
        return { error: 'Each variable must have a NAME.' };
      }
    }

    const seen = new Set();
    for (const row of meaningful) {
      const key = row.name;
      if (seen.has(key)) {
        return { error: `Duplicated variable name: ${key}` };
      }
      seen.add(key);
    }

    const envVars = {};
    meaningful.forEach(r => {
      envVars[r.name] = r.value;
    });
    return { envVars, error: null };
  }

  save = async () => {
    if (this.state.saving) {
      return;
    }
    const { envVars, error } = this.buildEnvVarsPayload();
    if (error) {
      this.setState({ inlineError: error });
      this.setNote(error, true);
      return;
    }

    try {
      this.setState({ saving: true, inlineError: null });
      await this.context.updateEnvVars(envVars);
      this.setNote('Environment variables saved.', false);
      await this.loadData();
    } catch (e) {
      const msg = e?.message || String(e);
      this.setState({ inlineError: msg });
      this.setNote(msg, true);
    } finally {
      this.setState({ saving: false });
    }
  };

  renderContent() {
    let content = null;
    if (this.state.loadError) {
      content = (
        <div className={styles.errorStateWrapper}>
          <EmptyGhostState
            title="Error loading environment variables"
            description={this.state.loadError}
          />
        </div>
      );
    } else {
      content = (
        <div className={styles.mainContent}>
          <div className={styles.heading}>Environment Variables</div>
          <div className={styles.subheading}>
            Customize your environment variables using KEY=VALUE format. Put each variable in one line
          </div>

          <div className={styles.varsList}>
            {this.state.rows.map(row => (
              <div key={row.id} className={styles.varRow}>
                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>NAME</div>
                  <div className={styles.inputShell}>
                    <TextInput
                      className={styles.rowInput}
                      height={44}
                      padding="10px 12px"
                      value={row.name}
                      placeholder="MY_VARIABLE"
                      onChange={(name) => this.updateRow(row.id, { name })}
                      disabled={this.state.saving}
                    />
                  </div>
                </div>

                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>VALUE</div>
                  <div className={styles.valueInput}>
                    <div className={`${styles.inputShell} ${styles.valueShell}`}>
                      <TextInput
                        className={styles.rowInput}
                        height={44}
                        padding="10px 44px 10px 12px"
                        value={row.value}
                        placeholder="••••••••"
                        hidden={row.hidden}
                        name={`env_var_value_${row.id}`}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        onChange={(value) => this.updateRow(row.id, { value })}
                        disabled={this.state.saving}
                      />
                      <button
                        type="button"
                        className={styles.insideIconButton}
                        onClick={() => this.toggleHidden(row.id)}
                        disabled={this.state.saving}
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
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => this.deleteRow(row.id)}
                  disabled={this.state.saving}
                  aria-label="Delete variable"
                  title="Delete"
                >
                  <Icon name="b4a-delete-icon" width={18} height={18} fill="#E85C3E" />
                </button>

                {row.nameError ? (
                  <div className={styles.rowInlineError}>{row.nameError}</div>
                ) : this.isRowContentTooLongAfterEdit(row) ? (
                  <div className={styles.rowInlineError}>Content is too long</div>
                ) : null}
              </div>
            ))}
          </div>

          {this.state.rows.length === 0 ? (
            <div className={styles.emptyState}>
              No environment variables yet
            </div>
          ) : null}

          {this.state.inlineError ? (
            <div className={styles.errorBox}>{this.state.inlineError}</div>
          ) : null}

        </div>
      );
    }

    return (
      <div>
        <B4aLoaderContainer loading={this.state.isLoading}>
          <div className={styles.content}>
            {content}
          </div>
        </B4aLoaderContainer>
        <Toolbar section="Settings" subsection="Environment Variables">
          <button
            type="button"
            className={browserStyles.addBtn}
            style={{
              opacity: this.state.saving || this.context?.isOwner === false ? 0.5 : 1,
              cursor: this.state.saving || this.context?.isOwner === false ? 'not-allowed' : 'pointer',
            }}
            onClick={() => {
              if (this.state.saving || this.context?.isOwner === false) {
                return;
              }
              this.addRow();
            }}
          >
            <Icon name="b4a-add-outline-circle" width={18} height={18} />
            <span>Add variable</span>
          </button>
          <Button
            value={this.state.saving ? 'Saving…' : 'Save Settings'}
            primary={true}
            color="green"
            onClick={this.save}
            disabled={this.state.isLoading || this.state.saving || this.state.isContentTooLong || !this.state.isDirty}
            width="auto"
            additionalStyles={{ marginLeft: '10px' }}
          />
        </Toolbar>
        <B4aNotification note={this.state.note} isErrorNote={this.state.isErrorNote} />
      </div>
    );
  }
}
