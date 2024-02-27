/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as Filters  from 'lib/Filters';
import Button from 'components/Button/Button.react';
import Filter from 'components/Filter/Filter.react';
import B4aFilterRow from 'components/BrowserFilter/B4aFilterRow.react';
import Icon from 'components/Icon/Icon.react';
import Popover from 'components/Popover/Popover.react';
import Label from 'components/Label/Label.react';
import Field from 'components/Field/Field.react';
import TextInput from 'components/TextInput/TextInput.react';
import Position from 'lib/Position';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from 'components/BrowserFilter/B4aBrowserFilter.scss';
import { List, Map } from 'immutable';

const POPOVER_CONTENT_ID = 'browserFilterPopover';

export default class B4aBrowserFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      editMode: true,
      filters: new List(),
      confirmName: false,
      name: '',
      blacklistedFilters: Filters.BLACKLISTED_FILTERS.concat(props.blacklistedFilters)
    };
    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this);
  }

  componentWillReceiveProps(props) {
    if (props.className !== this.props.className) {
      this.setState({ open: false });
    }
  }

  toggle() {
    let filters = this.props.filters;
    if (this.props.filters.size === 0) {
      const available = Filters.availableFilters(this.props.schema, null, this.state.blacklistedFilters);
      const field = Object.keys(available)[0];
      filters = new List([
        new Map({ field: field, constraint: available[field][0] })
      ]);
    }
    this.setState(prevState => ({
      open: !prevState.open,
      filters: filters,
      name: '',
      confirmName: false,
      editMode: this.props.filters.size === 0,
    }));
    this.props.setCurrent(null);
  }

  addRow() {
    const available = Filters.availableFilters(this.props.schema, this.state.filters, this.state.blacklistedFilters);
    const field = Object.keys(available)[0];
    this.setState(({ filters }) => ({
      filters: filters.push(
        new Map({ field: field, constraint: available[field][0] })
      )
    }));
  }

  clear() {
    this.props.onChange(new Map());
  }

  apply() {
    const formatted = this.state.filters.map(filter => {
      // TODO: type is unused?
      /*let type = this.props.schema[filter.get('field')].type;
      if (Filters.Constraints[filter.get('constraint')].hasOwnProperty('field')) {
        type = Filters.Constraints[filter.get('constraint')].field;
      }*/
      return filter;
    });
    this.props.onChange(formatted);
  }

  save() {
    const formatted = this.state.filters.map(filter => {
      const isComparable = Filters.Constraints[filter.get('constraint')].comparable;
      if (!isComparable) {
        return filter.delete('compareTo');
      }
      return filter;
    });
    this.props.onSaveFilter(formatted, this.state.name);
    this.toggle();
  }

  render() {
    let popover = null;
    const buttonStyle = [styles.entry];
    const wrapperStyle = [styles.wrap];

    if (this.state.open) {
      const position = Position.inDocument(this.node);
      const popoverStyle = [styles.popover];
      buttonStyle.push(styles.title);
      buttonStyle.push(styles.activeMenu);

      if (this.props.filters.size) {
        popoverStyle.push(styles.active);
      }
      const available = Filters.availableFilters(
        this.props.schema,
        this.state.filters
      );
      popover = (
        <Popover fixed={true} position={position} onExternalClick={this.toggle} contentId={POPOVER_CONTENT_ID}>
          <div className={popoverStyle.join(' ')} onClick={(e) => {
            e.stopPropagation()
            this.props.setCurrent(null)
          }}
          id={POPOVER_CONTENT_ID}
          >
            <Icon className={buttonStyle.join(' ')} name="b4a-browser-filter-icon" width={18} height={18} fill="#f9f9f9" onClick={this.toggle} />
            <div className={styles.body}>
              <Filter
                blacklist={this.state.blacklistedFilters}
                schema={this.props.schema}
                filters={this.state.filters}
                onChange={filters => this.setState({ filters: filters })}
                renderRow={props => (
                  <B4aFilterRow {...props} active={this.props.filters.size > 0} parentContentId={POPOVER_CONTENT_ID} />
                )}
              />
              {this.state.confirmName && (
                <div className={styles.saveFilterInputWrapper}>
                  <Field
                    label={<Label text="Filter view name" dark={true} />}
                    input={
                      <div style={{ width: '100%', padding: '0 1rem' }}>
                        <TextInput
                          placeholder="Give it a good name..."
                          value={this.state.name}
                          onChange={name => this.setState({ name })}
                        />
                      </div>
                    }
                    theme={Field.Theme.DARK}
                  />
                </div>
              )}
              {this.state.confirmName && (
                <div className={styles.footer}>
                  <div className=""></div>
                  <div className="">
                    <Button
                      color="white"
                      value="Cancel"
                      width="auto"
                      additionalStyles={{ color: '#f9f9f9' }}
                      onClick={() => this.setState({ confirmName: false })}
                    />
                    <Button
                      color="green"
                      value="Confirm"
                      disabled={!this.state.name.trim()}
                      primary={true}
                      onClick={() => this.save()}
                    />
                  </div>
                </div>
              )}
              {!this.state.confirmName && (
                <div className={styles.footer}>
                  <button
                    className={styles.addFilterBtn}
                    disabled={Object.keys(available).length === 0}
                    onClick={() => this.addRow()}
                  >
                    <div>
                      <Icon name="b4a-add-fill" width={16} height={16} fill="#27AE60" />
                      Add Filter
                    </div>
                  </button>
                  <div className="">
                    <Button
                      color="white"
                      value="Save Filters"
                      onClick={() => this.setState({ confirmName: true })}
                      width="auto"
                      additionalStyles={{ fontWeight: '500', color: '#ccc' }}
                    />
                    <Button
                      color="white"
                      value="Clear All"
                      disabled={this.state.filters.size === 0}
                      onClick={() => this.clear()}
                      width="auto"
                      additionalStyles={{ fontWeight: '500', color: '#ccc' }}
                    />
                    <Button
                      primary={true}
                      value="Apply Filter"
                      onClick={() => this.apply()}
                      width="auto"
                      additionalStyles={{ border: 'none', backgroundColor: 'transparent !important' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Popover>
      );
    }
    if (this.props.filters.size) {
      wrapperStyle.push(styles.active);
    }
    if (this.props.disabled) {
      buttonStyle.push(styles.disabled);
    }
    return (
      <div className={wrapperStyle.join(' ')} onClick={!this.props.disabled ? this.toggle : null}>
        <Icon className={buttonStyle.join(' ')} name="b4a-browser-filter-icon" width={18} height={18} fill="#f9f9f9" />
        {popover}
      </div>
    );
  }
}
