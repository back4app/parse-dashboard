import { ActionTypes }  from 'lib/stores/SchemaStore'
import CategoryList from 'components/CategoryList/CategoryList.react'
import DashboardView from 'dashboard/DashboardView.react'
import EmptyState from 'components/EmptyState/EmptyState.react'
import Icon from 'components/Icon/Icon.react'
import IndexForm from './IndexForm.react'
import React from 'react'
import { SpecialClasses } from 'lib/Constants'
import stringCompare from 'lib/stringCompare'
import styles from './IndexManager.scss'
import subscribeTo from 'lib/subscribeTo'
import Swal from 'sweetalert2'
import AccountManager from 'lib/AccountManager';
import generatePath from 'lib/generatePath';
import { withRouter } from 'lib/withRouter';

@subscribeTo('Schema', 'schema')
@withRouter
class IndexManager extends DashboardView {
  constructor() {
    super();

    this.section = 'Database';
    this.subsection = 'Index Manager'

    this.state = {
      loading: true,
      selected: {},
      data: null,
      showIndexManager: false,
      canCreate: undefined,
      canDelete: undefined
    }

    this.refresh = this.refresh.bind(this)
    this.toggleRow = this.toggleRow.bind(this)
    this.showIndexForm = this.showIndexForm.bind(this)
    this.closeIndexForm = this.closeIndexForm.bind(this)
    this.createIndexes = this.createIndexes.bind(this)
    this.dropIndexes = this.dropIndexes.bind(this)
    this.allowCollaboratorToCreate = this.allowCollaboratorToCreate.bind(this)
  }

  componentWillMount() {
    const { className } = this.props.params
    this.props.schema.dispatch(ActionTypes.FETCH).then(() => {
      if (!className && this.props.schema.data.get('classes')) {
        this.redirectToFirstClass(this.props.schema.data.get('classes'), this.context);
      }
    });
    this.setState({
      canCreate: this.context.custom.isOwner,
      canDelete: this.context.custom.isOwner
    })
    if (className) {
      this.context.getIndexes(className).then(data => {
        this.setState({
          data,
          loading: false
        })
      })
    }
    // if not owner then check for collaborator
    if (!this.context.custom.isOwner) {
      const currentEmail = AccountManager.currentUser().email;

      if (Object.keys(this.context.settings.fields).length !== 0) { // if collaborators field is already loaded
        this.allowCollaboratorToCreate(this.context.settings.fields.fields.collaborators, currentEmail);
      } else {
        this.context.fetchSettingsFields().then(({ fields }) => {
          this.allowCollaboratorToCreate(fields.collaborators, currentEmail)
        });
      }
    }
  }

  allowCollaboratorToCreate (collaborators, currentEmail) {
    const isCollab = collaborators.findIndex(collab => collab.userEmail === currentEmail);
    if (isCollab !== -1) {
      this.setState({
        canCreate: true
      });
    }
  }

  redirectToFirstClass(classList, context) {
    if (!classList.isEmpty()) {
      classList = Object.keys(classList.toObject())
      const classes = classList.filter(className => className !== '_Role' && className !== '_Session' && className !== '_Installation')
      classes.sort((a, b) => {
        if (a[0] === '_' && b[0] !== '_') {
          return -1
        }
        if (b[0] === '_' && a[0] !== '_') {
          return 1
        }
        return a.toUpperCase() < b.toUpperCase() ? -1 : 1
      })
      if (classes[0]) {
        this.props.navigate(generatePath(context || this.context, 'index/' + classes[0]), {
          replace: true
        });
      } else {
        if (classList.indexOf('_User') !== -1) {
          this.props.navigate(generatePath(context || this.context, 'index/_User'), {
            replace: true,
          });
        } else {
          this.props.navigate(generatePath(context || this.context, 'index/' + classList[0]), {
            replace: true,
          });
        }
      }
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const { className } = this.props.params;
    const { className: newClassName } = nextProps.params;
    if (newClassName !== className) {
      this.setState({
        loading: true
      });
      nextContext.getIndexes(newClassName).then(data => {
        this.setState({
          data,
          loading: false
        })
      })
    }
  }

  refresh() {
    const { className } = this.props.params
    this.setState({
      loading: true,
      selected: {},
      data: null,
      showIndexManager: false
    })
    this.context.getIndexes(className).then(data => {
      this.setState({
        data,
        loading: false
      })
    })
  }

  toggleRow(name) {
    this.setState({
      selected: {
        ...this.state.selected,
        [name]: !this.state.selected[name]
      }
    })
  }

  showIndexForm() {
    this.setState({ showIndexForm: true })
  }

  closeIndexForm() {
    this.setState({ showIndexForm: false })
  }

  createIndexes(indexConfiguration) {
    const { index, indexOptions } = indexConfiguration
    delete index.objectId
    const indexName = indexOptions.name
    const indexTypes = Object.values(index)

    if (indexTypes.indexOf('geoHaystack') !== -1) {
      indexOptions.bucketSize = 1
    }

    const errorMessages = []

    if (!indexName || indexName.trim().length === 0) {
      errorMessages.push('Index name is required')
    } else if (indexName.length > 128) {
      errorMessages.push('Index name can not exceed 128 characters')
    } else {
      indexOptions.name = indexName
    }

    const { className } = this.props.params
    const schema = this.props.schema.data.get('classes').get(className).toJSON()

    if (Object.keys(index).filter(indexedField => schema[indexedField] && schema[indexedField].type === 'Array').length > 1) {
      errorMessages.push('Indexes can only have one Array field')
    }
    if (indexTypes.some((indexType, i) => i > 0 && (indexType === '2d' || indexType === '2dsphere' || indexType === 'geoHaystack'))) {
      errorMessages.push('The first index field must be the geolocation field')
    }
    if (indexTypes.indexOf('geoHaystack') !== -1 && indexTypes.length !== 2) {
      errorMessages.push('Geo haystack requires a geolocation and a non-geolocation field')
    }

    let isIndexNameValid = true, isIndexFieldsValid = true, isTextIndexValid = true
    const containsTextIndex = indexTypes.indexOf('text') !== -1
    if (!this.state.data) {
      errorMessages.push('No indexes to create')
    }
    this.state.data && this.state.data.filter(({ status }) => status !== 'ERROR').forEach(({ name, index: existingIndex }) => {
      if (name === indexName) {
        isIndexNameValid = false
      }
      if (JSON.stringify(Object.keys(JSON.parse(existingIndex))) === JSON.stringify(Object.keys(index))) {
        isIndexFieldsValid = false
      }
      if (Object.values(JSON.parse(existingIndex)).indexOf('text') !== -1 && containsTextIndex) {
        isTextIndexValid = false
      }
    })
    if (!isIndexNameValid) {
      errorMessages.push('Index name must be unique')
    }
    if (!isIndexFieldsValid) {
      errorMessages.push('It is not possible to have Indexes with same fields in same order')
    }
    if (!isTextIndexValid) {
      errorMessages.push('Only one text index is allowed per class')
    }
    if (errorMessages.length) {
      Swal.insertQueueStep({
        title: 'We found some errors',
        html: `<p style="text-align: center">${errorMessages.join('</p><p style="text-align: center">')}</p>`,
        type: 'error',
        confirmButtonText: 'OK'
      })
    } else {
      const { className } = this.props.params
      return this.context.createIndex(className, indexConfiguration)
        .then(() => {
          // add new index row with status PENDING
          // TODO: & start listening to its status
          const data = this.state.data;
          data.push({
            creationType: 'Manual',
            index: JSON.stringify(indexConfiguration.index),
            ...indexOptions,
            status: 'PENDING',
            updatedAt: '-',
          });
          this.setState({ data });
        }).catch(e => {
          Swal.insertQueueStep({
            title: 'Index creation failure',
            text: 'Error while creating the indexes. Please try again later.',
            type: 'error'
          });
          console.trace(e);
        }).finally(() => {
          this.closeIndexForm();
        });
    }
  }

  dropIndexes() {
    const { className } = this.props.params
    const indexesToDrop = Object.entries(this.state.selected).filter(([, isSelected]) => isSelected).map(([indexName]) => indexName)
    if (indexesToDrop.length === 0) {
      Swal.fire({
        title: 'Please select at least one index to drop',
        type: 'error'
      })
      return
    }
    Swal.mixin().queue([
      {
        title: 'Are you sure you want to delete the following indexes?',
        html: `<p style="text-align: center">${indexesToDrop.join('</p><p style="text-align: center">')}</p>`,
        type: 'warning',
        confirmButtonText: 'Delete',
        showCancelButton: true,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          return this.context.dropIndexes(className, indexesToDrop)
            .then(() => {
              Swal.close()
              this.refresh()
            })
            .catch(e => {
              console.trace(e)
            })
        }
      },
      {
        title: 'Index drop failure',
        text: 'Error while dropping the indexes. Please try again later.',
        type: 'error'
      }
    ])
  }

  renderIndexForm() {
    if (this.state.showIndexForm) {
      const { className } = this.props.params
      const schema = this.props.schema.data.get('classes').get(className).toJSON()
      delete schema.ACL
      const classes = {
        [className]: Object.keys(schema)
      }
      return <IndexForm classes={classes} dataTypes={schema} onConfirm={this.createIndexes} onCancel={this.closeIndexForm} />
    }
    return null
  }

  renderRows() {
    if (!this.state.data) {
      return null
    }
    return this.state.data.map(({ name, index, creationType, status, unique = false, sparse = false, expireAfterSeconds, weights, size }) => {
      let isAutomaticIndex = name === '_id_';
      if (this.props.params.className === '_User' && (name === 'username_1' || name === 'email_1')) {
        isAutomaticIndex = true;
      }
      if (this.props.params.className === '_Role' && name === 'name_1') {
        isAutomaticIndex = true;
      }
      return (
        <tr key={name}>
          {!this.state.isReadOnly && <td className={styles.selectedContainer}>
            {(status === 'SUCCESS' || status === 'ERROR') && <input type='checkbox' disabled={isAutomaticIndex} value={!!this.state.selected[name]} onChange={() => this.toggleRow(name)} />}
          </td>}
          <td className={this.state.isReadOnly ? styles.readOnly : ''}>{name}</td>
          <td>{creationType}</td>
          <td className={[styles.indexStatus, styles[`indexStatus-${status.toLowerCase()}`]].join(' ')}>
            <span className={styles.statusIcon}>●</span>
            {status}
          </td>
          <td>{index}</td>
          <td>{unique ? 'True' : 'False'}</td>
          <td>{sparse ? 'True' : 'False'}</td>
          {/* <td>{expireAfterSeconds ? expireAfterSeconds : '-'}</td> */}
          <td>{weights ? JSON.stringify(weights) : '-'}</td>
          <td>{size ? `${size}MB` : '-'}</td>
        </tr>
      )
    })
  }

  renderSidebar() {
    const className = this.props.params.className || ''
    const classes = this.props.schema.data.get('classes')
    if (!classes) {
      return null
    }
    const special = []
    const categories = []
    classes.forEach((value, key) => {
      if (SpecialClasses[key]) {
        special.push({ name: SpecialClasses[key], id: key })
      } else {
        categories.push({ name: key })
      }
    });
    special.sort((a, b) => stringCompare(a.name, b.name))
    categories.sort((a, b) => stringCompare(a.name, b.name))

    return <CategoryList current={className} linkPrefix='index/' categories={special.concat(categories)} />
  }

  renderContent() {
    let { className } = this.props.params
    if (className && className.startsWith('_')) {
      className = className.substr(1, className.length - 1)
    }
    const { showBackButton } = this.props.location.state || {};
    const selectionLength = Object.entries(this.state.selected).filter(([, isSelected]) => isSelected).length;

    return (
      <div className={styles.indexManager}>
        <div className={styles.headerContainer}>
          <div className={styles.headerDescriptionContainer}>
            {showBackButton ? (
              <a className={styles.iconButton} onClick={() => this.props.navigate(-1)} title='Back to Database Browser'>
                <Icon width={32} height={32} fill="#ffffff" name="left-outline" />
              </a>
            ) : null}
            <section className={styles.header}>
              <span className={styles.subtitle}>Index Manager</span>
              <div>
                <span className={styles.title}>{className} Indexes</span>
              </div>
            </section>
          </div>

          <section className={styles.toolbar}>
            {this.state.canCreate && (
              <a className={styles.addBtn} onClick={this.showIndexForm} title="Add an Index">
                <Icon name='add-outline' width={14} height={14} />
                <span>Index</span>
              </a>
            )}
            <a className={styles.toolbarButton} onClick={this.refresh} title='Refresh'>
              <Icon name='refresh-icon' width={30} height={26} />
            </a>
            {this.state.canDelete && (
              <a
                className={styles.deleteBtn + ` ${(selectionLength > 0) && styles.active}`}
                onClick={selectionLength === 0 ? null : this.dropIndexes}
              >
                <Icon name='delete-icon' width={24} height={20} />
              </a>
            )}
          </section>
        </div>
        {this.state.data && this.state.data.length === 0
          ? <EmptyState icon='index-manager' title='No indexes were found' description='Create an index using the button located on the top right side' />
          : (
            <div className={styles.indexTableContainer}>
              <table className={styles.indexTable}>
                <thead>
                  <tr>
                    {!this.state.isReadOnly && <th style={{ width: 50 }}></th>}
                    <th className={this.state.isReadOnly ? styles.readOnly : ''}>Name</th>
                    <th>Creation Type</th>
                    <th>Status</th>
                    <th>Fields</th>
                    <th>Unique</th>
                    <th>Sparse</th>
                    {/* <th>TTL</th> */}
                    <th>Weight</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {this.renderRows()}
                </tbody>
              </table>
            </div>
          )
        }
        {this.renderIndexForm()}
      </div>
    )
  }
}

export default IndexManager
