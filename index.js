import {get, set}         from 'object-path'
import PropTypes          from 'prop-types'
import React, {Component} from 'react'
import t                  from 'tcomb-form-native/lib'
import defaultI18n        from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet  from 'tcomb-form-native/lib/stylesheets/bootstrap'
import transform          from 'tcomb-json-schema'
import walkObject         from 'walk-object'
import { processRemoteRequests } from 'tcomb-form-native-builder-utils'

import {
        getOptions,
        getValue,
        cleanLabels
      } from './utilities'

const {Form} = t.form

Form.i18n       = defaultI18n
Form.stylesheet = defaultStylesheet

const REGEX_REPLACE_PATH = /(meta\.type\.)?meta\.props/


class Builder extends Component
{
  static propTypes =
  {
    // children: Type,
    context: PropTypes.object,
    factories: PropTypes.object,
    i18n: PropTypes.object,
    onChange: PropTypes.func,
    options: PropTypes.object,
    stylesheet: PropTypes.object,
    templates: PropTypes.object.isRequired,
    // type: Type,
    value: PropTypes.any
  }

  constructor(props)
  {
    super(props)

    this.state = this._getState(props)
  }

  extractDependencies() {
    const { type } = this.props
    const dependencies = {}
    Object.entries(type.properties).forEach(([property, fields]) => {
      if (fields.meta && fields.meta.dependencies) {
        fields.meta.dependencies.forEach((dep) => {
          if (!dependencies[dep]) {
            dependencies[dep] = []
          }
          dependencies[dep].push(property)
        })
      }
    });
    return dependencies
  }

  componentDidMount()
  {
    const state = this._getState(this.props)
    state.dependencies = this.extractDependencies()
    this.setState(state)
  }

  UNSAFE_componentWillReceiveProps(props) // eslint-disable-line
  {
    this.setState(this._getState(props))
  }

  // currently it enables/disables submit button depending on required fields
  // in this function we update dynamically values in the form depending onChanges
  _updateOptions(options, type)
  {
    const {_root} = this
    const disabled = {'$set': !(_root && _root.pureValidate().isValid())}
    const patch = {}
    walkObject(type, function({location, value})
    {
      if(get(value, 'meta.name') === 'submit')
      {

        if(location.length)
          location = location
          .join('.')
          .replace(REGEX_REPLACE_PATH, 'fields')
          .split('.')

        const path = location.concat('disabled')

        set(patch, path, disabled)
      }
    })
    options = t.update(options, patch)

    if(options)
    {
      const descriptor = {configurable: true, value: _root}
      walkObject(options, function({value})
      {
        if(!value || value.constructor.name !== 'Object') return

        Object.defineProperty(value, 'form', descriptor)
      })
    }

    return options
  }

  _getState({children, factories, formats = {}, onSubmit, options, type, types = {}, value})
  {
    // Remove all the registered formats and types
    transform.resetFormats()
    transform.resetTypes()

    // Register formats and types
    Object.entries(formats).forEach(entry => transform.registerFormat(...entry))
    Object.entries(types).forEach(entry => transform.registerType(...entry))

    // Pass `onSubmit` callback to the `Form` instance
    if(onSubmit)
    {
      if(!options) options = {}

      options.onSubmit = onSubmit
    }

    // Get type definition
    type = type || children || {}

    // string to JSON object
    if(typeof type === 'string') type = JSON.parse(type)

    // JSON object to tcomb
    if(!(type instanceof Function))
    {
      const propValue = value

      options = getOptions(type, options, factories)

      // update current values with prop values (controlled component)
      value   = getValue(type)
      walkObject(propValue, function({isLeaf, location, value: propValue}) // eslint-disable-line
      {
        if(isLeaf) set(value, location, propValue)
      })

      // add fields if required
      type = transform(cleanLabels(type))
    }

    // Get fields options from JSON object
    options = this._updateOptions(options, type)

    return {options, type, value}
  }

  getAllFieldsDependency () {
    const { options: { fields } } = this.state
    Object.entries(formats).forEach(entry => transform.registerFormat(...entry))
    
  }

  componentDidMount() {
    this.setState({
      dependencies: this.getAllFieldsDependency()
    })
  }

  componentDidUpdate(prevProps, prevState) {
    const { options: { fields: prevfields },  value: prevValue } = prevState
    const { options: { fields },  value } = this.state

    if (prevValue !== value){
      console.log(prevValue)
      console.log(value)
    }
  }

  _onChange = value =>
  {
    const {onChange} = this.props
    const {options, type}  = this.state
    if(onChange) onChange(value)

    this.setState({options: this._updateOptions(options, type), value})
  }

  componentDidUpdate(_, prevState) {
    const { properties } = this.props.type
    const { dependencies, value } = this.state
    if (prevState.value !== value) {
      Object.entries(dependencies).forEach(([dependency, dependantFields]) => {
        if (prevState.value[dependency] !== value[dependency]) {
          dependantFields.forEach((dependentField) => {
            value[dependentField] = ''
            const replaceString = '${'+dependency+'}'
            let query = properties[dependentField].meta.body
            query = query.replace(replaceString, `"${value[dependency]}"`)
            processRemoteRequests(properties[dependentField].uri, {}, {}, query).then((response) => {
              const path = properties[dependentField].meta.path
              const key = properties[dependentField].meta.fieldLabel
              const fieldValue = get(response,path) ? get(response,path)[key]: ''
              const date = new Date(Date.parse(fieldValue))
              if (!isNaN(date) && date.toISOString() === String(fieldValue)){
                value[dependentField] = date.toLocaleDateString()
              } else if (typeof fieldValue === "boolean") {
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

  render()
  {
    const {context, i18n, stylesheet, templates} = this.props
    const {options, type, value} = this.state
    return <Form
      context={context}
      i18n={i18n || defaultI18n}
      onChange={this._onChange}
      options={options}
      ref={component => this._root = component}
      stylesheet={stylesheet}
      templates={templates}
      type={type}
      value={value}
    />
  }
}


// Export `tcomb` types
Builder.t = t


export default Builder
