import t                  from 'tcomb-form-native/lib'
import defaultI18n        from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet  from 'tcomb-form-native/lib/stylesheets/bootstrap'


const {Form} = t.form

Form.i18n       = defaultI18n
Form.stylesheet = defaultStylesheet


// const Type = PropTypes.oneOfType([PropTypes.string, PropTypes.object])

const TYPES_ALWAYS_REQUIRED = ['image', 'submit']

export function filterComponentOptions(entry)
{
  // TODO get type properties dynamically relative to each type
  return !['displayName', 'enum', 'format', 'integer', 'is', 'meta', 'pattern', 'type'].includes(entry[0])
}

function reduceProperties(required = [], [name, {type}])
{
  if(TYPES_ALWAYS_REQUIRED.includes(type))
    required.push(name)

  return required
}


export function getOptions({factory, items, properties = {}, ...componentOptions}, options = {}, factories = {})
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

  if(componentOptions.type === 'submit')
  {
    options.meta = componentOptions.meta
  }

  // Component specific options
  Object.entries(componentOptions).filter(filterComponentOptions)
  .forEach(function([key, value])
  {
    options[key] = value
  })

  return options
}

export function getValue({items, properties = {}, value})
{
  // array items
  if(items)
  {
    const result = getValue(items)
    if(result !== undefined) // eslint-disable-line
      value = [result]
  }

  // object properties
  for(const [name, property] of Object.entries(properties))
  {
    const result = getValue(property)
    if(value === undefined) value = {} // eslint-disable-line

    value[name] = result
  }

  return value
}

// Don't show 'optional' or 'required' suffix on `image` and `submit` components
export function cleanLabels(type)
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
    default:
    break
  }

  return type
}

function cleanPropertiesLabels([name, property])
{
  this[name] = cleanLabels(property)
}
