import { get, set }       from 'object-path'
import PropTypes          from 'prop-types'
import React, { Component } from 'react' // eslint-disable-line
import t                  from 'tcomb-form-native/lib'
import defaultI18n        from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet  from 'tcomb-form-native/lib/stylesheets/bootstrap'
import transform          from 'tcomb-json-schema'
import walkObject         from '@foqum/walk-object'
import { processRemoteRequests } from 'tcomb-form-native-builder-utils'

import {
  jsonToTcombObjectAndUpdate,
  objectArray2Object,
  objectEquals,
} from './utilities'

const { Form } = t.form

Form.i18n = defaultI18n
Form.stylesheet = defaultStylesheet

const REGEX_REPLACE_PATH = /(meta\.type\.)?meta\.props/


class Builder extends Component {

  /* eslint-disable */
  static propTypes = {
    onChangeWidgetProperty: PropTypes.func,
    commentFilled: PropTypes.bool,
    context: PropTypes.object,
    factories: PropTypes.object,
    i18n: PropTypes.object,
    onChange: PropTypes.func,
    options: PropTypes.object,
    stylesheet: PropTypes.object,
    templates: PropTypes.object.isRequired,
    type: PropTypes.object,
    value: PropTypes.any,
  }
  /* eslint-enable */

  constructor(props) {
    super(props)
    this.state = this._getState(props)
  }

  componentDidMount() {
    let state = this._getState(this.props)
    state = {
      'dependencies': this._extractDependencies(),
      'submitted': false,
      ...state,
    }
    this.setState(state)
  }

  // TODO: Clean
  componentDidUpdate(prevProps, prevState) {
    const { type: { properties } } = this.props
    const { dependencies, value } = this.state
    // eslint-disable-next-line
    if (prevProps !== this.props) this.setState(this._getState(this.props))
    // Fields with dependencies
    if ((value && prevState.value) && !objectEquals(prevState.value, value)) {
      Object.entries(dependencies).forEach(([dependency, dependantFields]) => {
        if (JSON.stringify(prevState.value[dependency]) !== JSON.stringify(value[dependency])) {
          const requests = []
          const dependentFieldsArray = []
          dependantFields.forEach((dependentField) => {
            const replaceString = '${' + dependency + '}'  // eslint-disable-line
            let query = properties[dependentField].meta.body
            query = query.replace(replaceString, `"${value[dependency]}"`)
            dependentFieldsArray.push(dependentField)
            requests.push(processRemoteRequests(properties[dependentField].uri, {}, {}, query))
          })
          Promise.all(requests).then((responses) => {
            responses.forEach((response, i) => {
              const { path } = properties[dependentFieldsArray[i]].meta
              const key = properties[dependentFieldsArray[i]].meta.fieldLabel
              const fieldValue = get(response, path) ? get(response, path)[key] : ''  // eslint-disable-line
              const date = new Date(Date.parse(fieldValue))
              if (!isNaN(date) && date.toISOString() === String(fieldValue)) { // eslint-disable-line
                value[dependentFieldsArray[i]] = date.toLocaleDateString()
              } else if (typeof fieldValue === 'boolean') {
                value[dependentFieldsArray[i]] = fieldValue
              } else if (Array.isArray(fieldValue)) {
                const { fieldID, fieldLabelIfDependency } = properties[dependentFieldsArray[i]].meta
                value[dependentFieldsArray[i]] = objectArray2Object(fieldValue, fieldID, fieldLabelIfDependency)
                properties[dependentFieldsArray[i]].enum = objectArray2Object(fieldValue, fieldID, fieldLabelIfDependency)
              } else {
                value[dependentFieldsArray[i]] = String(fieldValue)
              }
            })
            this._onChange(value)
          }).catch(error => console.error(error))
        }
      })
    }
  }

  _onChange = (value) => {
    const { onChange } = this.props
    const { options, type } = this.state
    if (onChange) onChange(value)

    this.setState({ options: this._updateOptions(options, type, true), value })
  }

  _triggerValidation = () => {
    this.setState({ submitted: true })
  }

  _extractDependencies() {
    const { type } = this.props
    const dependencies = {}
    Object.entries(type.properties).forEach(([property, fields]) => {
      if (fields.meta && fields.meta.dependencies) {
        fields.meta.dependencies.forEach((dep) => {
          dependencies[dep] = dependencies[dep] || []
          dependencies[dep].push(property)
        })
      }
    })

    return dependencies
  }

  // get the current value and options of the form
  _getState(props) {

    const {
      onChangeWidgetProperty,
      children,
      factories,
      formats = {},
      onSubmit,
      requestUploadUrl,
      url,
      types = {},
    } = props

    // value is the value of the whole form in an object, and will be updated with every change on the form
    let { options = {}, type, value } = props

    // transform is a function that transform a valid json to a tcomb object attending the registered formats and types
    // Remove all the registered formats and types
    transform.resetFormats()
    transform.resetTypes()

    // Register formats and types as props from the json
    Object.entries(formats).forEach(entry => transform.registerFormat(...entry))
    Object.entries(types).forEach(entry => transform.registerType(...entry))

    // Pass custom variables and callbacks to the `Form` instance trhough the options field
    if (onSubmit) options.onSubmit = onSubmit
    if (requestUploadUrl) options.requestUploadUrl = requestUploadUrl
    if (url) options.url = url
    options.triggerValidation = this._triggerValidation

    // Get type definition
    type = type || children || {}

    // If a string is passed it is first transform to JSON object
    if (typeof type === 'string') type = JSON.parse(type)

    if (!(typeof type === 'function')) {
      [type, options, value] = jsonToTcombObjectAndUpdate(type, value, options, factories, transform, onChangeWidgetProperty)
    }
    // Update values ot the options like if there is a validation error, disable submit values
    options = this._updateOptions(options, type)

    return { options, type, value }
  }

  // currently it enables/disables submit button depending on required fields
  // in this function we update dynamically values in the form depending onChanges
  _updateOptions(options, type, validate = false) {
    const { commentFilled = true } = this.props
    const { _root } = this

    let disabled = { '$set': true }

    // Enable buttons
    if (_root) {
      const { submitted } = this.state
      if (submitted && validate) _root.validate() // show errors
      disabled = { '$set': !(_root && _root.pureValidate().isValid() && commentFilled) }
    }

    const patch = {}
    walkObject(type, ({ location, value }) => {
      if (get(value, 'meta.name') === 'submit') {

        if (location.length) {
          location = location.join('.').replace(REGEX_REPLACE_PATH, 'fields').split('.')
        }
        const path = location.concat('disabled')

        set(patch, path, disabled)
      }
    })
    options = t.update(options, patch)

    if (options) {
      const descriptor = { configurable: true, value: _root }
      walkObject(options, ({ value }) => {
        if (!value || value.constructor.name !== 'Object') return

        Object.defineProperty(value, 'form', descriptor)
      })
    }

    return options
  }

  render() {
    const { context, i18n, stylesheet, templates } = this.props
    const { options, type, value } = this.state
    options.config = Object.assign({ fields: options.fields }, options.config)
    return (
      <Form
        context={context}
        i18n={i18n || defaultI18n}
        onChange={this._onChange}
        options={options}
        ref={(component) => {
          this._root = component
        }}
        stylesheet={stylesheet}
        templates={templates}
        type={type}
        value={value}
      />
    )
  }

}

// Export `tcomb` types
Builder.t = t

export default Builder
