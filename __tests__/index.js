import { mount } from 'enzyme'
import { set } from 'object-path'
import React     from 'react'
import { Textbox } from 'tcomb-form-native/lib/components'
import transform from 'tcomb-json-schema'
import templates from 'tcomb-form-native/lib/templates/bootstrap'

import Builder from '..'


const fixture = require('./fixture/1.json')


describe('load definition', () => {
  test('no definition', () => {
    const wrapper = mount(<Builder templates={templates} />)

    expect(wrapper).toMatchSnapshot()
  })

  describe('JSON string', () => {
    const json = JSON.stringify(fixture)

    test('prop', () => {
      const wrapper = mount(<Builder templates={templates} type={json} />)

      expect(wrapper).toMatchSnapshot()
    })

    test('body', () => {
      const wrapper = mount(<Builder templates={templates}>{json}</Builder>)

      expect(wrapper).toMatchSnapshot()
    })
  })

  describe('JSON object', () => {
    test('prop', () => {
      const wrapper = mount(<Builder templates={templates} type={fixture} />)

      expect(wrapper).toMatchSnapshot()
    })

    test('body', () => {
      const wrapper = mount(<Builder templates={templates}>{fixture}</Builder>)

      expect(wrapper).toMatchSnapshot()
    })
  })

  describe('tcomb object', () => {
    const tcomb = transform(fixture)

    test('prop', () => {
      const wrapper = mount(<Builder templates={templates} type={tcomb} />)

      expect(wrapper).toMatchSnapshot()
    })

    test('body', () => {
      const wrapper = mount(<Builder templates={templates}>{tcomb}</Builder>)

      expect(wrapper).toMatchSnapshot()
    })
  })
})

test('update definition', () => {
  const wrapper = mount(<Builder templates={templates} type={fixture} />)

  expect(wrapper).toMatchSnapshot()

  wrapper.setProps({ type: require('./fixture/2.json') })

  expect(wrapper).toMatchSnapshot()
})

describe('custom factories', () => {
  const factories = { customFactory: Textbox }

  test('root element', () => {
    const wrapper = mount(<Builder
      templates={templates}
      type={require('./fixture/3.json')}
      factories={factories}
    />)

    expect(wrapper).toMatchSnapshot()
  })

  test('object property', () => {
    const wrapper = mount(<Builder
      templates={templates}
      type={require('./fixture/4.json')}
      factories={factories}
    />)

    expect(wrapper).toMatchSnapshot()
  })

  test('array item', () => {
    const wrapper = mount(<Builder
      templates={templates}
      type={require('./fixture/5.json')}
      factories={factories}
    />)

    expect(wrapper).toMatchSnapshot()

    // Add an item in the list
    wrapper.find('TouchableHighlight').props().onPress()

    expect(wrapper).toMatchSnapshot()
  })

  test('unknown factory', () => {
    const type = require('./fixture/6.json')

    function wrapper() {
      mount(<Builder type={type} templates={templates} factories={factories} />)
    }

    expect(wrapper).toThrowErrorMatchingSnapshot()
  })

  test('explicit factory', () => {
    const type = require('./fixture/1.json')
    type.factory = Textbox

    const wrapper = mount(<Builder templates={templates} type={type} />)

    expect(wrapper).toMatchSnapshot()
  })
})

describe('predefined options', () => {
  const factories = { customFactory: Textbox }

  test('object property', () => {
    const options = { fields: {} }
    const type = require('./fixture/8.json')

    const wrapper = mount(<Builder
      templates={templates}
      factories={factories}
      options={options}
      type={type}
    />)

    expect(wrapper).toMatchSnapshot()
  })

  test('array item', () => {
    const options = {}
    const type = require('./fixture/7.json')

    const wrapper = mount(<Builder
      templates={templates}
      factories={factories}
      options={options}
      type={type}
    />)

    expect(wrapper).toMatchSnapshot()
  })
})

test('component options', () => {
  const tcombFormComponent = jest.fn(() => null)

  const customType = Builder.t.subtype(Builder.t.Str, s => s, 'customType')
  customType.getTcombFormFactory = jest.fn(() => tcombFormComponent)

  const types = { customType }
  const type = require('./fixture/9.json')

  const wrapper = mount(<Builder
    templates={templates}
    type={type}
    types={types}
  />)

  expect(wrapper).toMatchSnapshot()

  expect(tcombFormComponent.mock.calls.length).toBe(1)
  expect(tcombFormComponent.mock.calls[0][0]).toMatchObject({ options: { componentOption: 'blah' } })
})

test('disable `submit` button if form is not valid', () => {
  const onSubmit = jest.fn()
  set(onSubmit, 'meta.type.meta.name', 'submit')

  const tcombFormComponent = jest.fn(() => null)

  const submit = Builder.t.subtype(Builder.t.Nil, s => s, 'submit')
  submit.getTcombFormFactory = jest.fn(() => tcombFormComponent)

  const types = { submit }
  const type = require('./fixture/10.json')

  const wrapper = mount(<Builder
    onSubmit={onSubmit}
    templates={templates}
    type={type}
    types={types}
  />)

  expect(wrapper).toMatchSnapshot()
})

describe('clean labels', () => {
  test("don't show 'optional' suffix on root `submit` button", () => {
    const onSubmit = jest.fn()
    set(onSubmit, 'meta.type.meta.name', 'submit')

    const tcombFormComponent = jest.fn(() => null)

    const submit = Builder.t.subtype(Builder.t.Nil, s => s, 'submit')
    submit.getTcombFormFactory = jest.fn(() => tcombFormComponent)

    const types = { submit }
    const type = require('./fixture/10.json')

    const wrapper = mount(<Builder
      onSubmit={onSubmit}
      templates={templates}
      type={type}
      types={types}
    />)

    expect(wrapper).toMatchSnapshot()
  })

  test("don't show 'optional' suffix on nested `submit` button", () => {
    const onSubmit = jest.fn()
    set(onSubmit, 'meta.type.meta.name', 'submit')

    const tcombFormComponent = jest.fn(() => null)

    const submit = Builder.t.subtype(Builder.t.Nil, s => s, 'submit')
    submit.getTcombFormFactory = jest.fn(() => tcombFormComponent)

    const types = { submit }
    const type = require('./fixture/11.json')

    const wrapper = mount(<Builder
      onSubmit={onSubmit}
      templates={templates}
      type={type}
      types={types}
    />)

    expect(wrapper).toMatchSnapshot()
  })

  test.skip('tuple', () => {
    const type = require('./fixture/12.json')

    const wrapper = mount(<Builder
      templates={templates}
      type={type}
    />)

    expect(wrapper).toMatchSnapshot()
  })
})
