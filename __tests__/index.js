import {mount}   from 'enzyme'
import React     from 'react'
import {Textbox} from 'tcomb-form-native/lib/components'
import transform from 'tcomb-json-schema'

import Builder from '../src'


const fixture = require('./fixture/1.json')


describe('load definition', function()
{
  it('no definition', function()
  {
    const wrapper = mount(<Builder/>)

    expect(wrapper).toMatchSnapshot()
  })

  describe('JSON string', function()
  {
    const json = JSON.stringify(fixture)

    it('prop', function()
    {
      const wrapper = mount(<Builder type={json}/>)

      expect(wrapper).toMatchSnapshot()
    })

    it('body', function()
    {
      const wrapper = mount(<Builder>{json}</Builder>)

      expect(wrapper).toMatchSnapshot()
    })
  })

  describe('JSON object', function()
  {
    it('prop', function()
    {
      const wrapper = mount(<Builder type={fixture}/>)

      expect(wrapper).toMatchSnapshot()
    })

    it('body', function()
    {
      const wrapper = mount(<Builder>{fixture}</Builder>)

      expect(wrapper).toMatchSnapshot()
    })
  })

  describe('tcomb object', function()
  {
    const tcomb = transform(fixture)

    it('prop', function()
    {
      const wrapper = mount(<Builder type={tcomb}/>)

      expect(wrapper).toMatchSnapshot()
    })

    it('body', function()
    {
      const wrapper = mount(<Builder>{tcomb}</Builder>)

      expect(wrapper).toMatchSnapshot()
    })
  })
})

it('update definition', function()
{
  const wrapper = mount(<Builder type={fixture}/>)

  expect(wrapper).toMatchSnapshot()

  wrapper.setProps({type: require('./fixture/2.json')})

  expect(wrapper).toMatchSnapshot()
})

describe('custom factories', function()
{
  const factories = {customFactory: Textbox}

  test('root element', function()
  {
    const wrapper = mount(
      <Builder type={require('./fixture/3.json')} factories={factories}/>
    )

    expect(wrapper).toMatchSnapshot()
  })

  test('object property', function()
  {
    const wrapper = mount(
      <Builder type={require('./fixture/4.json')} factories={factories}/>
    )

    expect(wrapper).toMatchSnapshot()
  })

  test('unknown factory', function()
  {
    const type = require('./fixture/6.json')

    const wrapper = () => mount(<Builder type={type} factories={factories}/>)

    expect(wrapper).toThrowErrorMatchingSnapshot()
  })

  test('explicit factory', function()
  {
    const type = require('./fixture/1.json')
    type.factory = Textbox

    const wrapper = mount(<Builder type={type}/>)

    expect(wrapper).toMatchSnapshot()
  })
})
