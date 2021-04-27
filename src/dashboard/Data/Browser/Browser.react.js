/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import { ActionTypes }                    from 'lib/stores/SchemaStore';
import { post }                           from 'lib/AJAX';
import AccountManager                     from 'lib/AccountManager';
import AddColumnDialog                    from 'dashboard/Data/Browser/AddColumnDialog.react';
import CategoryList                       from 'components/CategoryList/CategoryList.react';
import CreateClassDialog                  from 'dashboard/Data/Browser/CreateClassDialog.react';
import DashboardView                      from 'dashboard/DashboardView.react';
import DataBrowser                        from 'dashboard/Data/Browser/DataBrowser.react';
import { DefaultColumns, SpecialClasses } from 'lib/Constants';
import DeleteRowsDialog                   from 'dashboard/Data/Browser/DeleteRowsDialog.react';
import DropClassDialog                    from 'dashboard/Data/Browser/DropClassDialog.react';
import EmptyState                         from 'components/EmptyState/EmptyState.react';
import ImportDialog                       from 'dashboard/Data/Browser/ImportDialog.react';
import ImportRelationDialog               from 'dashboard/Data/Browser/ImportRelationDialog.react';
import ExportDialog                       from 'dashboard/Data/Browser/ExportDialog.react';
import AttachRowsDialog                   from 'dashboard/Data/Browser/AttachRowsDialog.react';
import AttachSelectedRowsDialog           from 'dashboard/Data/Browser/AttachSelectedRowsDialog.react';
import CloneSelectedRowsDialog            from 'dashboard/Data/Browser/CloneSelectedRowsDialog.react';
import EditRowDialog                      from 'dashboard/Data/Browser/EditRowDialog.react';
import history                            from 'dashboard/history';
import { List, Map }                      from 'immutable';
import Notification                       from 'dashboard/Data/Browser/Notification.react';
import Parse                              from 'parse';
import prettyNumber                       from 'lib/prettyNumber';
import queryFromFilters                   from 'lib/queryFromFilters';
import React                              from 'react';
import RemoveColumnDialog                 from 'dashboard/Data/Browser/RemoveColumnDialog.react';
import SidebarAction                      from 'components/Sidebar/SidebarAction';
import stringCompare                      from 'lib/stringCompare';
import styles                             from 'dashboard/Data/Browser/Browser.scss';
import subscribeTo                        from 'lib/subscribeTo';
import * as ColumnPreferences             from 'lib/ColumnPreferences';
import introJs                            from 'intro.js'
import introStyle                         from 'stylesheets/introjs.css';
import Tour                               from 'components/Tour/Tour.react';
import { isMobile }                       from 'lib/browserUtils';
import * as queryString                   from 'query-string';
import { Helmet }                         from 'react-helmet';
import PropTypes                          from 'lib/PropTypes';
import ParseApp                           from 'lib/ParseApp';

// The initial and max amount of rows fetched by lazy loading
const MAX_ROWS_FETCHED = 200;

export default
@subscribeTo('Schema', 'schema')
class Browser extends DashboardView {
  constructor() {
    super();
    this.section = 'Core';
    this.subsection = 'Database Browser'
    this.noteTimeout = null;

    const user = AccountManager.currentUser();

    this.state = {
      showCreateClassDialog: false,
      showAddColumnDialog: false,
      showRemoveColumnDialog: false,
      showDropClassDialog: false,
      showImportDialog: false,
      showImportRelationDialog: false,
      showExportDialog: false,
      showAttachRowsDialog: false,
      showEditRowDialog: false,
      rowsToDelete: null,

      relation: null,
      counts: {},
      filteredCounts: {},
      clp: {},
      filters: new List(),
      ordering: '-createdAt',
      selection: {},
      uniqueClassFields: new List(),

      data: null,
      lastMax: -1,
      newObject: null,
      editCloneRows: null,

      lastError: null,
      lastNote: null,

      relationCount: 0,

      isUnique: false,
      uniqueField: null,
      showTour: !isMobile() && user && user.playDatabaseBrowserTutorial,
      renderFooterMenu: !isMobile()
    };

    this.prefetchData = this.prefetchData.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.fetchRelation = this.fetchRelation.bind(this);
    this.fetchRelationCount = this.fetchRelationCount.bind(this);
    this.fetchClassIndexes = this.fetchClassIndexes.bind(this);
    this.fetchNextPage = this.fetchNextPage.bind(this);
    this.updateFilters = this.updateFilters.bind(this);
    this.showRemoveColumn = this.showRemoveColumn.bind(this);
    this.showDeleteRows = this.showDeleteRows.bind(this);
    this.showDropClass = this.showDropClass.bind(this);
    this.showExport = this.showExport.bind(this);
    this.showImport = this.showImport.bind(this);
    this.showImportRelation = this.showImportRelation.bind(this);
    this.showAttachRowsDialog = this.showAttachRowsDialog.bind(this);
    this.cancelAttachRows = this.cancelAttachRows.bind(this);
    this.confirmAttachRows = this.confirmAttachRows.bind(this);
    this.showAttachSelectedRowsDialog = this.showAttachSelectedRowsDialog.bind(this);
    this.confirmAttachSelectedRows = this.confirmAttachSelectedRows.bind(this);
    this.cancelAttachSelectedRows = this.cancelAttachSelectedRows.bind(this);
    this.showCloneSelectedRowsDialog = this.showCloneSelectedRowsDialog.bind(this);
    this.confirmCloneSelectedRows = this.confirmCloneSelectedRows.bind(this);
    this.cancelCloneSelectedRows = this.cancelCloneSelectedRows.bind(this);
    this.getClassRelationColumns = this.getClassRelationColumns.bind(this);
    this.showCreateClass = this.showCreateClass.bind(this);
    this.refresh = this.refresh.bind(this);
    this.selectRow = this.selectRow.bind(this);
    this.updateRow = this.updateRow.bind(this);
    this.updateOrdering = this.updateOrdering.bind(this);
    this.handlePointerClick = this.handlePointerClick.bind(this);
    this.handleCLPChange = this.handleCLPChange.bind(this);
    this.setRelation = this.setRelation.bind(this);
    this.showAddColumn = this.showAddColumn.bind(this);
    this.addRow = this.addRow.bind(this);
    this.abortAddRow = this.abortAddRow.bind(this);
    this.addRowWithModal = this.addRowWithModal.bind(this);
    this.showCreateClass = this.showCreateClass.bind(this);
    this.createClass = this.createClass.bind(this);
    this.addColumn = this.addColumn.bind(this);
    this.removeColumn = this.removeColumn.bind(this);
    this.showNote = this.showNote.bind(this);
    this.getFooterMenuButtons = this.getFooterMenuButtons.bind(this);
    this.windowResizeHandler = this.windowResizeHandler.bind(this);
    this.onClickIndexManager = this.onClickIndexManager.bind(this);
    this.showEditRowDialog = this.showEditRowDialog.bind(this);
    this.closeEditRowDialog = this.closeEditRowDialog.bind(this);
    this.handleShowAcl = this.handleShowAcl.bind(this);
    this.onDialogToggle = this.onDialogToggle.bind(this);
    this.addEditCloneRows = this.addEditCloneRows.bind(this);
  }

  getFooterMenuButtons() {
    return this.state.renderFooterMenu ? [
      <a key={0} onClick={() => this.setState({ showTour: true })}>Play intro</a>
    ] : null;
  }

  windowResizeHandler() {
    if (isMobile()) {
      this.setState({ renderFooterMenu: false });
    } else {
      this.setState({ renderFooterMenu: true });
    }
  }

  componentWillMount() {
    const { currentApp } = this.context;
    if (!currentApp.preventSchemaEdits) {
      this.action = new SidebarAction('Create a class', this.showCreateClass.bind(this));
    }

    this.props.schema.dispatch(ActionTypes.FETCH)
    .then(() => this.handleFetchedSchema());
    if (!this.props.params.className && this.props.schema.data.get('classes')) {
      this.redirectToFirstClass(this.props.schema.data.get('classes'));
    } else if (this.props.params.className) {
      this.prefetchData(this.props, this.context);
    }
    window.addEventListener('resize', this.windowResizeHandler);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.windowResizeHandler);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      if (this.props.params.appId !== nextProps.params.appId || !this.props.params.className) {
        this.setState({ counts: {} });
        Parse.Object._clearAllState();
      }
      this.prefetchData(nextProps, nextContext);
      nextProps.schema.dispatch(ActionTypes.FETCH)
      .then(() => this.handleFetchedSchema());
    }
    if (!nextProps.params.className && nextProps.schema.data.get('classes')) {
      this.redirectToFirstClass(nextProps.schema.data.get('classes'));
    }
  }

  getTourConfig() {
    const createClassCode = `
      <section class="intro-code">
        <pre><span class="intro-code-keyword">const</span> B4aVehicle = Parse.Object.extend(<span class="intro-code-string">'B4aVehicle'</span>);</pre>
        <pre><span class="intro-code-keyword">const</span> vehicle = <span class="intro-code-keyword">new</span> B4aVehicle();</pre>
        <br/>
        <pre>vehicle.set('name', <span class="intro-code-string">'Corolla'</span>);</pre>
        <pre>vehicle.set('price', <span class="intro-code-number">19499</span>);</pre>
        <pre>vehicle.set('color' <span class="intro-code-string">'black'</span>);</pre>
        <br/>
        <pre>vehicle.save().then(savedObject => {</pre>
        <pre>  <span class="intro-code-comment">// The class is automatically created on</span></pre>
        <pre>  <span class="intro-code-comment">// the back-end when saving the object!</span></pre>
        <pre>  console.log(savedObject);</pre>
        <pre>},</pre>
        <pre>error => {</pre>
        <pre>  console.error(error);</pre>
        <pre>});</pre>
      </section>
    `;
    const steps = [
      {
        eventId: 'Database Browser Section',
        element: () => document.querySelector('[class^="section_contents"] > div > div'),
        intro: `This is the <b>Database Browser</b> section where you can create classes and manage your data using this Dashboard.`,
        position: 'right'
      },
      {
        eventId: 'Custom Class and Object Creation',
        element: () => document.querySelector('[class^="section_header"][href*="/apidocs"]'),
        intro: `It’s very simple to save data on Back4App from your front-end.<br /><br />
        On the <b>API Reference</b> section, you can find the auto-generated code below that creates a class and persist data on it.<br />
        ${createClassCode}
        <p class="intro-code-run">Click on the <b>Run</b> button to execute this code.</p>`,
        position: 'right'
      },
      {
        eventId: 'Custom Class Link',
        element: () => document.querySelector('[class^=class_list] [title="B4aVehicle"]') || document.querySelector('[class^=class_list]'),
        intro: `This is the new <b>B4aVehicle</b> class just created!`,
        position: 'right'
      },
      {
        eventId: 'Custom Class Data Table',
        element: () => document.querySelector('[class^=browser]'),
        intro: `As you can see the <b>B4aVehicle</b> class already has its first data.`,
        position: 'right'
      },
      {
        eventId: 'Create a Class Button',
        element: () => document.querySelector('[class^="section_contents"] [class^=subitem] a[class^=action]'),
        intro: `You can also create classes and manage your data directly through the Dashboard.`,
        position: 'bottom'
      },
      {
        eventId: 'Contextual Help',
        element: () => document.querySelector('.toolbar-help-section'),
        intro: `At any time, you can get specific help accessing this contextual section.`,
        position: 'bottom'
      },
      {
        eventId: 'Play Intro Button',
        element: document.querySelector('[class^="footer"] [class^="more"]'),
        intro: `You can find this tour and play it again by pressing this button and selecting <b>"Play intro"</b>.`,
        position: 'right'
      }
    ];
    const { context } = this;
    const { schema } = this.props;
    const user = AccountManager.currentUser();

    let unexpectedErrorThrown = false;

    const getNextButton = () => {
      return document.querySelector('.introjs-button.introjs-nextbutton');
    };
    const getCustomVehicleClassLink = () => {
      return document.querySelector('[class^=class_list] [title="B4aVehicle"]');
    };

    return {
      steps,
      onBeforeStart: () => {
        document.querySelector('[class^="section_contents"] > div > div').style.backgroundColor = "#0e69a0";
        document.querySelector('[class^="section_header"][href*="/apidocs"]').style.backgroundColor = "#0c5582";
        post(`/tutorial`, { databaseBrowser: true });

        // Updates the current logged user so that the tutorial won't be played
        // again when the user switches to another page
        user.playDatabaseBrowserTutorial = false;
        AccountManager.setCurrentUser({ user });
      },
      onBeforeChange: function(targetElement) {
        const introItems = this._introItems;

        // Fires event if it's not a forced transition
        if (!this._forcedStep && typeof back4AppNavigation === 'object' && typeof back4AppNavigation.onDatabaseBrowserTourStep === 'function') {
          back4AppNavigation.onDatabaseBrowserTourStep(introItems[this._currentStep].eventId);
        } else {
          this._forcedStep = false;
        }

        switch(this._currentStep) {
          case 0:
            let nextButton = getNextButton();
            if (nextButton) {
              nextButton.innerHTML = "Next";
            }
            break;
          case 1:
            nextButton = getNextButton();
            nextButton.innerHTML = "Run";
            break;
          case 2:
            if (!getCustomVehicleClassLink() && !unexpectedErrorThrown) {
              schema.dispatch(ActionTypes.CREATE_CLASS, {
                className: 'B4aVehicle',
                fields: {
                  name: { type: 'String' },
                  price: { type: 'Number' },
                  color: { type: 'String' },
                }
              }).then(() => {
                return context.currentApp.apiRequest('POST', '/classes/B4aVehicle', { name: 'Corolla', price: 19499, color: 'black' }, { useMasterKey: true });
              }).then(() => {
                introItems[2].element = getCustomVehicleClassLink();
                this.nextStep();
              }).catch(e => {
                if (!unexpectedErrorThrown) {
                  introItems.splice(2, 2);
                  for (let i=2; i<introItems.length; i++) {
                    introItems[i].step -= 2;
                  }
                  unexpectedErrorThrown = true;
                }
                console.error(e);
                this.nextStep();
              });
              return false;
            }
            nextButton = getNextButton();
            nextButton.innerHTML = 'Next';

            const numberLayer = document.querySelector('.introjs-helperNumberLayer');
            numberLayer.style.marginLeft = 0;
            if (!unexpectedErrorThrown) {
              history.push(context.generatePath('browser/B4aVehicle'));
            }
            break;
          case 3:
            if (!unexpectedErrorThrown) {
              this._introItems[3].element = document.querySelector('[class^=browser] [class^=tableRow] > :nth-child(2)');
            }
            break;
          case 4:
            if(unexpectedErrorThrown) {
              targetElement.style.backgroundColor = 'inherit';
            }
            break;
          case 6:
            targetElement.style.backgroundColor = 'inherit';
            break;
        }
      },
      onAfterChange: function(targetElement) {
        switch(this._currentStep) {
          case 0:
            if (this._introItems.length === 1) {
              // Disables the Prev button
              document.querySelector('.introjs-button.introjs-prevbutton').classList.add('introjs-disabled');
              targetElement.style.backgroundColor = 'inherit';
            }
            break;
          case 1:
            const numberLayer = document.querySelector('.introjs-helperNumberLayer');
            numberLayer.style.marginLeft = '20px';
            break;
          case 2:
            if (!unexpectedErrorThrown) {
              targetElement.style.backgroundColor = "#0e69a0";
            }
            break;
        }
      },
      onBeforeExit: function() {
        // If is exiting before the last step, avoid exit and shows the last step
        if (this._currentStep < this._introItems.length - 1) {
          this._forcedStep = true;
          const elementsRemoved = this._introItems.length - 1;
          this._introItems.splice(0, elementsRemoved);
          for (let i=0; i<this._introItems.length; i++) {
            this._introItems[i].step -= elementsRemoved;
          }
          this.goToStep(this._introItems.length);
          return false;
        }
      },
      onExit: () => {
        this.setState({ showTour: false });
      }
    };
  }

  async prefetchData(props, context) {
    const filters = this.extractFiltersFromQuery(props);
    const { className, entityId, relationName } = props.params;
    const isRelationRoute = entityId && relationName;
    let relation = this.state.relation;
    if (isRelationRoute && !relation) {
      const parentObjectQuery = new Parse.Query(className);
      const parent = await parentObjectQuery.get(entityId, { useMasterKey: true });
      relation = parent.relation(relationName);
    }
    await this.setState({
      data: null,
      newObject: null,
      lastMax: -1,
      ordering: ColumnPreferences.getColumnSort(
        false,
        context.currentApp.applicationId,
        className,
      ),
      selection: {},
      relation: isRelationRoute ? relation : null,
    });
    if (isRelationRoute) {
      this.fetchRelation(relation, filters);
    } else if (className) {
      this.fetchData(className, filters);
      this.fetchClassIndexes(className);
    }
  }

  extractFiltersFromQuery(props) {
    let filters = new List();
    //TODO: url limit issues ( we may want to check for url limit), unlikely but possible to run into
    if (!props || !props.location || !props.location.search) {
      return filters;
    }
    const query = queryString.parse(props.location.search);
    if (query.filters) {
      const queryFilters = JSON.parse(query.filters);
      queryFilters.forEach((filter) => filters = filters.push(new Map(filter)));
    }
    return filters;
  }

  redirectToFirstClass(classList) {
    if (!classList.isEmpty()) {
      classList = Object.keys(classList.toObject());
      let classes = classList.filter(className => className !== '_Role' && className !== '_User' && className !== '_Installation');
      classes.sort((a, b) => {
        if (a[0] === '_' && b[0] !== '_') {
          return -1;
        }
        if (b[0] === '_' && a[0] !== '_') {
          return 1;
        }
        return a.toUpperCase() < b.toUpperCase() ? -1 : 1;
      });
      if (classes[0]) {
        history.replace(this.context.generatePath(`browser/${classes[0]}`));
      } else {
        if (classList.indexOf('_User') !== -1) {
          history.replace(this.context.generatePath('browser/_User'));
        } else {
          history.replace(this.context.generatePath(`browser/${classList[0]}`));
        }
      }
    }
  }

  showCreateClass() {
    if (!this.props.schema.data.get('classes')) {
      return;
    }
    this.setState({ showCreateClassDialog: true });
  }

  showAddColumn() {
    this.setState({ showAddColumnDialog: true });
  }

  showRemoveColumn() {
    this.setState({ showRemoveColumnDialog: true });
  }

  showDeleteRows(rows) {
    this.setState({ rowsToDelete: rows });
  }

  showDropClass() {
    this.setState({ showDropClassDialog: true });
  }

  showImport() {
    this.setState({ showImportDialog: true });
  }

  showImportRelation() {
    this.setState({ showImportRelationDialog: true });
  }

  showExport() {
    this.setState({ showExportDialog: true });
  }

  createClass(className) {
    this.props.schema.dispatch(ActionTypes.CREATE_CLASS, { className }).then(() => {
      this.state.counts[className] = 0;
      history.push(this.context.generatePath('browser/' + className));
    }).then(() => {
      // Send track event
      back4AppNavigation && back4AppNavigation.createClassClickEvent()
    }).catch(error => {
      let errorDeletingNote = 'Internal server error'
      if (error.code === 403) errorDeletingNote = error.message;

      this.showNote(errorDeletingNote, true);
    }).finally(() => {
      this.setState({ showCreateClassDialog: false });
    });
  }

  dropClass(className) {
    this.props.schema.dispatch(ActionTypes.DROP_CLASS, { className }).then(() => {
      this.setState({showDropClassDialog: false });
      delete this.state.counts[className];
      history.push(this.context.generatePath('browser'));
    }, (error) => {
      let msg = typeof error === 'string' ? error : error.message;
      if (msg) {
        msg = msg[0].toUpperCase() + msg.substr(1);
      }

      if (error.code === 403) msg = error.message;
      this.setState({showDropClassDialog: false });

      this.showNote(msg, true);
    });
  }

  importClass(className, file) {
    return this.context.currentApp.importData(className, file)
      .then((res) => {
        return res;
      }, (error) => {
        console.log(error);
        return Promise.resolve({
          error: true,
          message: error.message
        });
      });
  }

  importRelation(className, relationName, file) {
    return this.context.currentApp.importRelationData(className, relationName, file)
      .then((res) => {
        return res;
      }, (error) => {
        console.log(error);
        return Promise.resolve({
          error: true,
          message: error.message
        });
      });
  }

  exportClass(className) {
    this.context.currentApp.exportClass(className).finally(() => {
      this.setState({ showExportDialog: false });
    });
  }

  addColumn({ type, name, target, required, defaultValue }) {
    let payload = {
      className: this.props.params.className,
      columnType: type,
      name: name,
      targetClass: target,
      required,
      defaultValue
    };
    this.props.schema.dispatch(ActionTypes.ADD_COLUMN, payload).catch(error => {
      let errorDeletingNote = 'Internal server error'
      if (error.code === 403) errorDeletingNote = error.message;

      this.showNote(errorDeletingNote, true);
      this.setState({ showAddColumnDialog: false });
    }).finally(() => {
      this.setState({ showAddColumnDialog: false });
    });
  }

  addRow() {
    if (!this.state.newObject) {
      const relation = this.state.relation;
      this.setState({
        newObject: (relation ?
          new Parse.Object(relation.targetClassName)
        : new Parse.Object(this.props.params.className) ),
      });
    }
  }

  addEditCloneRows(cloneRows) {
    this.setState({
      editCloneRows: cloneRows
    });
  }

  abortAddRow() {
    if (this.state.newObject) {
      this.setState({
        newObject: null,
      });
    }
  }
  
  addRowWithModal() {
    this.addRow();
    this.selectRow(undefined, true);
    this.showEditRowDialog();
  }

  removeColumn(name) {
    let payload = {
      className: this.props.params.className,
      name: name
    };
    this.props.schema.dispatch(ActionTypes.DROP_COLUMN, payload).catch(error => {
      let errorDeletingNote = 'Internal server error'
      if (error.code === 403) errorDeletingNote = error.message;

      this.showNote(errorDeletingNote, true);
      this.setState({ showRemoveColumnDialog: false });

    }).finally(() => {
      let state = { showRemoveColumnDialog: false };
      if (this.state.ordering === name || this.state.ordering === '-' + name) {
        state.ordering = '-createdAt';
      }
      this.setState(state);
    });
  }

  handleFetchedSchema() {
    this.props.schema.data.get('classes').forEach((_, className) => {
      this.context.currentApp.getClassCount(className)
      .then(count => this.setState({ counts: { [className]: count, ...this.state.counts } }));
    })
    this.setState({clp: this.props.schema.data.get('CLPs').toJS()});
  }

  async refresh() {
    const relation = this.state.relation;
    const prevFilters = this.state.filters || new List();
    const initialState = {
      data: null,
      newObject: null,
      lastMax: -1,
      selection: {},
      relation: null,
      editCloneRows: null
    };
    if (relation) {
      await this.setState(initialState);
      await this.setRelation(relation, prevFilters);
    } else {
      await this.setState({
        ...initialState,
        relation: null,
      });
      await this.fetchData(this.props.params.className, prevFilters);
    }
  }

  async fetchParseData(source, filters) {
    const query = queryFromFilters(source, filters);
    const sortDir = this.state.ordering[0] === '-' ? '-' : '+';
    const field = this.state.ordering.substr(sortDir === '-' ? 1 : 0)

    if (sortDir === '-') {
      query.descending(field)
    } else {
      query.ascending(field)
    }

    query.limit(MAX_ROWS_FETCHED);

    let promise = query.find({ useMasterKey: true });
    let isUnique = false;
    let uniqueField = null;
    filters.forEach(async (filter) => {
      if (filter.get('constraint') == 'unique') {
        const field = filter.get('field');
        promise = query.distinct(field);
        isUnique = true;
        uniqueField = field;
      }
    });
    await this.setState({ isUnique, uniqueField });

    const data = await promise;
    return data;
  }

  async fetchParseDataCount(source, filters) {
    const query = queryFromFilters(source, filters);
    const count = await query.count({ useMasterKey: true });
    return count;
  }

  async fetchData(source, filters = new List()) {
    try {
      const data = await this.fetchParseData(source, filters);
      var filteredCounts = { ...this.state.filteredCounts };
      if (filters.size > 0) {
        if (this.state.isUnique) {
          filteredCounts[source] = data.length;
        } else {
          filteredCounts[source] = await this.fetchParseDataCount(source, filters);
        }
      } else {
        delete filteredCounts[source];
      }
      this.setState({ data: data, filters, lastMax: MAX_ROWS_FETCHED , filteredCounts: filteredCounts});
    } catch(err) {
      this.setState({ data: [], filters, err });
    }
  }

  async fetchRelation(relation, filters = new List()) {
    const data = await this.fetchParseData(relation, filters);
    const relationCount = await this.fetchRelationCount(relation);
    await this.setState({
      relation,
      relationCount,
      selection: {},
      data,
      filters,
      lastMax: MAX_ROWS_FETCHED,
    });
  }

  async fetchRelationCount(relation) {
    return await this.context.currentApp.getRelationCount(relation);
  }

  async fetchClassIndexes(className){
    try {
      const data = await this.context.currentApp.getIndexes(className);
      if(data){
        this.setState({
          uniqueClassFields: data
            .filter(idxObj => idxObj.unique)
            .map(obj => Object.keys(JSON.parse(obj.index)))
            .flat()
        });
      }
    } catch (error) {
      this.setState({
        uniqueClassFields: []
      });
    }
  }

  fetchNextPage() {
    if (!this.state.data || this.state.isUnique) {
      return null;
    }
    let className = this.props.params.className;
    let source = this.state.relation || className;
    let query = queryFromFilters(source, this.state.filters);
    if (this.state.ordering !== '-createdAt') {
      // Construct complex pagination query
      let equalityQuery = queryFromFilters(source, this.state.filters);
      let field = this.state.ordering;
      let ascending = true;
      let comp = this.state.data[this.state.data.length - 1].get(field);
      if (field === 'objectId' || field === '-objectId') {
        comp = this.state.data[this.state.data.length - 1].id;
      }
      if (field[0] === '-') {
        field = field.substr(1);
        query.lessThan(field, comp);
        ascending = false;
      } else {
        query.greaterThan(field, comp);
      }
      if (field === 'createdAt') {
        equalityQuery.greaterThan('createdAt', this.state.data[this.state.data.length - 1].get('createdAt'));
      } else {
        equalityQuery.lessThan('createdAt', this.state.data[this.state.data.length - 1].get('createdAt'));
        equalityQuery.equalTo(field, comp);
      }
      query = Parse.Query.or(query, equalityQuery);
      if (ascending) {
        query.ascending(this.state.ordering);
      } else {
        query.descending(this.state.ordering.substr(1));
      }
    } else {
      query.lessThan('createdAt', this.state.data[this.state.data.length - 1].get('createdAt'));
      query.addDescending('createdAt');
    }
    query.limit(MAX_ROWS_FETCHED);

    query.find({ useMasterKey: true }).then((nextPage) => {
      if (className === this.props.params.className) {
        this.setState((state) => ({
          data: state.data.concat(nextPage)
        }));
      }
    });
    this.setState({ lastMax: this.state.lastMax + MAX_ROWS_FETCHED });
  }

  updateFilters(filters) {
    const relation = this.state.relation;
    if (relation) {
      this.setRelation(relation, filters);
    } else {
      const source = this.props.params.className;
      const _filters = JSON.stringify(filters.toJSON());
      const url = `browser/${source}${(filters.size === 0 ? '' : `?filters=${(encodeURIComponent(_filters))}`)}`;
      // filters param change is making the fetch call
      history.push(this.context.generatePath(url));
    }
  }

  updateOrdering(ordering) {
    let source = this.state.relation || this.props.params.className;
    this.setState({
      ordering: ordering,
      selection: {}
    }, () => this.fetchData(source, this.state.filters));
    ColumnPreferences.getColumnSort(
      ordering,
      this.context.currentApp.applicationId,
      this.props.params.className
    );
  }

  getRelationURL() {
    const relation = this.state.relation;
    const className = this.props.params.className;
    const entityId = relation.parent.id;
    const relationName = relation.key;
    return this.context.generatePath(`browser/${className}/${entityId}/${relationName}`);
  }

  setRelation(relation, filters) {
    this.setState({
      relation: relation,
      data: null,
    }, () => {
      let filterQueryString;
      if (filters && filters.size) {
        filterQueryString = encodeURIComponent(JSON.stringify(filters.toJSON()));
      }
      const url = `${this.getRelationURL()}${filterQueryString ? `?filters=${filterQueryString}` : ''}`;
      history.push(url);
    });
  }

  handlePointerClick({ className, id, field = 'objectId' }) {
    let filters = JSON.stringify([{
        field,
        constraint: 'eq',
        compareTo: id
    }]);
    history.push(this.context.generatePath(`browser/${className}?filters=${encodeURIComponent(filters)}`));
  }

  handleCLPChange(clp) {
    const { serverInfo } = this.context.currentApp;
    if (typeof serverInfo.parseServerVersion !== 'undefined') {
      if (serverInfo.parseServerVersion < '2.6') delete clp.count;
      if (serverInfo.parseServerVersion < '3.7') delete clp.protectedFields;
    }
    let p = this.props.schema.dispatch(ActionTypes.SET_CLP, {
      className: this.props.params.className,
      clp,
    });
    p.then(() => this.handleFetchedSchema());
    return p;
  }

  getLastCreatedObject(rows) {
    return rows.filter(row => row._objCount === rows.length - 1).pop()
  }

  updateRow(row, attr, value) {
    let isNewObject = row === -1;
    let isEditCloneObj = row < -1;
    let obj = isNewObject ? this.state.newObject : this.state.data[row];
    if (!obj && isNewObject) {
      obj = this.getLastCreatedObject(this.state.data)
      isNewObject = false
    }
    if(isEditCloneObj){
      obj = this.state.editCloneRows[row + (this.state.editCloneRows.length+1)];
    }
    const prev = obj.get(attr);
    if (value === prev) {
      return;
    }
    if (value === undefined) {
      obj.unset(attr);
    } else {
      obj.set(attr, value);
    }
    obj.save(null, { useMasterKey: true }).then((objectSaved) => {
      const createdOrUpdated = isNewObject ? 'created' : 'updated';
      let msg = objectSaved.className + ' with id \'' + objectSaved.id + '\' ' + createdOrUpdated;
      this.showNote(msg, false);

      const state = { data: this.state.data, editCloneRows: this.state.editCloneRows };

      if (isNewObject) {
        const relation = this.state.relation;
        if (relation) {
          const parent = relation.parent;
          const parentRelation = parent.relation(relation.key);
          parentRelation.add(obj);
          const targetClassName = relation.targetClassName;
          parent.save(null, { useMasterKey: true }).then(() => {
            this.setState({
              newObject: null,
              data: [
                obj,
                ...this.state.data,
              ],
              relationCount: this.state.relationCount + 1,
              counts: {
                ...this.state.counts,
                [targetClassName]: this.state.counts[targetClassName] + 1,
              },
            });
          }, (error) => {
            let msg = typeof error === 'string' ? error : error.message;
            if (msg) {
              msg = msg[0].toUpperCase() + msg.substr(1);
            }
            obj.set(attr, prev);
            this.setState({ data: this.state.data });
            this.showNote(msg, true);
          });
        } else {
          state.newObject = null;
          if (this.props.params.className === obj.className) {
            this.state.data.unshift(obj);
          }
          this.state.counts[obj.className] += 1;
        }
      }
      if(isEditCloneObj){
        console.log(obj);
        state.editCloneRows = state.editCloneRows.filter(
          cloneObj => cloneObj._localId !== obj._localId
        );
        if(state.editCloneRows.length === 0)
          state.editCloneRows = null;
        if (this.props.params.className === obj.className) {
          this.state.data.unshift(obj);
        }
        this.state.counts[obj.className] += 1;
      }
      this.setState(state);
    }, (error) => {
      let msg = typeof error === 'string' ? error : error.message;
      if (msg) {
        msg = msg[0].toUpperCase() + msg.substr(1);
      }
      if (!isNewObject) {
        obj.set(attr, prev);
        this.setState({ data: this.state.data });
      }

      this.showNote(msg, true);
    });
  }

  deleteRows(rows) {
    this.setState({ rowsToDelete: null, selection: {} });
    let className = this.props.params.className;
    if (!this.state.relation && rows['*']) {
      this.context.currentApp.clearCollection(className).then(() => {
        if (this.props.params.className === className) {
          this.state.counts[className] = 0;
          this.setState({
            data: [],
            lastMax: MAX_ROWS_FETCHED,
            selection: {},
          });
        }
      });
    } else {
      let indexes = [];
      let toDelete = [];
      let seeking = Object.keys(rows).length;
      for (let i = 0; i < this.state.data.length && indexes.length < seeking; i++) {
        let obj = this.state.data[i];
        if (!obj || !obj.id) {
          continue;
        }
        if (rows[obj.id]) {
          indexes.push(i);
          toDelete.push(this.state.data[i]);
        }
      }

      const toDeleteObjectIds = [];
      toDelete.forEach((obj) => { toDeleteObjectIds.push(obj.id); });

      let relation = this.state.relation;
      if (relation && toDelete.length) {
        relation.remove(toDelete);
        relation.parent.save(null, { useMasterKey: true }).then(() => {
          if (this.state.relation === relation) {
            for (let i = 0; i < indexes.length; i++) {
              this.state.data.splice(indexes[i] - i, 1);
            }
            this.setState({
              relationCount: this.state.relationCount - toDelete.length,
            });
          }
        });
      } else if (toDelete.length) {
        Parse.Object.destroyAll(toDelete, { useMasterKey: true }).then(() => {
          let deletedNote;

          if (toDeleteObjectIds.length == 1) {
            deletedNote = className + ' with id \'' + toDeleteObjectIds[0] + '\' deleted';
          } else {
            deletedNote = toDeleteObjectIds.length + ' ' + className + ' objects deleted';
          }

          this.showNote(deletedNote, false);

          if (this.props.params.className === className) {
            for (let i = 0; i < indexes.length; i++) {
              this.state.data.splice(indexes[i] - i, 1);
            }
            this.state.counts[className] -= indexes.length;

            // If after deletion, the remaining elements on the table is lesser than the maximum allowed elements
            // we fetch more data to fill the table
            if (this.state.data.length < MAX_ROWS_FETCHED) {
              this.prefetchData(this.props, this.context);
            } else {
              this.forceUpdate();
            }
          }
        }, (error) => {
          let errorDeletingNote = null;

          if (error.code === Parse.Error.AGGREGATE_ERROR) {
            if (error.errors.length == 1) {
              errorDeletingNote = 'Error deleting ' + className + ' with id \'' + error.errors[0].object.id + '\'';
            } else if (error.errors.length < toDeleteObjectIds.length) {
              errorDeletingNote = 'Error deleting ' + error.errors.length + ' out of ' + toDeleteObjectIds.length + ' ' + className + ' objects';
            } else {
              errorDeletingNote = 'Error deleting all ' + error.errors.length + ' ' + className + ' objects';
            }
          } else {
            if (toDeleteObjectIds.length == 1) {
              errorDeletingNote = 'Error deleting ' + className + ' with id \'' + toDeleteObjectIds[0] + '\'';
            } else {
              errorDeletingNote = 'Error deleting ' + toDeleteObjectIds.length + ' ' + className + ' objects';
            }
          }

          if (error.code === 403) errorDeletingNote = error.message;


          this.showNote(errorDeletingNote, true);
        });
      }
    }
  }

  selectRow(id, checked) {
    this.setState(({ selection }) => {
      if (checked) {
        selection[id] = true;
      } else {
        delete selection[id];
      }
      return { selection };
    });
  }

  hasExtras() {
    return !!(
      this.state.showCreateClassDialog ||
      this.state.showAddColumnDialog ||
      this.state.showRemoveColumnDialog ||
      this.state.showDropClassDialog ||
      this.state.showImportDialog ||
      this.state.showImportRelationDialog ||
      this.state.showExportDialog ||
      this.state.rowsToDelete ||
      this.state.showAttachRowsDialog ||
      this.state.showAttachSelectedRowsDialog ||
      this.state.showCloneSelectedRowsDialog ||
      this.state.showEditRowDialog ||
      this.state.showPermissionsDialog
    );
  }

  showAttachRowsDialog() {
    this.setState({
      showAttachRowsDialog: true,
    });
  }

  cancelAttachRows() {
    this.setState({
      showAttachRowsDialog: false,
    });
  }

  async confirmAttachRows(objectIds) {
    if (!objectIds || !objectIds.length) {
      throw 'No objectId passed';
    }
    const relation = this.state.relation;
    const query = new Parse.Query(relation.targetClassName);
    const parent = relation.parent;
    query.containedIn('objectId', objectIds);
    let objects = await query.find({ useMasterKey: true });
    const missedObjectsCount = objectIds.length - objects.length;
    if (missedObjectsCount) {
      const missedObjects = [];
      objectIds.forEach((objectId) => {
        const object = objects.find(x => x.id === objectId);
        if (!object) {
          missedObjects.push(objectId);
        }
      });
      const errorSummary = `${missedObjectsCount === 1 ? 'The object is' : `${missedObjectsCount} Objects are`} not retrieved:`;
      throw `${errorSummary} ${JSON.stringify(missedObjects)}`;
    }
    parent.relation(relation.key).add(objects);
    await parent.save(null, { useMasterKey: true });
    // remove duplication
    this.state.data.forEach(origin => objects = objects.filter(object => object.id !== origin.id));
    this.setState({
      data: [
        ...objects,
        ...this.state.data,
      ],
      relationCount: this.state.relationCount + objects.length,
      showAttachRowsDialog: false,
    });
  }

  showAttachSelectedRowsDialog() {
    this.setState({
      showAttachSelectedRowsDialog: true,
    });
  }

  cancelAttachSelectedRows() {
    this.setState({
      showAttachSelectedRowsDialog: false,
    });
  }

  async confirmAttachSelectedRows(className, targetObjectId, relationName, objectIds, targetClassName) {
    const parentQuery = new Parse.Query(className);
    const parent = await parentQuery.get(targetObjectId, { useMasterKey: true });
    const query = new Parse.Query(targetClassName || this.props.params.className);
    query.containedIn('objectId', objectIds);
    const objects = await query.find({ useMasterKey: true });
    parent.relation(relationName).add(objects);
    await parent.save(null, { useMasterKey: true });
    this.setState({
      selection: {},
    });
  }

  showCloneSelectedRowsDialog() {
    this.setState({
      showCloneSelectedRowsDialog: true,
    });
  }

  cancelCloneSelectedRows() {
    this.setState({
      showCloneSelectedRowsDialog: false,
    });
  }

  async confirmCloneSelectedRows() {
    const objectIds = [];
    for (const objectId in this.state.selection) {
      objectIds.push(objectId);
    }
    const query = new Parse.Query(this.props.params.className);
    query.containedIn('objectId', objectIds);
    const objects = await query.find({ useMasterKey: true });
    const toClone = [];
    for (const object of objects) {
      toClone.push(object.clone());
    }
    try {
      await Parse.Object.saveAll(toClone, { useMasterKey: true });
    } catch (error) {
      if(error.code === 137){
        const newClonedObjects = [];
        toClone.forEach(cloneObj => {
          this.state.uniqueClassFields.forEach(field => {
            const fieldType =  typeof cloneObj.get(field);
            cloneObj.set(field, fieldType === 'string' ? '' : undefined);
          });
          newClonedObjects.push(cloneObj);
        });
        this.addEditCloneRows(newClonedObjects);
      }
      this.setState({
        selection: {},
        showCloneSelectedRowsDialog: false
      });
      this.showNote(error.message, true);
      return;
    }
    this.setState({
      selection: {},
      data: [
        ...toClone,
        ...this.state.data,
      ],
      showCloneSelectedRowsDialog: false,
    });
  }

  getClassRelationColumns(className) {
    const currentClassName = this.props.params.className;
    return this.getClassColumns(className, false)
      .map(column => {
        if (column.type === 'Relation' && column.targetClass === currentClassName) {
          return column.name;
        }
      })
      .filter(column => column);
  }

  getClassColumns(className, onlyTouchable = true) {
    let columns = [];
    const classes = this.props.schema.data.get('classes');
    classes.get(className).forEach((field, name) => {
        columns.push({
          ...field,
          name,
        });
    });
    if (onlyTouchable) {
      let untouchable = DefaultColumns.All;
      if (className[0] === '_' && DefaultColumns[className]) {
        untouchable = untouchable.concat(DefaultColumns[className]);
      }
      columns = columns.filter((column) => untouchable.indexOf(column.name) === -1);
    }
    return columns;
  }

  renderSidebar() {
    let current = this.props.params.className || '';
    let classes = this.props.schema.data.get('classes');
    if (!classes) {
      return null;
    }
    let special = [];
    let categories = [];
    classes.forEach((value, key) => {
      let count = this.state.counts[key];
      if (count === undefined) {
        count = '';
      } else if (count >= 1000) {
        count = prettyNumber(count);
      }
      if (SpecialClasses[key]) {
        special.push({ name: SpecialClasses[key], id: key, count: count });
      } else {
        categories.push({ name: key, count: count });
      }
    });
    special.sort((a, b) => stringCompare(a.name, b.name));
    categories.sort((a, b) => stringCompare(a.name, b.name));
    return (
      <CategoryList
        current={current}
        linkPrefix={'browser/'}
        categories={special.concat(categories)} />
    );
  }

  showNote(message, isError) {
    if (!message) {
      return;
    }

    clearTimeout(this.noteTimeout);

    if (isError) {
      this.setState({ lastError: message, lastNote: null });
    } else {
      this.setState({ lastNote: message, lastError: null });
    }

    this.noteTimeout = setTimeout(() => {
      this.setState({ lastError: null, lastNote: null });
    }, 3500);
  }

  onClickIndexManager() {
    const { appId, className } = this.props.params
    history.push({
      pathname: `/apps/${appId}/index/${className}`,
      state: { showBackButton: true }
    })
  }
  
  showEditRowDialog(selectRow, objectId) {
    // objectId is optional param which is used for doubleClick event on objectId BrowserCell
    if (selectRow) {
      // remove all selected rows and select doubleClicked row
      this.setState({ selection: {} });
      this.selectRow(objectId, true);
    }
    this.setState({
      showEditRowDialog: true,
    });
  }

  closeEditRowDialog() {
    this.setState({
      showEditRowDialog: false,
    });
  }

  handleShowAcl(row, col){
    this.refs.dataBrowser.setEditing(true);
    this.refs.dataBrowser.setCurrent({ row, col });
  }

  // skips key controls handling when dialog is opened
  onDialogToggle(opened){
    this.setState({showPermissionsDialog: opened});
  }

  renderContent() {
    let browser = null;
    let className = this.props.params.className;
    if (this.state.relation) {
      className = this.state.relation.targetClassName;
    }
    let classes = this.props.schema.data.get('classes');
    if (classes) {
      if (classes.size === 0) {
        browser = (
          <div className={styles.empty}>
            <EmptyState
              title='You have no classes yet'
              description={'This is where you can view and edit your app\u2019s data'}
              icon='files-solid'
              cta='Create your first class'
              action={this.showCreateClass} />
          </div>
        );
      } else if (className && classes.get(className)) {

        let columns = {
          objectId: { type: 'String' }
        };
        if (this.state.isUnique) {
          columns = {};
        }
        classes.get(className).forEach(({ type, targetClass }, name) => {
          if (name === 'objectId' || this.state.isUnique && name !== this.state.uniqueField) {
            return;
          }
          const info = { type };
          if (targetClass) {
            info.targetClass = targetClass;
          }
          columns[name] = info;
        });

        var count;
        if (this.state.relation) {
          count = this.state.relationCount;
        } else {
          if (className in this.state.filteredCounts) {
            count = this.state.filteredCounts[className];
          } else {
            count = this.state.counts[className];
          }
        }
        browser = (
          <DataBrowser
            ref='dataBrowser'
            isUnique={this.state.isUnique}
            uniqueField={this.state.uniqueField}
            count={count}
            perms={this.state.clp[className]}
            editCloneRows={this.state.editCloneRows}
            schema={this.props.schema}
            filters={this.state.filters}
            onFilterChange={this.updateFilters}
            onRemoveColumn={this.showRemoveColumn}
            onDeleteRows={this.showDeleteRows}
            onDropClass={this.showDropClass}
            onExport={this.showExport}
            onImport={this.showImport}
            onImportRelation={this.showImportRelation}
            onChangeCLP={this.handleCLPChange}
            onRefresh={this.refresh}
            onAttachRows={this.showAttachRowsDialog}
            onAttachSelectedRows={this.showAttachSelectedRowsDialog}
            onCloneSelectedRows={this.showCloneSelectedRowsDialog}
            onImport={this.showImport}
            onEditSelectedRow={this.showEditRowDialog}
            onEditPermissions={this.onDialogToggle}
            columns={columns}
            className={className}
            fetchNextPage={this.fetchNextPage}
            maxFetched={this.state.lastMax}
            selectRow={this.selectRow}
            selection={this.state.selection}
            data={this.state.data}
            ordering={this.state.ordering}
            newObject={this.state.newObject}
            relation={this.state.relation}
            disableKeyControls={this.hasExtras()}
            updateRow={this.updateRow}
            updateOrdering={this.updateOrdering}
            onPointerClick={this.handlePointerClick}
            setRelation={this.setRelation}
            onAddColumn={this.showAddColumn}
            onAddRow={this.addRow}
            onAbortAddRow={this.abortAddRow}
            onAddRowWithModal={this.addRowWithModal}
            onAddClass={this.showCreateClass}
            err={this.state.err}
            showNote={this.showNote}
            onClickIndexManager={this.onClickIndexManager} />
        );
      }
    }
    let extras = null;
    if (this.state.showCreateClassDialog) {
      extras = (
        <CreateClassDialog
          currentClasses={this.props.schema.data.get('classes').keySeq().toArray()}
          onCancel={() => this.setState({ showCreateClassDialog: false })}
          onConfirm={this.createClass} />
      );
    } else if (this.state.showAddColumnDialog) {
      const { currentApp = {} } = this.context;
      let currentColumns = [];
      classes.get(className).forEach((field, name) => {
        currentColumns.push(name);
      });
      extras = (
        <AddColumnDialog
          app={this.context.currentApp}
          currentColumns={currentColumns}
          classes={this.props.schema.data.get('classes').keySeq().toArray()}
          onCancel={() => this.setState({ showAddColumnDialog: false })}
          onConfirm={this.addColumn}
          parseServerVersion={currentApp.serverInfo && currentApp.serverInfo.parseServerVersion} />
      );
    } else if (this.state.showRemoveColumnDialog) {
      let currentColumns = this.getClassColumns(className).map(column => column.name);
      extras = (
        <RemoveColumnDialog
          currentColumns={currentColumns}
          onCancel={() => this.setState({ showRemoveColumnDialog: false })}
          onConfirm={this.removeColumn} />
      );
    } else if (this.state.rowsToDelete) {
      extras = (
        <DeleteRowsDialog
          className={SpecialClasses[className] || className}
          selection={this.state.rowsToDelete}
          relation={this.state.relation}
          onCancel={() => this.setState({ rowsToDelete: null })}
          onConfirm={() => this.deleteRows(this.state.rowsToDelete)} />
      );
    } else if (this.state.showDropClassDialog) {
      extras = (
        <DropClassDialog
          className={className}
          onCancel={() => this.setState({
            showDropClassDialog: false,
            lastError: null,
            lastNote: null,
          })}
          onConfirm={() => this.dropClass(className)} />
      );
    } else if (this.state.showImportDialog) {
      extras = (
          <ImportDialog
              className={className}
              onCancel={() => this.setState({ showImportDialog: false })}
              onConfirm={(file) => this.importClass(className, file)} />
      );
    } else if (this.state.showImportRelationDialog) {
      extras = (
          <ImportRelationDialog
              className={className}
              onCancel={() => this.setState({ showImportRelationDialog: false })}
              onConfirm={(relationName, file) => this.importRelation(className, relationName, file)} />
      );
    } else if (this.state.showExportDialog) {
      extras = (
        <ExportDialog
          className={className}
          onCancel={() => this.setState({ showExportDialog: false })}
          onConfirm={() => this.exportClass(className)} />
      );
    } else if (this.state.showAttachRowsDialog) {
      extras = (
        <AttachRowsDialog
          relation={this.state.relation}
          onCancel={this.cancelAttachRows}
          onConfirm={this.confirmAttachRows}
        />
      )
    } else if (this.state.showAttachSelectedRowsDialog) {
      extras = (
        <AttachSelectedRowsDialog
          classes={this.props.schema.data.get('classes').keySeq().toArray()}
          onSelectClass={this.getClassRelationColumns}
          selection={this.state.selection}
          onCancel={this.cancelAttachSelectedRows}
          onConfirm={this.confirmAttachSelectedRows}
        />
      );
    } else if (this.state.showCloneSelectedRowsDialog) {
      extras = (
        <CloneSelectedRowsDialog
          className={className}
          selection={this.state.selection}
          onCancel={this.cancelCloneSelectedRows}
          onConfirm={this.confirmCloneSelectedRows}
        />
      );
    } else if (this.state.showEditRowDialog) {
      const classColumns = this.getClassColumns(className, false);
      // create object with classColumns as property keys needed for ColumnPreferences.getOrder function
      const columnsObject = {};
      classColumns.forEach((column) => {
        columnsObject[column.name] = column
      });
      // get ordered list of class columns
      const columnPreferences = this.context.currentApp.columnPreference || {}
      const columns = ColumnPreferences.getOrder(
        columnsObject,
        this.context.currentApp.applicationId,
        className,
        columnPreferences[className]
      );
      // extend columns with their type and targetClass properties
      columns.forEach(column => {
        const { type, targetClass } = columnsObject[column.name];
        column.type = type;
        column.targetClass = targetClass;
      });

      const { data, selection, newObject } = this.state;
      // at this moment only one row must be selected, so take the first and only one
      const selectedKey = Object.keys(selection)[0];
      // if selectedKey is string "undefined" => new row column 'objectId' was clicked
      let selectedId = selectedKey === 'undefined' ? undefined : selectedKey;
      // if selectedId is undefined and newObject is null it means new row was just saved and added to data array
      const isJustSavedObject = selectedId === undefined && newObject === null;
      // if new object just saved, remove new row selection and select new added row
      if (isJustSavedObject) {
        selectedId = data[0].id;
        this.setState({ selection: {} });
        this.selectRow(selectedId, true);
      }

      const row = data.findIndex(d => d.id === selectedId);

      const attributes = selectedId
        ? data[row].attributes
        : newObject.attributes;

      const selectedObject = {
        row: row,
        id: selectedId,
        ...attributes
      };

      extras = (
        <EditRowDialog
          className={className}
          columns={columns}
          selectedObject={selectedObject}
          handlePointerClick={this.handlePointerClick}
          setRelation={this.setRelation}
          handleShowAcl={this.handleShowAcl}
          onClose={this.closeEditRowDialog}
          updateRow={this.updateRow}
          confirmAttachSelectedRows={this.confirmAttachSelectedRows}
          schema={this.props.schema}
        />
      )
    }

    let notification = null;
    const pageTitle = `${this.props.params.className} - Parse Dashboard`;

    if (this.state.lastError) {
      notification = (
        <Notification note={this.state.lastError} isErrorNote={true}/>
      );
    } else if (this.state.lastNote) {
      notification = (
        <Notification note={this.state.lastNote} isErrorNote={false}/>
      );
    }

    let tour = null;
    if (this.state.showTour) {
      const tourConfig = this.getTourConfig();
      tour = <Tour {...tourConfig} />;
    }

    return (
      <div>
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        {browser}
        {notification}
        {extras}
        {tour}
      </div>
    );
  }
}

Browser.contextTypes = {
  currentApp: PropTypes.instanceOf(ParseApp)
};
