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
  let filterList = []

  // if field has dependencies do not remove meta information
  if (entry[1] && entry[1].dependencies)
  {
    filterList = ['displayName', 'enum', 'format', 'integer', 'is', 'pattern', 'type', 'remote']
  }
  else
  {
    filterList = ['displayName', 'enum', 'format', 'integer', 'is', 'meta', 'pattern', 'type', 'remote']
  }

  return !filterList.includes(entry[0])
}

function reduceProperties(required = [], [name, {type}])
{
  if(TYPES_ALWAYS_REQUIRED.includes(type) && required.indexOf(name) < 0)
    required.push(name)

  return required
}

// get all valid options where options are all modifiers of a component including tcomb and tcomb-native-builder-component valid options
// besides it sets up the required options for tcomb to render components
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

  // if field is an array and has elements it process element options recursevily
  if(items)
  {
    const editable = !(componentOptions.editable === false)
    const result = getOptions(items, options.item, factories)
    Object.entries(items.properties).forEach(property =>
    {
      property[1].editable = editable
    })
    if(result)
    {
      result.editable = editable
      options.item = result
    }
  }

  // if field is a object and has subfields it process children options recursevily
  let {fields} = options
  for(const [name, property] of Object.entries(properties))
  {
    const result = getOptions(property, fields && fields[name], factories)
    if(result)
      fields = {...fields, [name]: result}
  }
  if(fields) options.fields = fields

  // pass meta if the field is submit or if field has any dependency
  if(componentOptions.type === 'submit')
  {
    options.meta = componentOptions.meta
    options.remote = componentOptions.remote
  }
  else if(componentOptions.meta && componentOptions.meta.dependencies)
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
  if(items && value)
  {
    value.forEach(item =>
    {
      Object.entries(item).forEach(([k, v]) =>
      {
        const date = new Date(Date.parse(v))
        if (!isNaN(date) && date.toISOString() === String(v))
        {
          item[k] = date.toLocaleDateString()
        }
      })
    })

    return value
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
