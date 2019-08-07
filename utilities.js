import objectPath, { set }  from 'object-path'
import t                    from 'tcomb-form-native/lib'
import defaultI18n          from 'tcomb-form-native/lib/i18n/en'
import defaultStylesheet    from 'tcomb-form-native/lib/stylesheets/bootstrap'
import walkObject           from '@foqum/walk-object'


const { Form } = t.form

Form.i18n = defaultI18n
Form.stylesheet = defaultStylesheet


// const Type = PropTypes.oneOfType([PropTypes.string, PropTypes.object])

const TYPES_ALWAYS_REQUIRED = ['image', 'submit']

function filterComponentOptions(entry) {
  let filterList = []

  // if field has dependencies do not remove meta information
  if (entry[1] && entry[1].dependencies) {
    filterList = ['displayName', 'enum', 'format', 'integer', 'is', 'pattern', 'type', 'remote']
  } else {
    filterList = ['displayName', 'enum', 'format', 'integer', 'is', 'meta', 'pattern', 'type', 'remote']
  }

  return !filterList.includes(entry[0])
}

function reduceProperties(required = [], [name, { type }]) {
  if (TYPES_ALWAYS_REQUIRED.includes(type) && required.indexOf(name) < 0) {
    required.push(name)
  }

  return required
}

// get all valid options where options are all modifiers of a component including tcomb and tcomb-native-builder-component valid options
// besides it sets up the required options for tcomb to render components
export function getOptions({ factory, items, properties = {}, ...componentOptions }, options = {}, factories = {}, onChangeWidgetProperty) {
  if (factory) {
    if (typeof factory === 'string') {
      const factoryName = factory
      factory = factories[factoryName]
      if (!factory) {
        throw new ReferenceError(`Factory '${factoryName}' not registered`)
      }
    }
    options.factory = factory
  }

  // if field is an array and has elements it process element options recursevily
  if (items) {
    const editable = !(componentOptions.editable === false)
    const result = getOptions(items, options.item, factories)
    Object.entries(items.properties).forEach((property) => {
      property[1].editable = property[1].editable == null ? editable : property[1].editable
    })
    if (result) {
      result.editable = editable
      options.item = result
    }
  }

  // if field is a object and has subfields it process children options recursevily
  let { fields } = options
  Object.entries(properties).forEach(([name, property]) => {
    const result = getOptions(property, fields && fields[name], factories, onChangeWidgetProperty)
    if (result) fields = { ...fields, [name]: result }
  })
  if (fields) options.fields = fields

  // pass meta and remote if the field is submit or if field has any dependency
  if (componentOptions.type === 'submit') {
    options.meta = componentOptions.meta
    options.remote = componentOptions.remote
  } else if (componentOptions.meta && componentOptions.meta.dependencies) {
    options.meta = componentOptions.meta
  }

  // switch actions (WIP)
  if (componentOptions.type === 'actionSwitch') {
    componentOptions.onPress = onChangeWidgetProperty
  }

  // Component specific options
  // be aware of filterComponentOptions call where all invalid options are filtered
  Object.entries(componentOptions)
    .filter(filterComponentOptions)
    .forEach(([key, value]) => {
      options[key] = value
    })

  return options
}

export function getValue({ items, properties = {}, value }) {
  // array items
  if (items) {
    return value
  }

  // object properties
  Object.entries(properties).forEach(([name, property]) => {
    const result = getValue(property)
    if (value === undefined) value = {}

    value[name] = result
  })

  return value
}

// Don't show 'optional' or 'required' suffix on `image` and `submit` components
export function cleanLabels(type) {
  switch (type.type) {
    case 'array': {
      const { items } = type

      // Tuples support, not implemented in `tcomb-form` yet
      // https://github.com/gcanti/tcomb-form/issues/410
      // if(Array.isArray(items))
      //   type.items = items.map(cleanLabels)
      // else
      type.items = cleanLabels(items)
    }
      break

    case 'object': {
      const { properties } = type
      const entries = Object.entries(properties)

      entries.forEach(cleanPropertiesLabels, properties)

      const required = entries.reduce(reduceProperties, type.required)
      if (required.length) type.required = required
    }
      break
    default:
      break
  }

  return type
}

function cleanPropertiesLabels([name, property]) {
  this[name] = cleanLabels(property)
}

export function objectArray2Object(objectArray, fieldId, fieldLabel, omitNullVal = false) {
  // transform: [{'id': '0', 'label': 'a'}, {'id': '1', 'label': 'b'}]
  // into     : {'0': 'a', '1': 'b'}
  const result = {}
  objectArray.forEach((item) => {
    item = objectPath(item)

    const id = item.get(fieldId)
    const label = item.get(fieldLabel)

    if (omitNullVal) {
      if (id !== null && label !== null) result[id] = label
    } else {
      if (id == null) throw new Error('`id` is null or undefined')
      if (label == null) throw new Error('`label` is null or undefined')
      result[id] = label
    }
  })
  return result
}

export function objectEquals(a, b) {
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  if (aKeys.length !== bKeys.length) {
    return false
  }
  for (let i = 0; i < aKeys.length; i += 1) {
    if (a[aKeys[i]] !== b[bKeys[i]]) {
      // return true when comparing empty object with undefined
      if ((JSON.stringify(a[aKeys[i]]) === '{}' || a[aKeys[i]] === undefined) && (JSON.stringify(b[bKeys[i]]) === '{}' || b[bKeys[i]] === undefined)) {
        return true
      }
      return false
    }
  }
  return true
}

export function jsonToTcombObjectAndUpdate(jsonObject, value, options, factories, transform, onChangeWidgetProperty) {
  // Transform the form (type) from JSON object to tcomb and updates the form if any value has changed
  const newFormValue = value

  // get valid options from the json
  options = getOptions(jsonObject, options, factories, onChangeWidgetProperty)

  // update value (the original form empty) with prop values (the new form with all the changes)
  // getValue return the form in the original state (without values)
  let oldFormValue = getValue(jsonObject) // eslint-disable-line

  // use walkobject to update oldFormValue to the new state
  walkObject(newFormValue, ({ isLeaf, location, value: newFormValue }) => {
    if (isLeaf) set(oldFormValue, location, newFormValue)
  })

  // add fields if required
  const tcombObject = transform(cleanLabels(jsonObject))

  return [tcombObject, options, oldFormValue]
}
