import React from 'react';
import Parse from 'parse';
import { dateStringUTC } from 'lib/DateUtils';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import TextInput from 'components/TextInput/TextInput.react';
import DateTimeInput from 'components/DateTimeInput/DateTimeInput.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';
import Pill from 'components/Pill/Pill.react';
import GeoPointEditor from 'components/GeoPointEditor/GeoPointEditor.react';
import FileEditor from 'components/FileEditor/FileEditor.react';
import B4aObjectPickerDialog from 'dashboard/Data/Browser/B4aObjectPickerDialog.react';
import styles from 'dashboard/Data/Browser/Browser.scss';
import getFileName from 'lib/getFileName';
import encode from 'parse/lib/browser/encode';
import validateNumeric from 'lib/validateNumeric';

export default class EditRowDialog extends React.Component {
  constructor(props) {
    super(props);

    const { selectedObject } = this.props;
    const { currentObject, openObjectPickers, expandedTextAreas } =
      this.initializeState(selectedObject);
    this.state = {
      currentObject,
      openObjectPickers,
      expandedTextAreas,
      showFileEditor: null,
    };

    this.updateCurrentObject = this.updateCurrentObject.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.openAcl = this.openAcl.bind(this);
    this.openPointer = this.openPointer.bind(this);
    this.toggleObjectPicker = this.toggleObjectPicker.bind(this);
    this.openRelation = this.openRelation.bind(this);
    this.openFileEditor = this.openFileEditor.bind(this);
    this.hideFileEditor = this.hideFileEditor.bind(this);
  }

  componentWillReceiveProps(props) {
    const newSelectedObject = props.selectedObject;
    const previousSelectedObject = this.props.selectedObject;
    if (newSelectedObject.id !== previousSelectedObject.id) {
      const { currentObject, openObjectPickers, expandedTextAreas } =
        this.initializeState(newSelectedObject);
      this.setState({ currentObject, openObjectPickers, expandedTextAreas });
    } else if (newSelectedObject.updatedAt !== previousSelectedObject.updatedAt) {
      this.updateCurrentObjectFromProps(newSelectedObject);
    }
  }

  initializeState(newObject) {
    const { columns } = this.props;
    const currentObject = { ...newObject };
    const openObjectPickers = {};
    const expandedTextAreas = {};
    columns.forEach(column => {
      const { name, type } = column;
      if (['Array', 'Object'].indexOf(type) >= 0) {
        // This is needed to avoid unwanted conversions of objects to Parse.Objects.
        // "Parse._encoding" is responsible to convert Parse data into raw data.
        // Since array and object are generic types, we want to render them the way
        // they were stored in the database.
        const val = encode(currentObject[name], undefined, true);
        const stringifyValue = JSON.stringify(val, null, 4);
        currentObject[name] = stringifyValue;
        const rows = stringifyValue ? stringifyValue.split('\n').length : 1;
        expandedTextAreas[name] = { rows: rows, expanded: false };
      }
      if (type === 'Polygon') {
        const stringifyValue = JSON.stringify(
          (currentObject[name] && currentObject[name].coordinates) || [['lat', 'lon']],
          null,
          4
        );
        currentObject[name] = stringifyValue;
        const rows = stringifyValue ? stringifyValue.split('\n').length : 1;
        expandedTextAreas[name] = { rows: rows, expanded: false };
      }
      if (['Pointer', 'Relation'].indexOf(type) >= 0) {
        openObjectPickers[name] = false;
      }
    });

    return { currentObject, openObjectPickers, expandedTextAreas };
  }

  updateCurrentObject(newValue, name) {
    const { currentObject } = this.state;
    currentObject[name] = newValue;
    this.setState({ currentObject });
  }

  updateCurrentObjectFromProps(newObject) {
    const { columns } = this.props;
    const { currentObject, expandedTextAreas } = this.state;
    columns.forEach(column => {
      const { name, type } = column;
      if (['String', 'Number'].indexOf(type) >= 0) {
        currentObject[name] = newObject[name];
      }
      if (['Array', 'Object'].indexOf(type) >= 0) {
        const stringifyValue = JSON.stringify(newObject[name], null, 4);
        currentObject[name] = stringifyValue;
        const rows = stringifyValue ? stringifyValue.split('\n').length : 1;
        expandedTextAreas[name].rows = rows;
      }
      if (type === 'Polygon') {
        const stringifyValue = JSON.stringify(
          (newObject[name] && newObject[name].coordinates) || [['lat', 'lon']],
          null,
          4
        );
        currentObject[name] = stringifyValue;
        const rows = stringifyValue ? stringifyValue.split('\n').length : 1;
        expandedTextAreas[name].rows = rows;
      }
    });
    this.setState({ currentObject, expandedTextAreas });
  }

  handleChange(newValue, name, type, targetClass, toDelete) {
    if (name == 'password') {
      if (newValue === '') {
        return false;
      } else {
        const { currentObject } = this.state;
        currentObject.password = '';
      }
    }
    const { selectedObject, className, updateRow, confirmAttachSelectedRows, useMasterKey } =
      this.props;
    if (type === 'Relation') {
      if (toDelete.length > 0) {
        selectedObject[name].remove(toDelete);
        selectedObject[name].parent.save(null, { useMasterKey });
      }
      if (newValue.length > 0) {
        confirmAttachSelectedRows(className, selectedObject.id, name, newValue, targetClass);
      }
      this.toggleObjectPicker(name, false);
    } else {
      if (['Array', 'Object', 'Polygon'].indexOf(type) >= 0) {
        const { selectedObject } = this.props;
        const { currentObject, expandedTextAreas } = this.state;
        const oldStringifyValue = JSON.stringify(
          type === 'Polygon' ? selectedObject[name].coordinates : selectedObject[name],
          null,
          4
        );
        const stringifyValue = JSON.stringify(newValue, null, 4);
        if (oldStringifyValue === stringifyValue) {
          return;
        }
        currentObject[name] = stringifyValue;
        const rows = stringifyValue ? stringifyValue.split('\n').length : 1;
        expandedTextAreas[name].rows = rows;
        if (type === 'Polygon') {
          newValue = {
            __type: type,
            coordinates: newValue,
          };
        }
      }
      if (type === 'Pointer') {
        // when Pointer newValue is array with length 0 or 1
        const pointerId = newValue[0];
        newValue = pointerId
          ? Parse.Object.fromJSON({
            className: targetClass,
            objectId: pointerId,
          })
          : undefined;
        this.toggleObjectPicker(name, false);
      }
      updateRow(selectedObject.row, name, newValue);
    }
  }

  openAcl() {
    const { selectedObject, columns, handleShowAcl } = this.props;
    const { row } = selectedObject;
    const col = columns.findIndex(c => c.name === 'ACL');
    handleShowAcl(row, col);
  }

  openPointer(className, id) {
    const { onClose, handlePointerClick } = this.props;
    onClose();
    handlePointerClick({ className: className, id: id });
  }

  openRelation(relation) {
    const { onClose, setRelation } = this.props;
    onClose();
    setRelation(relation);
  }

  toggleObjectPicker(name, isOpen) {
    const { openObjectPickers } = this.state;
    openObjectPickers[name] = isOpen;
    this.setState({ openObjectPickers });
  }

  toggleExpandTextArea(name) {
    const { expandedTextAreas } = this.state;
    expandedTextAreas[name].expanded = !expandedTextAreas[name].expanded;
    this.setState({ expandedTextAreas });
  }

  openFileEditor(column) {
    this.setState({
      showFileEditor: column,
    });
  }

  hideFileEditor() {
    this.setState({
      showFileEditor: null,
    });
  }

  render() {
    const { selectedObject, className, columns, onClose, schema, useMasterKey } = this.props;
    const { currentObject, openObjectPickers, expandedTextAreas } = this.state;

    const fields = columns.map(column => {
      const { name, type, targetClass } = column;

      const isHidden = ['objectId', 'createdAt', 'updatedAt', 'ACL'].indexOf(name) >= 0;

      if (isHidden) {
        return;
      }

      let inputComponent;

      const isDisabled =
        (className === '_User' && ['authData'].indexOf(name) >= 0) ||
        (selectedObject.id && className === '_Role' && ['name'].indexOf(name) >= 0) ||
        (className === '_Session' &&
          [
            'sessionToken',
            'expiresAt',
            'user',
            'createdWith',
            'installationId',
            'restricted',
          ].indexOf(name) >= 0);

      const val = currentObject[name];
      switch (type) {
        case 'String':
          inputComponent = (
            <TextInput
              multiline={currentObject[name] && currentObject[name].length > 25 ? true : false}
              disabled={isDisabled}
              placeholder={
                name === 'password' ? '(hidden)' : val === undefined ? '(undefined)' : ''
              }
              value={currentObject[name]}
              onChange={newValue => this.updateCurrentObject(newValue, name)}
              onBlur={newValue => this.handleChange(newValue, name)}
              dark={false}
            />
          );
          break;
        case 'Number':
          inputComponent = (
            <TextInput
              disabled={isDisabled}
              value={currentObject[name]}
              placeholder={val === undefined ? '(undefined)' : ''}
              onChange={newValue =>
                this.updateCurrentObject(
                  validateNumeric(newValue) ? newValue : currentObject[name],
                  name
                )
              }
              onBlur={newValue =>
                this.handleChange(
                  validateNumeric(parseFloat(newValue)) ? parseFloat(newValue) : undefined,
                  name
                )
              }
              dark={false}
            />
          );
          break;
        case 'Array':
        case 'Object':
        case 'Polygon':
          inputComponent = (
            <TextInput
              multiline={true}
              rows={
                expandedTextAreas[name] &&
                expandedTextAreas[name].expanded &&
                expandedTextAreas[name].rows
              }
              disabled={isDisabled}
              placeholder={val === undefined && '(undefined)'}
              value={currentObject[name]}
              onChange={newValue => this.updateCurrentObject(newValue, name)}
              onBlur={newValue => this.handleChange(JSON.parse(newValue), name, type)}
              dark={false}
            />
          );
          break;
        case 'Boolean':
          inputComponent = isDisabled ? (
            <TextInput
              disabled={true}
              placeholder={val === undefined && '(undefined)'}
              value={selectedObject[name]}
              dark={false}
            />
          ) : (
            <div style={{ paddingTop: '20px' }}>
              <B4aToggle
                type={B4aToggle.Types.TRUE_FALSE}
                value={selectedObject[name]}
                onChange={newValue => this.handleChange(newValue, name)}
              />
            </div>
          );
          break;
        case 'Date':
          inputComponent = (
            <DateTimeInput
              disabled={isDisabled}
              value={selectedObject[name]}
              onChange={newValue => this.handleChange(newValue, name)}
              dark={false}
              xPaddingWidth={16}
              width={260}
            />
          );
          break;
        case 'GeoPoint':
          inputComponent = (
            <GeoPointEditor
              disableAutoFocus={true}
              value={selectedObject[name]}
              style={{ position: 'inherit', background: 'none', boxShadow: 'none', height: '100%', padding: 0 }}
              onCommit={newValue => this.handleChange(newValue, name)}
              dark={false}
            />
          );
          break;
        case 'File':
          const file = selectedObject[name];
          const fileName = file ? (file.url() ? getFileName(file) : file.name()) : '';
          inputComponent = (
            <div className={[styles.editRowDialogFileCell]}>
              {file && <Pill value={fileName} fileDownloadLink={file.url()} dark={false} />}
              <div style={{ cursor: 'pointer', paddingTop: file ? 0 : '12px', }}>
                <Pill
                  value={file ? 'Change file' : 'Select file'}
                  onClick={() => this.openFileEditor(name)}
                  dark={false}
                />
                {this.state.showFileEditor === name && (
                  <FileEditor
                    value={file}
                    onCancel={this.hideFileEditor}
                    onCommit={newValue => this.handleChange(newValue, name)}
                  />
                )}
              </div>
            </div>
          );
          break;
        case 'Pointer':
          const pointerId = selectedObject[name] && selectedObject[name].id;
          inputComponent = openObjectPickers[name] ? (
            <B4aObjectPickerDialog
              schema={schema}
              column={column}
              className={targetClass}
              pointerId={pointerId}
              onConfirm={newValue => this.handleChange(newValue, name, type, targetClass)}
              onCancel={() => this.toggleObjectPicker(name, false)}
              useMasterKey={useMasterKey}
            />
          ) : (
            <div
              style={{
                cursor: 'pointer',
                maxWidth: '60%',
                paddingTop: pointerId ? '17px' : '30px',
              }}
            >
              {pointerId && (
                <Pill
                  onClick={() => this.openPointer(targetClass, pointerId)}
                  value={pointerId}
                  followClick={true}
                  dark={false}
                />
              )}
              <span className={styles.selectPill} onClick={() => this.toggleObjectPicker(name, true)}>{`Select ${name}`}</span>
              {/* <Pill onClick={() => this.toggleObjectPicker(name, true)} value={`Select ${name}`} dark={false} /> */}
            </div>
          );
          break;
        case 'Relation':
          // fallback if selectedObject is just saved, so it still doesn't have relation properites set
          const relation = selectedObject[name] || new Parse.Relation(selectedObject, name);
          relation.targetClassName = targetClass;

          inputComponent = openObjectPickers[name] ? (
            <B4aObjectPickerDialog
              schema={schema}
              column={column}
              className={targetClass}
              relation={relation}
              onConfirm={(newValue, toDelete) =>
                this.handleChange(newValue, name, type, targetClass, toDelete)
              }
              onCancel={() => this.toggleObjectPicker(name, false)}
              useMasterKey={useMasterKey}
            />
          ) : (
            selectedObject.id && (
              <div
                style={{
                  cursor: 'pointer',
                  maxWidth: '60%', paddingTop: '17px'
                }}
              >
                <Pill
                  onClick={() => this.openRelation(relation)}
                  value={`View ${type}`}
                  followClick={true}
                  dark={false}
                />
                <span className={styles.selectPill} onClick={() => this.toggleObjectPicker(name, true)}>{`Select ${name}`}</span>
                {/* <Pill
                  onClick={() => this.toggleObjectPicker(name, true)}
                  value={`Select ${name}`}
                  dark={false}
                /> */}
              </div>
            )
          );
          break;
        default:
          inputComponent = <div />;
      }

      const description = (
        <span>
          {targetClass ? `${type} <${targetClass}>` : type}
          <div style={{ marginTop: '2px' }}>
            {expandedTextAreas[name] && expandedTextAreas[name].rows > 3 && (
              <a className={styles.editRowExpandCollapse} onClick={() => this.toggleExpandTextArea(name)}>
                {expandedTextAreas[name].expanded ? 'collapse' : 'expand'}
              </a>
            )}
          </div>
        </span>
      );

      return (
        <Field
          key={name}
          label={<Label text={name} description={description} />}
          labelWidth={50}
          input={<div style={{ width: '100%', padding: '0 0 0 1rem', height: '100%' }}>{inputComponent}</div>}
        />
      );
    });

    return (
      <B4aModal
        open
        type={B4aModal.Types.DEFAULT}
        title={
          selectedObject.id ? (
            <span>
              Edit <strong>&ldquo;{selectedObject.id}&bdquo;</strong>
            </span>
          ) : (
            <span>
              New <strong>{className}</strong>
            </span>
          )
        }
        subtitle={
          <div style={{ lineHeight: '140%', fontSize: '14px' }}>
            {selectedObject.createdAt && (
              <div>
                CreatedAt <strong>{dateStringUTC(selectedObject.createdAt)}</strong>
              </div>
            )}
            {selectedObject.updatedAt && (
              <div style={{ marginTop: '-4px' }}>
                UpdatedAt <strong>{dateStringUTC(selectedObject.updatedAt)}</strong>
              </div>
            )}
          </div>
        }
        onCancel={onClose}
        onConfirm={this.openAcl}
        confirmText="Edit ACL"
        cancelText="Close"
        width="640px"
      >
        <div className={[styles.objectPickerContent]}>{fields}</div>
      </B4aModal>
    );
  }
}
