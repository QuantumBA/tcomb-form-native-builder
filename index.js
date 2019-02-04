import { get, set }       from 'object-path'
import PropTypes          from 'prop-types'
import React, { Component } from 'react' // eslint-disable-line
import t                  from 'tcomb-form-native/lib'
import defaultI18n        from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet  from 'tcomb-form-native/lib/stylesheets/bootstrap'
import transform          from 'tcomb-json-schema'
import walkObject         from 'walk-object'
import { processRemoteRequests } from 'tcomb-form-native-builder-utils'

import {
  getOptions,
  getValue,
  cleanLabels,
} from './utilities'

const { Form } = t.form

Form.i18n = defaultI18n
Form.stylesheet = defaultStylesheet

const REGEX_REPLACE_PATH = /(meta\.type\.)?meta\.props/


class Builder extends Component {

  /* eslint-disable */
  static propTypes = {
    // children: Type,
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
    const state = this._getState(this.props)
    state.dependencies = this.extractDependencies()
    this.setState(state)
  }

  // Fields with dependencies
  componentDidUpdate(_, prevState) {
    const { type: { properties } } = this.props
    const { dependencies, value } = this.state
    if (prevState.value !== value) {
      Object.entries(dependencies).forEach(([dependency, dependantFields]) => {
        if (prevState.value[dependency] !== value[dependency]) {
          dependantFields.forEach((dependentField) => {
            value[dependentField] = ''
            const replaceString = '${' + dependency + '}'  // eslint-disable-line
            let query = properties[dependentField].meta.body
            query = query.replace(replaceString, `"${value[dependency]}"`)
            processRemoteRequests(properties[dependentField].uri, {}, {}, query).then((response) => {
              const { path } = properties[dependentField].meta
              const key = properties[dependentField].meta.fieldLabel
              const fieldValue = get(response, path) ? get(response, path)[key] : ''  // eslint-disable-line
              const date = new Date(Date.parse(fieldValue))
              if (!isNaN(date) && date.toISOString() === String(fieldValue)) { // eslint-disable-line
                value[dependentField] = date.toLocaleDateString()
              } else if (typeof fieldValue === 'boolean') {
                value[dependentField] = fieldValue
              } else {
                value[dependentField] = String(fieldValue)
              }
              this._onChange(value)
            })
          })
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

  _getState({ children, factories, formats = {}, onSubmit, options, type, types = {}, value }) {
    // Remove all the registered formats and types
    transform.resetFormats()
    transform.resetTypes()

    // Register formats and types
    Object.entries(formats).forEach(entry => transform.registerFormat(...entry))
    Object.entries(types).forEach(entry => transform.registerType(...entry))

    // Pass `onSubmit` callback to the `Form` instance
    if (onSubmit) {
      if (!options) options = {}

      options.onSubmit = onSubmit
    }

    // Get type definition
    type = type || children || {}

    // string to JSON object
    if (typeof type === 'string') type = JSON.parse(type)

    // JSON object to tcomb
    if (!(type instanceof Function)) {
      const propValue = value

      options = getOptions(type, options, factories)

      // update current values with prop values (controlled component)
      value = getValue(type)
      walkObject(propValue, ({ isLeaf, location, value: propValue }) => {
        if (isLeaf) set(value, location, propValue)
      })

      // add fields if required
      type = transform(cleanLabels(type))
    }

    // Get fields options from JSON object
    options = this._updateOptions(options, type)

    return { options, type, value }
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.setState(this._getState(props))
  }

  extractDependencies() {
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

  // currently it enables/disables submit button depending on required fields
  // in this function we update dynamically values in the form depending onChanges
  _updateOptions(options, type, validate = false) {
    const { _root } = this
    // show field errors
    if (_root && validate) _root.validate()

    const disabled = { '$set': !(_root && _root.pureValidate().isValid()) }
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
