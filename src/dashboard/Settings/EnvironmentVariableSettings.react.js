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
import styles from './EnvironmentVariableSettings.scss';

@withRouter
export default class EnvironmentVariableSettings extends DashboardView {
  constructor() {
    super();
    this.section = 'App Settings';
    this.subsection = 'Environment Variable';

    this.state = {
      isLoading: true,
      loadError: null,
      rows: [],
      saving: false,
      note: null,
      isErrorNote: false,
      inlineError: null,
    };

    this._nextRowId = 1;
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
        }));
      this.setState({ rows });
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
    this.setState(prev => ({
      rows: [
        ...prev.rows,
        { id: String(this._nextRowId++), name: '', value: '', hidden: true },
      ],
      inlineError: null,
    }));
  };

  deleteRow = (id) => {
    this.setState(prev => ({
      rows: prev.rows.filter(r => r.id !== id),
      inlineError: null,
    }));
  };

  updateRow = (id, patch) => {
    this.setState(prev => ({
      rows: prev.rows.map(r => (r.id === id ? { ...r, ...patch } : r)),
      inlineError: null,
    }));
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
        <EmptyGhostState
          title="Error loading environment variables"
          description={this.state.loadError}
        />
      );
    } else {
      content = (
        <div className={styles.mainContent}>
          <div className={styles.heading}>Environment Variables</div>
          <div className={styles.subheading}>
            Your app can use these variables at both build time and runtime.
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
                          name={row.hidden ? 'b4a-visibility-icon' : 'b4a-visibility-off-icon'}
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

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.addVarButton}
              onClick={this.addRow}
              disabled={this.state.saving}
            >
              <Icon name="b4a-add-outline-circle" width={18} height={18} fill="#27AE60" />
              Add variable
            </button>

            <div className={styles.saveButtonWrap}>
              <Button
                value={this.state.saving ? 'Saving…' : 'Save Settings'}
                primary={true}
                color="green"
                onClick={this.save}
                disabled={this.state.isLoading || this.state.saving}
              />
            </div>
          </div>
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
        <Toolbar section="Settings" subsection="Environment Variable" />
        <B4aNotification note={this.state.note} isErrorNote={this.state.isErrorNote} />
      </div>
    );
  }
}
