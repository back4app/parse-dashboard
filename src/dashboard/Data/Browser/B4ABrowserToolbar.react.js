import BrowserFilter  from 'components/BrowserFilter/BrowserFilter.react';
import BrowserMenu    from 'components/BrowserMenu/BrowserMenu.react';
import Icon           from 'components/Icon/Icon.react';
import MenuItem       from 'components/BrowserMenu/MenuItem.react';
import prettyNumber   from 'lib/prettyNumber';
import React          from 'react';
import SecurityDialog from 'dashboard/Data/Browser/SecurityDialog.react';
import Separator      from 'components/BrowserMenu/Separator.react';
import styles         from 'dashboard/Data/Browser/Browser.scss';
import Toolbar        from 'components/Toolbar/Toolbar.react';
import Button         from 'components/Button/Button.react'
import VideoTutorialButton from 'components/VideoTutorialButton/VideoTutorialButton.react';
import ColumnsConfiguration
                      from 'components/ColumnsConfiguration/ColumnsConfiguration.react';

const apiDocsButtonStyle = {
  display: 'inline-block',
  height: '20px',
  border: '1px solid #169cee',
  'lineHeight': '20px',
  outline: '0',
  'textDecoration': 'none',
  'textAlign': 'center',
  'borderRadius': '5px',
  cursor: 'pointer',
  'minWidth': '90px',
  padding: '0 5px',
  'fontSize': '12px',
  'fontWeight': 'bold',
  'marginBottom': '4px',
}

let B4ABrowserToolbar = ({
    className,
    classNameForEditors,
    count,
    perms,
    schema,
    filters,
    selection,
    relation,
    setCurrent,
    onFilterChange,
    onAddColumn,
    onAddRow,
    onAddClass,
    onAttachRows,
    onAttachSelectedRows,
    onImport,
    onImportRelation,
    onCloneSelectedRows,
    onExport,
    onRemoveColumn,
    onDeleteRows,
    onDropClass,
    onChangeCLP,
    onEditPermissions,
    onRefresh,
    hidePerms,
    isUnique,
    uniqueField,
    handleColumnDragDrop,
    handleColumnsOrder,
    order,
    enableDeleteAllRows,
    enableImport,
    enableExportClass,
    enableSecurityDialog,
    enableColumnManipulation,
    enableClassManipulation,
    applicationId,
    onClickIndexManager,
    onClickSecurity,
    columns,
    onShowPointerKey,
  }) => {
  let selectionLength = Object.keys(selection).length;
  let details = [], lockIcon = false;
  if (count !== undefined) {
    if (count === 1) {
      details.push('1 object');
    } else {
      details.push(prettyNumber(count) + ' objects');
    }
  }

  let readWritePermissions = '';
  if (!relation && !isUnique) {
    if (perms && !hidePerms) {
      let read = perms.get && perms.find && perms.get['*'] && perms.find['*'];
      let write = perms.create && perms.update && perms.delete && perms.create['*'] && perms.update['*'] && perms.delete['*'];
      if (read && write) {
        // details.push('Public Read and Write enabled');
        readWritePermissions = 'Public Read and Write enabled';
      } else if (read) {
        // details.push('Public Read enabled');
        readWritePermissions = 'Public Read enabled';
      } else if (write) {
        // details.push('Public Write enabled');
        readWritePermissions = 'Public Write enabled';
      } else if ( !read && !write ) {
        readWritePermissions = 'Protected';
        lockIcon = true;
      }
    }
  }
  let menu = null;
  if (relation) {
    menu = (
      <BrowserMenu title='Edit' icon='edit-solid'>
        <MenuItem
          text={`Create ${relation.targetClassName} and attach`}
          onClick={onAddRow}
        />
        <MenuItem
          text="Attach existing row"
          onClick={onAttachRows}
        />
        <Separator />
        <MenuItem
          disabled={selectionLength === 0}
          text={selectionLength === 1 && !selection['*'] ? 'Detach this row' : 'Detach these rows'}
          onClick={() => onDeleteRows(selection)}
        />
      </BrowserMenu>
    );
  } else {
    menu = (
      <BrowserMenu title='Edit' icon='edit-solid'>
        <MenuItem text='Security' onClick={onClickSecurity} />
        <Separator />
        <MenuItem text='Add a row' onClick={onAddRow} />
        {enableColumnManipulation ? <MenuItem text='Add a column' onClick={onAddColumn} /> : <noscript />}
        {enableClassManipulation ? <MenuItem text='Add a class' onClick={onAddClass} /> : <noscript />}
        <Separator />
        <MenuItem text='Change pointer key' onClick={onShowPointerKey} />
        <MenuItem
          disabled={!selectionLength}
          text={`Attach ${selectionLength <= 1 ? 'this row' : 'these rows'} to relation`}
          onClick={onAttachSelectedRows}
        />
        <Separator />
        <MenuItem
          disabled={!selectionLength || classNameForEditors.startsWith('_')}
          text={`Clone ${selectionLength <= 1 ? 'this row' : 'these rows'}`}
          onClick={onCloneSelectedRows}
        />
        <Separator />
        <MenuItem
          disabled={selectionLength === 0}
          text={selectionLength === 1 && !selection['*'] ? 'Delete this row' : 'Delete these rows'}
          onClick={() => onDeleteRows(selection)} />
        {enableColumnManipulation ? <MenuItem text='Delete a column' onClick={onRemoveColumn} /> : <noscript />}
        {enableDeleteAllRows ? <MenuItem text='Delete all rows' onClick={() => onDeleteRows({ '*': true })} /> : <noscript />}
        {enableClassManipulation ? <MenuItem text='Delete this class' onClick={onDropClass} /> : <noscript />}
        {enableImport || enableExportClass ? <Separator /> : <noscript />}
        {enableImport ? <MenuItem text='Import data' onClick={onImport} /> : <noscript />}
        {enableImport ? <MenuItem text='Import relation data' onClick={onImportRelation} /> : <noscript />}
        {enableExportClass ? <MenuItem text='Export this data' onClick={onExport} /> : <noscript />}
        <Separator />
        <MenuItem text='Index Manager' onClick={onClickIndexManager} />
        <MenuItem text="API Reference" onClick={() => {
          back4AppNavigation && back4AppNavigation.atApiReferenceClassesEvent()
          window.open(`${b4aSettings.DASHBOARD_PATH}/apidocs/${applicationId}${classApiId}`, '_blank')
        }} />
      </BrowserMenu>
    );
  }

  let subsection = className;
  if (relation) {
    subsection = `'${relation.key}' on ${relation.parent.id}`;
  } else if (subsection.length > 30) {
    subsection = subsection.substr(0, 30) + '\u2026';
  }
  const classes = [styles.toolbarButton];
  let onClick = onAddRow;
  if (isUnique) {
    classes.push(styles.toolbarButtonDisabled);
    onClick = null;
  }

  const userPointers = [];
  const schemaSimplifiedData = {};
  const classSchema = schema.data.get('classes').get(classNameForEditors);
  if (classSchema) {
    classSchema.forEach(({ type, targetClass }, col) => {
      schemaSimplifiedData[col] = {
        type,
        targetClass,
      };

      if (col === 'objectId' || isUnique && col !== uniqueField) {
        return;
      }
      if ((type ==='Pointer' && targetClass === '_User') || type === 'Array' ) {
        userPointers.push(col);
      }
    });
  }

  // variables used to define an API reference button on browser toolbar
  let classApiId = ''
  let apiDocsButton = ''
  let isCustomCLass = classNameForEditors && classNameForEditors.indexOf('_') === -1

  if (className && (className === 'User' || isCustomCLass)) {
    // set classApiId taking into count the User class special condition
    classApiId = `#${className === 'User' ? 'user-api' : `${className}-custom-class`}`
    apiDocsButton = <Button value='API Reference'
      primary={true}
      width={'90px'}
      additionalStyles={apiDocsButtonStyle}
      onClick={() => {
        back4AppNavigation && back4AppNavigation.atApiReferenceClassesEvent()
        window.open(`${b4aSettings.DASHBOARD_PATH}/apidocs/${applicationId}${classApiId}`, '_blank')
      }}
    />
  }
  // TODO: Set the videoTutorialUrl
  const videoTutorialUrl = 'https://youtu.be/0Ym9-BHI8Fg';
  const helpsection = (
    <span className="toolbar-help-section">
      {/* {apiDocsButton} */}
      <VideoTutorialButton url={videoTutorialUrl} additionalStyles={ { marginLeft: '8px', marginBottom: '4px' } } />
    </span>
  );

  return (
    <Toolbar
      relation={relation}
      filters={filters}
      readWritePermissions={readWritePermissions}
      lockIcon={lockIcon}
      onClickSecurity={onClickSecurity}
      section={relation ? `Relation <${relation.targetClassName}> | ` : `Class | ${details.join(' \u2022 ')}`}
      subsection={subsection}
      details={relation ? details.join(' \u2022 ') : details.join(' \u2022 ')}
      helpsection={helpsection}>
      <a className={styles.toolbarButton} onClick={onRefresh} title='Refresh'>
        <Icon name='refresh' width={30} height={26} />
      </a>
      <BrowserFilter
        setCurrent={setCurrent}
        schema={schemaSimplifiedData}
        filters={filters}
        onChange={onFilterChange} />
      <ColumnsConfiguration
        handleColumnsOrder={handleColumnsOrder}
        handleColumnDragDrop={handleColumnDragDrop}
        order={order} />
      {menu}
    </Toolbar>
  );
};

export default B4ABrowserToolbar;
