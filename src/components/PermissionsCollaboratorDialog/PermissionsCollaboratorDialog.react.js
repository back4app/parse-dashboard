/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import RadioButton from 'components/RadioButton/RadioButton.react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import React from 'react';
import styles from 'components/PermissionsCollaboratorDialog/PermissionsCollaboratorDialog.scss';
import { unselectable } from 'stylesheets/base.scss';
import Label from 'components/Label/Label.react';
import Field from '../Field/Field.react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'components/PermissionsCollaboratorDialog/Tabs.css'
import B4aToggle from 'components/Toggle/B4aToggle.react';

import { isEqual, mapValues } from 'lib/lodash';

const origin = new Position(0, 0);

function renderSimpleCheckboxes(feature, permissions, collaboratorsCanWrite, onChange) {
  return [
    <label key={feature + 'None' + 'label'} htmlFor={feature + 'None'}>
      <div key={feature + 'None' + 'div'} className={[styles.check, styles.second].join(' ')}>
        <RadioButton
          dark={true}
          id={feature + 'None'}
          name={feature}
          className={styles.input}
          defaultChecked={permissions && feature in permissions && permissions[feature] === 'None'}
          onChange={() => onChange(feature, 'None', permissions)}
        />None
      </div>
    </label>,
    <label key={feature + 'Read' + 'label'} htmlFor={feature + 'Read'}>
      <div key={feature + 'Read' + 'div'} className={[styles.check, styles.third].join(' ')}>
        <RadioButton
          dark={true}
          id={feature + 'Read'}
          name={feature}
          className={styles.input}
          defaultChecked={permissions && feature in permissions && permissions[feature] === 'Read'}
          onChange={() => onChange(feature, 'Read', permissions)}
        />Read
      </div>
    </label>,
    <label key={feature + 'Write' + 'label'} htmlFor={feature + 'Write'} style={(!collaboratorsCanWrite ? {opacity: 0.3} : {opacity: 1})}>
      <div key={feature + 'Write' + 'div'} className={[styles.check, styles.third].join(' ')}>
        <RadioButton
          dark={true}
          id={feature + 'Write'}
          name={feature}
          className={styles.input}
          defaultChecked={permissions && feature in permissions && permissions[feature] === 'Write'}
          onChange={() => onChange(feature, 'Write', permissions)}
          disabled={!collaboratorsCanWrite}
        />Write
      </div>
    </label>,
    (feature === 'classes' ?  <label key={feature + 'Custom' + 'label'} htmlFor={feature + 'Custom'} style={(!collaboratorsCanWrite ? {opacity: 0.3} : {opacity: 1})}>
      <div key={feature + 'Custom' + 'div'} className={[styles.check, styles.third].join(' ')}>
        <RadioButton
          dark={true}
          id={feature + 'Custom'}
          name={feature}
          className={styles.input}
          defaultChecked={permissions && feature in permissions && permissions[feature] === 'Custom'}
          onChange={() => onChange(feature, 'Custom', permissions)}
          disabled={!collaboratorsCanWrite}
        />Custom
      </div>
    </label> : '')
  ];
}

function renderSimpleLabels(permission) {
  if (permission === 'Write') {return (<span>Write</span>)}
  else if (permission === 'Read') {return (<span>Read</span>)}
  else {return (<span>None</span>)}
}

export default class PermissionsCollaboratorDialog extends React.Component {
  constructor({
    customFeaturesPermissions,
    defaultFeaturesPermissions,
    features,
    classesPermissions,
    isGDPR
  }) {
    super();

    const isDefaultFeatures = isEqual(customFeaturesPermissions, defaultFeaturesPermissions);
    const selectedClassesTab = customFeaturesPermissions === undefined || !customFeaturesPermissions['classes'] ? 'Write' : (customFeaturesPermissions['classes'] === 'Custom' ? 'CustomClasses' :  customFeaturesPermissions['classes'])

    this.state = {
      transitioning: false,
      showLevels: false,
      level: 'Simple', // 'Simple' | 'Advanced'
      customFeaturesPermissions,
      features,
      isGDPR,
      isDefaultFeatures,
      isFeaturesSelected: true,
      selectedFeaturesTab: (isDefaultFeatures ? 'Default' : 'CustomFeatures'),
      selectedClassesTab,
      classesPermissions: classesPermissions || {}
    };
  }

  setPermissions(feature, permission, customFeaturesPermissions) {
    customFeaturesPermissions[feature] = permission;
    this.setState({ customFeaturesPermissions });
  }

  setRowPermissions(appClassName, permission, classesPermissions) {
    classesPermissions[appClassName] = permission;
    this.setState({ classesPermissions });
  }

  renderFeaturesRows(isDefaultFeatures) {
    const rows = [];
    let index = 0;
    for (const feature in this.props.defaultFeaturesPermissions) {
      const text = this.state.features.label[index]
      const description = this.state.features.description[index]
      const collaboratorsCanWrite = this.state.features.collaboratorsCanWrite[index]
      const label = <Label key={text  + (isDefaultFeatures ? 'Label' : 'Input')} text={text} description={description} />
      let content = null;
      if (isDefaultFeatures) {content = renderSimpleLabels(this.props.defaultFeaturesPermissions[feature]);}
      else {content = renderSimpleCheckboxes(feature, this.state.customFeaturesPermissions, collaboratorsCanWrite, this.setPermissions.bind(this));}
      rows.push((<div key={feature + (isDefaultFeatures ? 'Label' : 'Input')}>
        <Field labelWidth={50} className={styles.label} label={label} input={content} />
        {/* <Field labelWidth={100} className={[styles.label, styles.permission].join(' ')} label={content} /> */}
      </div>))
      index++
    }
    return rows;
  }

  renderClassesRows(permissionType) {
    const rows = [];
    for (const appClassName in this.props.classesPermissions) {
      const label = <Label key={appClassName  + (permissionType === 'Custom' ? 'Label' : 'Input')} text={appClassName}/>
      let content = null;
      if (permissionType !== 'CustomClasses') {content = renderSimpleLabels(permissionType)}
      else {content = renderSimpleCheckboxes(appClassName, this.state.classesPermissions, true, this.setRowPermissions.bind(this));}
      rows.push((<div key={appClassName + (permissionType === 'Custom' ? 'Label' : 'Input')} className={styles.row}>
        <Field labelWidth={50} className={[styles.label, styles.centralizedText].join(' ')} label={label} input={content} />
        {/* <Field labelWidth={100} className={[styles.label, styles.permission].join(' ')} label={content} /> */}
      </div>))
    }
    return rows;
  }

  renderRows (isFeaturesSelected) {
    const selectedTab = isFeaturesSelected ? this.state.selectedFeaturesTab : this.state.selectedClassesTab
    switch (selectedTab) {
      case 'Default':
        return this.renderFeaturesRows(true)
      case 'CustomFeatures':
        return this.renderFeaturesRows()
      case 'Write':
        return this.renderClassesRows('Write')
      case 'Read':
        return this.renderClassesRows('Read')
      case 'None':
        return this.renderClassesRows('None')
      case 'CustomClasses':
        return this.renderClassesRows('CustomClasses')
      default:
        return this.renderFeaturesRows()
    }
  }

  render() {
    const classes = [styles.dialog, unselectable];

    return (
      <Popover fadeIn={true} fixed={true} position={origin} modal={true} color='rgba(17,13,17,0.8)'>
        <div className={classes.join(' ')}>
          <div className={styles.header}>
            {/* <p className={styles.role}>{this.props.role}</p> */}
            <p className={styles.email}>{this.props.email}</p>
            <p className={styles.description}>{this.props.description}</p>
          </div>
          <Tabs defaultIndex={0}>
            <div className={styles.subHeader}>
              <TabList className={styles.customTabList}>
                <Tab onClick={() => this.setState({ isFeaturesSelected: true })}>
                  Features
                </Tab>
                <Tab style={ this.state.isGDPR ? {} : {display: 'none'}} onClick={() => this.setState({ isFeaturesSelected: false })}>
                  Classes
                </Tab>
              </TabList>
            </div>
            <TabPanel>
              <div className={styles.labelSubHeader}>
                <B4aToggle
                  type={B4aToggle.Types.CUSTOM}
                  value={this.state.selectedFeaturesTab}
                  optionLeft="Default"
                  optionRight="Custom"
                  labelLeft="Default"
                  labelRight="Custom"
                  onChange={level => {
                    this.setState({
                      selectedFeaturesTab: level === 'Default' ? 'Default' : 'CustomFeatures',
                      isDefaultFeatures: level === 'Default' ? true : false,
                      isFeaturesSelected: true,
                    })
                  }}
                />
              </div>
            </TabPanel>
            <TabPanel>
              <div className={ [styles.label, styles.labelSubHeader, styles.classesSubHeader].join(' ') }>
                <div className={styles.labelWrap}>
                  <label className={styles.labelTab + ` ${this.state.selectedClassesTab === 'Write' ? styles.activeLabel : ''}`} htmlFor='tab3' onClick={() => this.setState({ selectedClassesTab: 'Write', isFeaturesSelected: false })}>
                    {/* <RadioButton
                      dark={true}
                      id='tab3'
                      name='Tab'
                      className={styles.radiobutton}
                      defaultChecked={this.state.selectedClassesTab === 'Write'}
                      disabled={false}
                      onClick={() => this.setState({ selectedClassesTab: 'Write', isFeaturesSelected: false })}
                    /> */}
                    Write
                  </label>
                  <label className={styles.labelTab  + ` ${this.state.selectedClassesTab === 'Read' ? styles.activeLabel : ''}`} htmlFor='tab4' onClick={() => this.setState({ selectedClassesTab: 'Read', isFeaturesSelected: false })}>
                    {/* <RadioButton
                      dark={true}
                      id='tab4'
                      name='Tab'
                      defaultChecked={this.state.selectedClassesTab === 'Read'}
                      disabled={false}
                      onClick={() => this.setState({ selectedClassesTab: 'Read', isFeaturesSelected: false })}
                    /> */}
                    Read
                  </label>
                  <label className={ styles.labelTab + ` ${this.state.selectedClassesTab === 'None' ? styles.activeLabel : ''}` } htmlFor='tab5'  onClick={() => this.setState({ selectedClassesTab: 'None', isFeaturesSelected: false })}>
                    {/* <RadioButton
                      dark={true}
                      id='tab5'
                      name='Tab'
                      className={styles.radiobutton}
                      defaultChecked={this.state.selectedClassesTab === 'None'}
                      disabled={false}
                      onClick={() => this.setState({ selectedClassesTab: 'None', isFeaturesSelected: false })}
                    /> */}
                    None
                  </label>
                  <label className={ styles.labelTab + ` ${this.state.selectedClassesTab === 'CustomClasses' ? styles.activeLabel : ''}` } htmlFor='tab6'  onClick={() => this.setState({ selectedClassesTab: 'CustomClasses', isFeaturesSelected: false })}>
                    {/* <RadioButton
                      dark={true}
                      id='tab6'
                      name='Tab'
                      defaultChecked={this.state.selectedClassesTab === 'CustomClasses'}
                      disabled={false}
                      onClick={() => this.setState({ selectedClassesTab: 'CustomClasses', isFeaturesSelected: false })}
                    /> */}
                    Custom
                  </label>
                </div>
              </div>
            </TabPanel>
            <div className={styles.tableWrap}>
              <div className={styles.table}>
                <div>
                  {this.renderRows(this.state.isFeaturesSelected)}
                </div>
                {/*<TabPanel>*/}
                {/*{this.renderFeaturesRows()}*/}
                {/*</TabPanel>*/}
              </div>
            </div>
          </Tabs>

          <div className={styles.footer}>
            <div className={styles.actions}>
              <Button
                value='Cancel'
                color="white"
                width="auto"
                additionalStyles={{ border: '1px sold #ccc', color: '#0F1C32' }}
                onClick={this.props.onCancel} />
              <Button
                primary={true}
                value={this.props.confirmText}
                onClick={() => {
                  let featuresPermissions = {}
                  let classesPermissions = {}
                  // Set features permissions
                  if (this.state.selectedFeaturesTab === 'Default') {
                    featuresPermissions = this.props.defaultFeaturesPermissions
                    this.setState({ isDefaultFeatures: true })
                  } else {
                    featuresPermissions = this.state.customFeaturesPermissions
                    this.setState({ isDefaultFeatures: false })
                  }
                  // Set classes permissions
                  if (this.state.selectedClassesTab === 'CustomClasses') {
                    classesPermissions = Object.assign({}, this.state.classesPermissions)
                    featuresPermissions['classes'] = 'Custom'
                  } else {
                    classesPermissions = mapValues(this.state.classesPermissions, () => this.state.selectedClassesTab)
                    featuresPermissions['classes'] = this.state.selectedClassesTab
                  }
                  this.props.onConfirm(featuresPermissions, classesPermissions)
                }}
              />
            </div>
          </div>
        </div>
      </Popover>
    );
  }
}
