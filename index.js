import {get, set}         from 'object-path'
import PropTypes          from 'prop-types'
import React, {Component} from 'react'
import t                  from 'tcomb-form-native/lib'
import defaultI18n        from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet  from 'tcomb-form-native/lib/stylesheets/bootstrap'
import transform          from 'tcomb-json-schema'
import walkObject         from 'walk-object'

const {Form} = t.form

Form.i18n       = defaultI18n
Form.stylesheet = defaultStylesheet


// const Type = PropTypes.oneOfType([PropTypes.string, PropTypes.object])

const TYPES_ALWAYS_REQUIRED = ['image', 'submit']
const REGEX_REPLACE_PATH = /(meta\.type\.)?meta\.props/


function cleanPropertiesLabels([name, property])
{
  this[name] = cleanLabels(property)
}

function filterComponentOptions(entry)
{
  // TODO get type properties dynamically relative to each type
  return !['displayName', 'enum', 'format', 'integer', 'is', 'pattern'].includes(entry[0])
}

function reduceProperties(required = [], [name, {type}])
{
  if(TYPES_ALWAYS_REQUIRED.includes(type))
    required.push(name)

  return required
}


function getOptions({factory, items, meta, properties = {}, type, ...componentOptions}, options = {}, factories = {})
{
  if(factory)
  {
    if(typeof factory === 'string')
    {
      const factoryName = factory
      factory = factories[factoryName]
      if(!factory)
        throw new ReferenceError(`Factory '${factoryName}' not registered`)
    }

    options.factory = factory
  }

  // array items
  if(items)
  {
    const result = getOptions(items, options.item, factories)
    if(result)
      options.item = result
  }

  // object properties
  let {fields} = options
  for(const [name, property] of Object.entries(properties))
  {
    const result = getOptions(property, fields && fields[name], factories)
    if(result)
      fields = {...fields, [name]: result}
  }
  if(fields) options.fields = fields

  if(type === 'submit') options.meta = meta

  // Component specific options
  Object.entries(componentOptions).filter(filterComponentOptions)
  .forEach(function([key, value])
  {
    options[key] = value
  })

  return options
}

function getValue({items, properties = {}, value})
{
  // array items
  if(items)
  {
    const result = getValue(items)
    if(result !== undefined)
      value = result
  }

  // object properties
  for(const [name, property] of Object.entries(properties))
  {
    const result = getValue(property)

    if(result !== undefined)
    {
      if(value === undefined) value = {}

      value[name] = result
    }
  }

  return value
}

/** Don't show 'optional' or 'required' suffix on `image` and `submit` components
 */
function cleanLabels(type)
{
  switch(type.type)
  {
    case 'array':
    {
      const {items} = type

      // Tuples support, not implemented in `tcomb-form` yet
      // https://github.com/gcanti/tcomb-form/issues/410
      // if(Array.isArray(items))
      //   type.items = items.map(cleanLabels)
      // else
        type.items = cleanLabels(items)
    }
    break

    case 'object':
    {
      const {properties} = type
      const entries = Object.entries(properties)

      entries.forEach(cleanPropertiesLabels, properties)

      const required = entries.reduce(reduceProperties, type.required)
      if(required.length)
        type.required = required
    }
    break
  }

  return type
}


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

  componentWillReceiveProps(props)
  {
    this.setState(this._getState(props))
  }

  _updateOptions(options, type)
  {
    const {_root} = this
    const disabled = {'$set': !(_root && _root.pureValidate().isValid())}

    const patch = {}
    walkObject(type, function({location, value})
    {
      if(get(value, 'meta.name') !== 'submit') return

      if(location.length)
        location = location
        .join('.')
        .replace(REGEX_REPLACE_PATH, 'fields')
        .split('.')

      const path = location.concat('disabled')

      set(patch, path, disabled)
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
      value   = getValue  (type)

      walkObject(propValue, function({isLeaf, location, value: propValue})
      {
        if(isLeaf) set(value, location, propValue)
      })

      type = transform(cleanLabels(type))
    }

    // Get fields options from JSON object
    options = this._updateOptions(options, type)

    return {options, type, value}
  }

  _onChange = value =>
  {
    const {onChange} = this.props
    const {options, type}  = this.state

    if(onChange) onChange(value)

    this.setState({options: this._updateOptions(options, type), value})
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
