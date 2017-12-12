import React, {Component} from 'react'
import t                  from 'tcomb-form-native/lib'
import defaultI18n        from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet  from 'tcomb-form-native/lib/stylesheets/bootstrap'
import transform          from 'tcomb-json-schema'

const {Form} = t.form

Form.i18n       = defaultI18n
Form.stylesheet = defaultStylesheet


function getOptions({factory, items, properties = {}}, options, factories = {})
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

    options = options || {}
    options.factory = factory
  }

  // array items
  if(items)
  {
    const result = getOptions(items, options && options.item, factories)
    if(result)
    {
      options = options || {}
      options.item = result
    }
  }

  // object properties
  for(const name in properties)
  {
    const propertyOptions = options && options.fields && options.fields[name]

    const result = getOptions(properties[name], propertyOptions, factories)
    if(result)
    {
      options = options || {}
      options.fields = options.fields || {}
      options.fields[name] = result
    }
  }

  return options
}

function getPropState(type, children, options, factories)
{
  type = type || children || {}

  // string to JSON object
  if(typeof type === 'string') type = JSON.parse(type)

  // Get fields options from JSON object
  options = getOptions(type, options, factories)

  // JSON object to tcomb
  if(!(type instanceof Function)) type = transform(type)

  return {options, type}
}


export default class Builder extends Component
{
  constructor({type, children, options, factories})
  {
    super()

    this.state = getPropState(type, children, options, factories)
  }

  componentWillReceiveProps({type, children, options, factories})
  {
    this.setState(getPropState(type, children, options, factories))
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
      stylesheet={stylesheet || defaultStylesheet}
      templates={templates || require('tcomb-form-native/lib/templates/bootstrap')}
      type={type}
      value={value}
    />
  }
}
