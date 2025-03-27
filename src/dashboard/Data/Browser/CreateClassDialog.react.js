/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import semver from 'semver/preload.js';
import styles from './Browser.scss';
import Dropdown from 'components/Dropdown/Dropdown.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Option from 'components/Dropdown/Option.react';
import React from 'react';
import { SpecialClasses } from 'lib/Constants';
import TextInput from 'components/TextInput/TextInput.react';
import { withRouter } from 'lib/withRouter';
import { AmplitudeEvent } from 'lib/amplitudeEvents';

function validClassName(name) {
  return !!name.match(/^[a-zA-Z][_a-zA-Z0-9]*$/);
}

@withRouter
class CreateClassDialog extends React.Component {
  constructor() {
    super();
    this.state = {
      type: 'Custom',
      name: '',
      isProtected: true
    };
  }

  valid() {
    if (this.state.type !== 'Custom') {
      return true;
    }
    if (this.state.name.length === 0) {
      return false;
    }
    if (!validClassName(this.state.name)) {
      return false;
    }
    if (this.props.currentClasses.indexOf(this.state.name) > -1) {
      return false;
    }
    if (SpecialClasses.includes(`_${this.state.name}`)) {
      return false;
    }
    return true;
  }

  render() {
    const availableClasses = ['Custom'];
    for (const raw of SpecialClasses) {
      if (raw !== '_Session' && raw !== '_PushStatus' && !this.props.currentClasses.includes(raw)) {
        availableClasses.push(raw);
      }
    }

    const typeDropdown = (
      <Dropdown
        currentStyleClassName={styles.dropDown}
        value={this.state.type}
        onChange={(type) => this.setState({ type: type, name: '' })}>
        {availableClasses.map((t) => <Option key={t} value={t}>{t}</Option>)}
      </Dropdown>
    );
    return (
      <B4aModal
        type={B4aModal.Types.DEFAULT}
        title="Create a new class?"
        subtitle="This creates a new class to hold objects."
        disabled={!this.valid()}
        confirmText='Create class'
        cancelText={'Cancel'}
        continueText={'Create class & add columns'}
        onCancel={this.props.onCancel}
        showContinue={true}
        onContinue={async() => {
          const type = this.state.type;
          const className = type === 'Custom' ? this.state.name : type;
          await this.props.onConfirm(className, this.state.isProtected, true);
          this.props.navigate(`/apps/${this.props.currentAppSlug}/browser/${className}`);
          this.props.onAddColumn();
        }}
        onConfirm={() => {
          const type = this.state.type;
          const className = type === 'Custom' ? this.state.name : type;
          this.props.onConfirm(className, this.state.isProtected);
        }}
        width='580px'
        confirmButtonTrackEventName={AmplitudeEvent.ADD_CLASS}
      >
        {availableClasses.length > 1 ? (
          <Field label={<Label text="What type of class do you need?" />} input={typeDropdown} />
        ) : null}
        {this.state.type === 'Custom' ? (
          <Field
            label={
              <Label
                text="What should we call it?"
                description={
                  'Don\u2019t use any special characters, and start your name with a letter.'
                }
              />
            }
            input={
              <div style={{ padding: '0 1rem', width: '100%' }}>
                <TextInput
                  placeholder="Give it a good name..."
                  value={this.state.name}
                  onChange={name => this.setState({ name })}
                  dark={false}
                />
              </div>
            }
          />
        ) : null}
        {this.state.type === 'Custom' && semver.gt(this.props.parseServerVersion, '3.1.1') ?
          (<>
            <Field
              label={<Label text='Add in Protected mode' description={'Your class\'s objects are protected by default. Client read/write access will only be granted when specified by your CLPs/ACLs security rules.'} />}
              input={
                <div className={styles.radiobuttonWrapper} >
                  <input
                    id="CLP_Protected"
                    name="CLP"
                    type="radio"
                    onChange={() => this.setState({ isProtected: !this.state.isProtected })}
                    defaultChecked={this.state.isProtected}
                  /> Protected
                </div>
              }
            />
            <Field
              label={<Label text='Add in Public mode' description={'Your class’s objects are public by default. Any client has read/write access granted, which is convenient for development. We strongly recommend strengthening the security with CLPs/ACLs rules before moving to production.'} />}
              input={
                <div className={styles.radiobuttonWrapper} style={{ height: '120px' }} >
                  <input
                    id="CLP_Public"
                    name="CLP"
                    type="radio"
                    onChange={() => this.setState({ isProtected: !this.state.isProtected })}
                    defaultChecked={!this.state.isProtected}
                  /> Public Read and Write enabled
                </div>
              }
            />
          </>
          )
          : null
        }
        <div style={{ padding: '1em', borderBottom: '1px solid #e3e3e3', color: '#10203A', fontSize: '12px', opacity: '0.7' }}>
          <div style={{ fontWeight: '600' }} >Or find a public dataset to connect</div >
          <div style={{ marginBottom: '6px' }}>e.g. jobs, countries, industries, colors, zip codes and more...</div>
          <a style={{ color: '#15A9FF', textDecoration: 'underline' }} href={b4aSettings.HUB_URL} target="_blank">back4app.com/database</a>
        </div>
      </B4aModal>
    );
  }
}

export default CreateClassDialog;
