import {mount}   from 'enzyme'
import React     from 'react'
import transform from 'tcomb-json-schema'

import Builder from '../src'


describe('load definition', function()
{
  const fixture = require('./fixture.json')

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
