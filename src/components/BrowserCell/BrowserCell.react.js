/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as Filters from 'lib/Filters';
import { List, Map } from 'immutable';
import { dateStringUTC } from 'lib/DateUtils';
import getFileName from 'lib/getFileName';
import Parse from 'parse';
import Pill from 'components/Pill/Pill.react';
import React, { Component } from 'react';
import styles from 'components/BrowserCell/B4aBrowserCell.scss';
import baseStyles from 'stylesheets/base.scss';
import * as ColumnPreferences from 'lib/ColumnPreferences';
import labelStyles from 'components/Label/Label.scss';
import Modal from 'components/Modal/Modal.react';
import Tooltip from 'components/Tooltip/PopperTooltip.react';
import PropTypes from 'prop-types';

class BrowserCell extends Component {
  constructor(props) {
    super(props);

    this.cellRef = React.createRef();
    this.copyableValue = undefined;
    this.selectedScript = null;

    // Calculate initial state immediately
    const isExpanded = false;
    const { content, classes, copyableValue } = this.calculateCellData(props, isExpanded);
    this.copyableValue = copyableValue;

    this.state = {
      showTooltip: false,
      content: content,
      classes: classes,
      showConfirmationDialog: false,
      isExpanded: isExpanded,
    };
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  calculateCellData(props, isExpanded) {
    let content = props.value;
    let copyableValue = content;
    const isNewRow = props.row < 0;
    const classes = [styles.cell, baseStyles.unselectable];
    if (props.hidden) {
      content =
        props.value !== undefined || !isNewRow
          ? '(hidden)'
          : props.isRequired
            ? '(required)'
            : '(undefined)';
      classes.push(styles.empty);
    } else if (props.value === undefined) {
      if (props.type === 'ACL') {
        copyableValue = content = 'Public Read + Write';
      } else {
        copyableValue = content = '(undefined)';
        classes.push(styles.empty);
      }
      content =
        isNewRow && props.isRequired && props.value === undefined
          ? '(required)'
          : content;
    } else if (props.value === null) {
      copyableValue = content = '(null)';
      classes.push(styles.empty);
    } else if (props.value === '') {
      content = <span>&nbsp;</span>;
      classes.push(styles.empty);
    } else if (props.type === 'Pointer') {
      const defaultPointerKey = ColumnPreferences.getPointerDefaultKey(
        props.appId,
        props.value.className
      );
      let value = props.value;
      let dataValue = props.value.id || props.value.objectId;
      if (defaultPointerKey !== 'objectId') {
        dataValue = props.value.get(defaultPointerKey);
        if (dataValue && typeof dataValue === 'object') {
          if (dataValue instanceof Date) {
            dataValue = dataValue.toLocaleString();
          } else {
            if (!props.value.id) {
              dataValue = props.value.id;
            } else {
              dataValue = '(undefined)';
            }
          }
        }
        if (!dataValue) {
          if (props.value.id) {
            dataValue = props.value.id;
          } else {
            dataValue = '(undefined)';
          }
        }
      }

      if (props.value && props.value.__type) {
        const object = new Parse.Object(props.value.className);
        object.id = props.value.objectId;
        value = object;
      }

      content = props.onPointerClick ? (
        <Pill
          value={dataValue}
          onClick={props.onPointerClick.bind(undefined, value)}
          followClick={true}
          shrinkablePill
        />
      ) : (
        dataValue
      );

      copyableValue = props.value.id;
    } else if (props.type === 'Array') {
      copyableValue = content = JSON.stringify(props.value);
    } else if (props.type === 'Date') {
      let value = props.value;
      if (typeof value === 'object' && props.value.__type) {
        value = new Date(props.value.iso);
      } else if (typeof value === 'string') {
        value = new Date(props.value);
      }
      copyableValue = content = dateStringUTC(value);
    } else if (props.type === 'Boolean') {
      copyableValue = content = props.value ? 'True' : 'False';
    } else if (props.type === 'Object' || props.type === 'Bytes') {
      copyableValue = content = JSON.stringify(props.value);
    } else if (props.type === 'File') {
      const fileName = props.value
        ? props.value.url()
          ? getFileName(props.value)
          : props.value.name()
        : 'Uploading\u2026';
      content = <Pill value={fileName} fileDownloadLink={props.value.url()} shrinkablePill />;
      copyableValue = fileName;
    } else if (props.type === 'ACL') {
      const pieces = [];
      const json = props.value.toJSON();
      if (Object.prototype.hasOwnProperty.call(json, '*')) {
        if (json['*'].read && json['*'].write) {
          pieces.push('Public Read + Write');
        } else if (json['*'].read) {
          pieces.push('Public Read');
        } else if (json['*'].write) {
          pieces.push('Public Write');
        }
      }
      for (const role in json) {
        if (role !== '*') {
          pieces.push(role);
        }
      }
      if (pieces.length === 0) {
        pieces.push('Master Key Only');
      }
      copyableValue = content = pieces.join(', ');
    } else if (props.type === 'GeoPoint') {
      copyableValue =
        content = `(${props.value.latitude}, ${props.value.longitude})`;
    } else if (props.type === 'Polygon') {
      copyableValue = content = props.value.coordinates.map(coord => `(${coord})`);
    } else if (props.type === 'Relation') {
      content = props.setRelation ? (
        <div style={{ textAlign: 'center' }}>
          <Pill
            onClick={() => props.setRelation(props.value)}
            value="View relation"
            followClick={true}
            shrinkablePill
          />
        </div>
      ) : (
        'Relation'
      );
      copyableValue = undefined;
    } else if (props.type === 'String') {
      const str = props.value || '';
      copyableValue = str;
      if (str.length > 40 && !isExpanded) {
        content = (
          <span>
            {str.substring(0, 40)}...{' '}
            {!props.isEditing && (
              <span
                style={{ color: '#27AE60', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  this.setState({ isExpanded: true }, () => this.renderCellContent());
                }}
              >
                (See more)
              </span>
            )}
          </span>
        );
      } else {
        content = str;
      }
    }

    if (props.markRequiredField && props.isRequired && props.value == null) {
      classes.push(styles.required);
    }

    return { content, classes, copyableValue };
  }

  renderCellContent() {
    const { content, classes, copyableValue } = this.calculateCellData(this.props, this.state.isExpanded);
    this.copyableValue = copyableValue;
    this.setState({ ...this.state, content, classes });
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value || this.props.isEditing !== prevProps.isEditing) {
      this.renderCellContent();
      this.props.value?._previousSave
        ?.then(() => this.renderCellContent())
        ?.catch(err => console.log(err));
    }
    if (this.props.current) {
      const node = this.cellRef.current;
      const { setRelation } = this.props;
      const { left, right, bottom, top } = node.getBoundingClientRect();

      // Takes into consideration Sidebar width when over 980px wide.
      // If setRelation is undefined, DataBrowser is used as ObjectPicker, so it does not have a sidebar.
      const leftBoundary = window.innerWidth > 980 && setRelation ? 300 : 0;

      // BrowserToolbar + DataBrowserHeader height
      const topBoundary = 126;

      if (left < leftBoundary || right > window.innerWidth) {
        node.scrollIntoView({ block: 'nearest', inline: 'start' });
      } else if (top < topBoundary || bottom > window.innerHeight) {
        node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }

      if (!this.props.hidden) {
        this.props.setCopyableValue(this.copyableValue);
      }
    }
    if (prevProps.current !== this.props.current) {
      this.setState({ showTooltip: false });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextState.showTooltip !== this.state.showTooltip ||
      nextState.content !== this.state.content ||
      nextState.showConfirmationDialog !== this.state.showConfirmationDialog
    ) {
      return true;
    }
    const shallowVerifyProps = [
      ...new Set(Object.keys(this.props).concat(Object.keys(nextProps))),
    ].filter(propName => propName !== 'value');
    if (shallowVerifyProps.some(propName => this.props[propName] !== nextProps[propName])) {
      return true;
    }
    const { value } = this.props;
    const { value: nextValue } = nextProps;
    if (typeof value !== typeof nextValue) {
      return true;
    }
    const isRefDifferent = value !== nextValue;
    if (isRefDifferent && typeof value === 'object') {
      return JSON.stringify(value) !== JSON.stringify(nextValue);
    }
    return isRefDifferent;
  }

  //#region Cell Context Menu related methods

  onContextMenu(event) {
    if (event.type !== 'contextmenu') {
      return;
    }
    event.preventDefault();

    const { field, hidden, onSelect, setCopyableValue, setContextMenu, row, col } = this.props;

    onSelect({ row, col });
    setCopyableValue(hidden ? undefined : this.copyableValue);

    const available = Filters.availableFilters(
      this.props.simplifiedSchema,
      this.props.filters,
      Filters.BLACKLISTED_FILTERS
    );
    const constraints = available && available[field];

    const { pageX, pageY } = event;
    const menuItems = this.getContextMenuOptions(constraints);
    menuItems.length && setContextMenu(pageX, pageY, menuItems);
  }

  getContextMenuOptions(constraints) {
    const { onEditSelectedRow, readonly } = this.props;
    const contextMenuOptions = [];

    const setFilterContextMenuOption = this.getSetFilterContextMenuOption(constraints);
    setFilterContextMenuOption && contextMenuOptions.push(setFilterContextMenuOption);

    const addFilterContextMenuOption = this.getAddFilterContextMenuOption(constraints);
    addFilterContextMenuOption && contextMenuOptions.push(addFilterContextMenuOption);

    const relatedObjectsContextMenuOption = this.getRelatedObjectsContextMenuOption();
    relatedObjectsContextMenuOption && contextMenuOptions.push(relatedObjectsContextMenuOption);

    !readonly &&
      onEditSelectedRow &&
      contextMenuOptions.push({
        text: 'Edit row',
        callback: () => {
          const { objectId, onEditSelectedRow } = this.props;
          onEditSelectedRow(true, objectId);
        },
      });

    if (this.props.type === 'Pointer') {
      onEditSelectedRow &&
        contextMenuOptions.push({
          text: 'Open pointer in new tab',
          callback: () => {
            const { value, onPointerCmdClick } = this.props;
            onPointerCmdClick(value);
          },
        });
    }

    const { className, objectId } = this.props;
    const validScripts = (this.props.scripts || []).filter(script =>
      script.classes?.includes(this.props.className)
    );
    if (validScripts.length) {
      onEditSelectedRow &&
        contextMenuOptions.push({
          text: 'Scripts',
          items: validScripts.map(script => {
            return {
              text: script.title,
              callback: () => {
                this.selectedScript = { ...script, className, objectId };
                if (script.showConfirmationDialog) {
                  this.toggleConfirmationDialog();
                } else {
                  this.executeSript(script);
                }
              },
            };
          }),
        });
    }

    return contextMenuOptions;
  }

  async executeSript(script) {
    try {
      const object = Parse.Object.extend(this.props.className).createWithoutData(
        this.props.objectId
      );
      const response = await Parse.Cloud.run(
        script.cloudCodeFunction,
        { object: object.toPointer() },
        { useMasterKey: true }
      );
      this.props.showNote(
        response ||
          `Ran script "${script.title}" on "${this.props.className}" object "${object.id}".`
      );
      this.props.onRefresh();
    } catch (e) {
      this.props.showNote(e.message, true);
      console.log(`Could not run ${script.title}: ${e}`);
    }
  }

  toggleConfirmationDialog() {
    this.setState(prevState => ({
      showConfirmationDialog: !prevState.showConfirmationDialog,
    }));
  }

  getSetFilterContextMenuOption(constraints) {
    if (constraints) {
      return {
        text: 'Set filter...',
        items: constraints.map(constraint => {
          const definition = Filters.Constraints[constraint];
          const copyableValue = String(this.copyableValue);
          // Smart ellipsis for value - if it's long trim it in the middle: Lorem ipsum dolor si... aliqua
          const value =
            copyableValue.length < 30
              ? copyableValue
              : `${copyableValue.substr(0, 20)}...${copyableValue.substr(
                copyableValue.length - 7
              )}`;
          const text = `${this.props.field} ${definition.name}${
            definition.comparable ? ' ' + value : ''
          }`;
          return {
            text,
            callback: this.pickFilter.bind(this, constraint),
          };
        }),
      };
    }
  }

  getAddFilterContextMenuOption(constraints) {
    if (constraints && this.props.filters && this.props.filters.size > 0) {
      return {
        text: 'Add filter...',
        items: constraints.map(constraint => {
          const definition = Filters.Constraints[constraint];
          const text = `${this.props.field} ${definition.name}${
            definition.comparable ? ' ' + this.copyableValue : ''
          }`;
          return {
            text,
            callback: this.pickFilter.bind(this, constraint, true),
          };
        }),
      };
    }
  }

  /**
   * Returns "Get related records from..." context menu item if cell holds a Pointer
   * or objectId and there's a class in relation.
   */
  getRelatedObjectsContextMenuOption() {
    const { value, schema, onPointerClick } = this.props;

    const pointerClassName =
      (value && value.className) || (this.props.field === 'objectId' && this.props.className);
    if (pointerClassName) {
      const relatedRecordsMenuItem = {
        text: 'Get related records from...',
        items: [],
      };
      schema.data
        .get('classes')
        .sortBy((v, k) => k)
        .forEach((cl, className) => {
          cl.forEach((column, field) => {
            if (column.targetClass !== pointerClassName) {
              return;
            }
            relatedRecordsMenuItem.items.push({
              text: `${className}`,
              subtext: `${field}`,
              callback: () => {
                let relatedObject = value;
                if (this.props.field === 'objectId') {
                  relatedObject = new Parse.Object(pointerClassName);
                  relatedObject.id = value;
                }
                onPointerClick({
                  className,
                  id: relatedObject.toPointer(),
                  field,
                });
              },
            });
          });
        });

      return relatedRecordsMenuItem.items.length ? relatedRecordsMenuItem : undefined;
    }
  }

  pickFilter(constraint, addToExistingFilter) {
    const definition = Filters.Constraints[constraint];
    const { filters, type, value, field } = this.props;
    const newFilters = addToExistingFilter ? filters : new List();
    let compareTo;
    if (definition.comparable) {
      switch (type) {
        case 'Pointer':
          compareTo = value.toPointer();
          break;
        case 'Date':
          compareTo = value.__type
            ? value
            : {
              __type: 'Date',
              iso: value,
            };
          break;

        default:
          compareTo = value;
          break;
      }
    }

    this.props.onFilterChange(
      newFilters.push(
        new Map({
          field,
          constraint,
          compareTo,
        })
      )
    );
  }

  componentDidMount() {
    this.renderCellContent();
  }

  //#endregion

  render() {
    const {
      type,
      value,
      hidden,
      width,
      current,
      onSelect,
      onEditChange,
      setCopyableValue,
      onPointerCmdClick,
      row,
      col,
      field,
      onEditSelectedRow,
      isRequired,
      markRequiredFieldRow,
      readonly,
      handleCellClick,
      selectedCells,
    } = this.props;

    const classes = [...this.state.classes];

    if (current) {
      classes.push(styles.current);
    }
    if (markRequiredFieldRow === row && isRequired && value == null) {
      classes.push(styles.required);
    }

    let extras = null;
    if (this.state.showConfirmationDialog) {
      extras = (
        <Modal
          type={
            this.selectedScript.confirmationDialogStyle === 'critical'
              ? Modal.Types.DANGER
              : Modal.Types.INFO
          }
          icon="warn-outline"
          title={this.selectedScript.title}
          confirmText="Continue"
          cancelText="Cancel"
          onCancel={() => this.toggleConfirmationDialog()}
          onConfirm={() => {
            this.executeSript(this.selectedScript);
            this.toggleConfirmationDialog();
          }}
        >
          <div className={[labelStyles.label, labelStyles.text, styles.action].join(' ')}>
            {`Do you want to run script "${this.selectedScript.title}" on "${this.selectedScript.className}" object "${this.selectedScript.objectId}"?`}
          </div>
        </Modal>
      );
    }

    if (selectedCells?.list.has(`${row}-${col}`)) {
      if (selectedCells.rowStart === row) {
        classes.push(styles.topBorder);
      }
      if (selectedCells.rowEnd === row) {
        classes.push(styles.bottomBorder);
      }
      if (selectedCells.colStart === col) {
        classes.push(styles.leftBorder);
      }
      if (selectedCells.colEnd === col) {
        classes.push(styles.rightBorder);
      }
      classes.push(styles.selected);
    }

    const content = <span
      ref={this.cellRef}
      className={classes.join(' ')}
      style={{ width, outline: 'none' }}
      tabIndex="0"
      onBlur={() => {
        if (this.state.isExpanded) {
          this.setState({ isExpanded: false }, () => this.renderCellContent());
        }
      }}
      onClick={e => {
        if (e.metaKey === true && type === 'Pointer') {
          onPointerCmdClick(value);
        } else {
          onSelect({ row, col });
          setCopyableValue(hidden ? undefined : this.copyableValue);
          handleCellClick(e, row, col);
        }
      }}
      onDoubleClick={() => {
        // Since objectId can't be edited, double click event opens edit row dialog
        if (field === 'objectId' && onEditSelectedRow) {
          onEditSelectedRow(true, value);
        } else if (type !== 'Relation' && !readonly) {
          onEditChange(true);
        } else if (readonly) {
          this.setState({ showTooltip: true });
          setTimeout(() => {
            this.setState({ showTooltip: false });
          }, 2000);
        }
      }}
      onTouchEnd={e => {
        if (current && type !== 'Relation') {
          // The touch event may trigger an unwanted change in the column value
          if (['ACL', 'Boolean', 'File'].includes(type)) {
            e.preventDefault();
          }
        }
      }}
      onContextMenu={this.onContextMenu.bind(this)}
    >
      {this.state.content}
      {extras}
    </span>

    return (
      readonly ? (<Tooltip placement='bottom' tooltip='Read only (CTRL+C to copy)' visible={this.state.showTooltip}>{content}</Tooltip>) : content
    );
  }
}

BrowserCell.propTypes = {
  type: PropTypes.string.isRequired.describe('The column data type'),
  value: PropTypes.any.describe('The cell value (can be null/undefined as well)'),
  hidden: PropTypes.bool.describe('True if the cell value must be hidden (like passwords), false otherwise'),
  width: PropTypes.number.describe('The cell width style'),
  current: PropTypes.bool.describe('True if it is the BrowserCell selected, false otherwise'),
  onSelect: PropTypes.func.isRequired.describe('Function invoked when the selected flag should be updated'),
  onEditChange: PropTypes.func.isRequired.describe('Function invoked when the edit flag should be updated'),
  setCopyableValue: PropTypes.func.isRequired.describe('Function invoked when the copyable value has changed'),
  setRelation: PropTypes.func.isRequired.describe('Function invoked when the Relation link is clicked'),
  onPointerClick: PropTypes.func.isRequired.describe('Function invoked when the Pointer link is clicked'),
  readonly: PropTypes.bool.describe('True if the cell value is read only')
}

export default BrowserCell;
