import PropTypes          from 'prop-types'
import React, {Component} from 'react'
import t                  from 'tcomb-form-native/lib'
import defaultI18n        from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet  from 'tcomb-form-native/lib/stylesheets/bootstrap'
import transform          from 'tcomb-json-schema'

const {Form} = t.form

Form.i18n       = defaultI18n
Form.stylesheet = defaultStylesheet


// const Type = PropTypes.oneOfType([PropTypes.string, PropTypes.object])


function filterComponentOptions(entry)
{
  // TODO get type properties dynamically relative to each type
  return !['displayName', 'enum', 'format', 'integer', 'is', 'meta', 'pattern', 'type'].includes(entry[0])
}


function getOptions({factory, items, properties = {}, ...componentOptions}, options = {}, factories = {})
{
  Object.defineProperty(options, 'form', {get: () => this})

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
    const result = getOptions.call(this, items, options.item, factories)
    if(result)
      options.item = result
  }

  // object properties
  let {fields} = options
  for(const name in properties)
  {
    const result = getOptions.call(this, properties[name], fields && fields[name], factories)
    if(result)
      fields = {...fields, [name]: result}
  }
  if(fields) options.fields = fields

  // Component specific options
  Object.entries(componentOptions).filter(filterComponentOptions)
  .forEach(function([key, value])
  {
    options[key] = value
  })

  return options
}

function getPropState({children, factories, formats = {}, options, type, types = {}})
{
  type = type || children || {}

  // string to JSON object
  if(typeof type === 'string') type = JSON.parse(type)

  // Get fields options from JSON object
  options = getOptions.call(this, type, options, factories)

  // Register formats and types
  Object.entries(formats).forEach(entry => transform.registerFormat(...entry))
  Object.entries(types).forEach(entry => transform.registerType(...entry))

  // JSON object to tcomb
  if(!(type instanceof Function)) type = transform(type)

  return {options, type}
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

    this.state = getPropState.call(this._root, props)
  }

  componentWillReceiveProps(props)
  {
    // Remove all the registered formats and types
    transform.resetFormats()
    transform.resetTypes()

    this.setState(getPropState.call(this._root, props))
  }

  render()
  {
    const {context, i18n, onChange, stylesheet, templates, value} = this.props
    const {options, type} = this.state

    return <Form
      context={context}
      i18n={i18n || defaultI18n}
      onChange={onChange}
      options={options}
      ref={component => this._root = component}
      stylesheet={stylesheet || defaultStylesheet}
      templates={templates}
      type={type}
      value={value}
    />
  }
}


// Export `tcomb` types
Builder.t = t


export default Builder
