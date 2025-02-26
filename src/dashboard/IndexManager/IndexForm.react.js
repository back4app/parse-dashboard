import React, { Component } from 'react'
import Dropdown from 'components/Dropdown/Dropdown.react';
import Field from 'components/Field/Field.react';
import Icon from 'components/Icon/Icon.react'
import Label from 'components/Label/Label.react';
import B4aModal from 'components/B4aModal/B4aModal.react'
import Option from 'components/Dropdown/Option.react';
import PropTypes from 'lib/PropTypes'
import TextInput from 'components/TextInput/TextInput.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';
import styles from 'dashboard/IndexManager/IndexForm.scss';
import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2';

import buttonStyles from 'components/Button/Button.scss';
import baseStyles from 'stylesheets/base.scss';
import modalStyles from 'components/B4aModal/B4aModal.scss';

const MySwal = withReactContent(Swal.mixin({
  customClass: {
    header: '',
    title: `${modalStyles.title} ${styles.sweetalertTitle}`,
    htmlContainer: `${styles.sweetalertContainer}`,
    closeButton: styles.sweetalertCloseBtn,
    icon: styles.sweetalertIcon,
    input: styles.sweetalertInput,
    actions: `${styles.sweetalertActions}`,
    confirmButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.primary, buttonStyles.green].join(' '),
    cancelButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.white].join(' '),
    loader: styles.sweetalertLoader,
  },
  buttonsStyling: false,
}));

class IndexForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedClass: undefined,
      indexFields: {},
      indexName: '',
      unique: false,
      sparse: false,
      // expireAfterSeconds: '',
      //weights: {}
    }
    this.onChangeIndexName = this.onChangeIndexName.bind(this)
    this.createIndex = this.createIndex.bind(this)
    // this.onChangeTTL = this.onChangeTTL.bind(this)
    this.onBlurIndexWeight = this.onBlurIndexWeight.bind(this)
    this.getDefaultIndexName = this.getDefaultIndexName.bind(this)
  }

  componentDidMount() {
    const classes = Object.keys(this.props.classes)
    if (classes.length === 1) {
      this.setState({ selectedClass: classes[0] })
    }
  }

  addIndex(field) {
    this.setState({
      indexFields: {
        ...this.state.indexFields,
        [field]: '1'
      }
    },this.getDefaultIndexName)
  }

  removeIndex(field) {
    const newState = { ...this.state.indexFields }
    delete newState[field]
    this.setState({ indexFields: newState },this.getDefaultIndexName)
  }

  updateIndexField(field, newField) {
    const newState = { ...this.state.indexFields }
    delete newState[field]
    newState[newField] = '1'
    this.setState({ indexFields: newState }, this.getDefaultIndexName)
  }

  updateIndexType(field, type) {
    const newState = { ...this.state.indexFields }
    newState[field] = type

    const newWeights = { ...this.state.weights }
    // Update the weight, if the type is text
    if (type === 'text') {
      newWeights[field] = '1'
    }
    // Otherwise, delete this weight
    else if (newWeights[field]) {
      delete newWeights[field]
    }
    this.setState({
      indexFields: newState,
      weights: newWeights
    }, this.getDefaultIndexName)
  }

  updateIndexWeight(field, weight) {
    if (weight === '') {
      const newWeights = {
        ...this.state.weights
      }
      delete newWeights[field]
      this.setState({
        weights: newWeights
      })
      return
    }
    const intWeight = Math.abs(parseInt(weight))
    if (intWeight > Number.MAX_SAFE_INTEGER) {
      return
    }
    if (!isNaN(intWeight)) {
      this.setState({
        weights: {
          ...this.state.weights,
          [field]: intWeight.toString()
        }
      })
    }
  }

  onBlurIndexWeight(field, weight) {
    if (!weight) {
      // If, on blur, the weight was left with an invalid value
      // sets 1, which is the default value
      this.setState({
        weights: {
          ...this.state.weights,
          [field]: 1
        }
      })
    }
  }

  // onChangeTTL(value) {
  //   if (value === '') {
  //     this.setState({
  //       expireAfterSeconds: ''
  //     })
  //     return
  //   }
  //   const ttl = Math.abs(parseInt(value))
  //   if (ttl > Number.MAX_SAFE_INTEGER) {
  //     return
  //   }
  //   if (!isNaN(ttl)) {
  //     this.setState({
  //       expireAfterSeconds: ttl.toString()
  //     })
  //   }
  // }

  onChangeIndexName(value = '') {
    this.setState({
      indexName: value.length > 128 ? value.substr(0, 128) : value
    })
  }

  getDefaultIndexName() {
    let idxName = '';
    const { indexFields } = this.state;
    const { dataTypes } = this.props;
    for (let [key, value] of Object.entries(indexFields)) {
      if (key === 'objectId') {
        key = '_id'
      } else if (key === 'updatedAt') {
        key = '_updated_at'
      } else if (key === 'createdAt') {
        key = '_created_at'
      } else if (key === 'email_verify_token' && selectedClass === "_User") {
        key = '_email_verify_token'
      } else if (key === 'session_token' && selectedClass === "_Session") {
        key = '_session_token'
      } else {
        // Check if column is a pointer
        if (dataTypes[key].type === 'Pointer') key = `_p_${key}`
      }
      idxName += `${key}_${value}`;
    }
    this.setState({ indexName: idxName })
  }

  createIndex() {
    const { indexFields, indexName: name, sparse, unique, weights = {}, selectedClass } = this.state
    const { dataTypes } = this.props;

    const index = {}
    // If the index is ascending (1) or descending (-1), we need to convert it to number
    for (let [key, value] of Object.entries(indexFields)) {
      // objectId does not exists on the database, only _id does
      if (key === 'objectId') {
        key = '_id'
      } else if (key === 'updatedAt') {
        key = '_updated_at'
      } else if (key === 'createdAt') {
        key = '_created_at'
      } else if (key === 'email_verify_token' && selectedClass === "_User") {
        key = '_email_verify_token'
      } else if (key === 'session_token' && selectedClass === "_Session") {
        key = '_session_token'
      } else {
        // Check if column is a pointer
        if (dataTypes[key].type === "Pointer") key = `_p_${key}`
      }
      if (value === '-1') {
        index[key] = -1
      } else if (value === '1') {
        index[key] = 1
      } else {
        index[key] = value
      }
    }
    const indexOptions = {
      name,
      sparse,
      unique,
      // expireAfterSeconds,
    }

    if (weights && Object.keys(weights).length > 0) {
        indexOptions.weights = Object.entries(weights).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'string' ? parseInt(value, 10) : value;
          return acc;
        }, {});
      }

    const indexConfiguration = {
      index,
      indexOptions
    }

    MySwal.fire({
      title: 'Are you sure you want to create the indexes?',
      text: 'This process will run in background and could take minutes, depending on your class size.',
      type: 'warning',
      showLoaderOnConfirm: true,
      confirmButtonText: 'Confirm',
      showCancelButton: true,
      reverseButtons: true,
      preConfirm: () => {
        return this.props.onConfirm(indexConfiguration)
      },
      showCloseButton: true,
    })
  }

  renderClassContent() {
    const { selectedClass, indexFields } = this.state
    if (!selectedClass) return null

    const fields = selectedClass ? this.props.classes[selectedClass] : []
    const nonIndexedFields = fields.filter(field => {
      return !indexFields[field]
    })

    const options = {
      Ascending: '1',
      Descending: '-1',
      Hashed: 'hashed',
      '2D Sphere': '2dsphere',
      '2D': '2d',
      'Geo Haystack': 'geoHaystack',
      'Text': 'text'
    }

    const rows = Object.entries(indexFields).map(([name, type]) =>
      <tr key={name}>
        <td>
          <Dropdown value={name} onChange={value => this.updateIndexField(name, value)}>
            {[name, ...nonIndexedFields].map(field =>
              <Option key={field} value={field}>
                {field}
              </Option>
            )}
          </Dropdown>
        </td>
        <td>
          <Dropdown placeholder='Choose a field' value={type} onChange={value => this.updateIndexType(name, value)}>
            {Object.entries(options).map(([ label, value ]) =>
              <Option key={value} value={value}>
                {label}
              </Option>
            )}
          </Dropdown>
        </td>
        {type === 'text'
          ? (
            <td>
              <TextInput dark={false} padding="0 1rem" value={this.state.weights[name]} onChange={weight => this.updateIndexWeight(name, weight)} onBlur={e => this.onBlurIndexWeight(name, e.target.value)} />
            </td>
          )
          : <td className={styles.disabled}>-</td>
        }
        <td>
          <Icon className={styles.deleteIndexBtn} name='b4a-delete-icon' width={18} height={18} fill='#E85C3E' onClick={() => this.removeIndex(name)} />
        </td>
      </tr>
    )
    if (nonIndexedFields.length > 0) {
      rows.push(
        <tr key='new-index'>
          <td>
            <Dropdown placeHolder='Choose a field' value={this.state.selectedClass} onChange={value => this.addIndex(value)}>
              {['', ...nonIndexedFields].map(field =>
                <Option key={field} value={field}>{field}</Option>
              )}
            </Dropdown>
          </td>
          <td className={styles.disabled}>-</td>
          <td className={styles.disabled}>-</td>
        </tr>
      )
    }

    const fieldsInput = (
      <table className={styles.indexFormTable}>
        <thead>
          <tr>
            <th>Field</th>
            <th>
              <div className={styles.indexFormHeaderContainer}>
                <span>Index Type</span>
                <Icon className={styles.helpButton} name='info-outline' width={16} height={16} fill='#169CEE' onClick={() => window.open('https://docs.mongodb.com/manual/indexes/#index-types', '_blank')} />
              </div>
            </th>
            <th>Weight</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
    return (
      <>
        <Field
          labelWidth={35}
          label={<Label text='Fields' description='Choose the fields and the rule to fetch within it' />}
          input={fieldsInput} />
        <Field
          labelWidth={35}
          label={<Label text='Name' description='Give an easy name to identify your index' />}
          input={<TextInput placeholder='Input the index name' padding="0 1rem" dark={false} value={this.state.indexName} onChange={this.onChangeIndexName} />} />
      </>
    )
  }

  render() {
    const classes = Object.keys(this.props.classes)
    const classDropdown = classes.length === 1
      ? <TextInput value={classes[0]} disabled={true} onChange={() => {}} dark={false} padding="0 1rem" />
      : (
        <Dropdown value={this.state.selectedClass} onChange={c => this.setState({ selectedClass: c })}>
          {Object.keys(this.props.classes).map(c => <Option key={c} value={c}>{c}</Option>)}
        </Dropdown>
      )

    return (
      <B4aModal width={700} type={B4aModal.Types.INFO} title='New Index' subtitle='Optimize your queries performance' confirmText='Create Index' onConfirm={this.createIndex} onCancel={this.props.onCancel}>
        <div className={styles.indexFormContainer}>
          <Field
            labelWidth={35}
            label={<Label text='Class' description='The Class you want to get indexed' />}
            input={classDropdown} />
          {this.renderClassContent()}
          <Field
            labelWidth={35}
            label={<Label text='Unique' description='' help={<Icon className={styles.helpButton} name='info-outline' width={16} height={16} fill='#169CEE' onClick={() => window.open('https://docs.mongodb.com/manual/core/index-unique/', '_blank')} />} />}
            input={<div style={{ width: '100%', padding: '0 1rem' }}>
              <B4aToggle type={B4aToggle.Types.TRUE_FALSE} value={this.state.unique} onChange={unique => this.setState({ unique })} />
            </div>} />
          <Field
            labelWidth={35}
            label={<Label text='Sparse' description='' help={<Icon className={styles.helpButton} name='info-outline' width={16} height={16} fill='#169CEE' onClick={() => window.open('https://docs.mongodb.com/manual/core/index-sparse/', '_blank')} />} />}
            input={
              <div style={{ width: '100%', padding: '0 1rem' }}>
                <B4aToggle type={B4aToggle.Types.TRUE_FALSE} value={this.state.sparse} onChange={sparse => this.setState({ sparse })} />
              </div>
            } />
          {/* <Field
            labelWidth={35}
            label={<Label text='TTL' description='' help={<Icon className={styles.helpButton} name='info-outline' width={16} height={16} fill='#169CEE' onClick={() => window.open('https://docs.mongodb.com/manual/core/index-ttl/', '_blank')} />} />}
            input={
              <TextInput
                placeholder='Input the index time to live (in seconds)'
                value={this.state.expireAfterSeconds}
                onChange={expireAfterSeconds => this.onChangeTTL(expireAfterSeconds)} />
            } /> */}
        </div>
      </B4aModal>
    )
  }
}

IndexForm.PropTypes = {
  classes: PropTypes.object.describe('The map of class name as key and the array of fields as value').isRequired,
  onConfirm: PropTypes.func.describe('The function invoked when the user confirms the index creation'),
  onCancel: PropTypes.func.describe('The function invoked when the user cancels the index creation')
}

export default IndexForm
