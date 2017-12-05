import {mount}   from 'enzyme'
import React     from 'react'

import Builder from '../src'


describe('load definition', function()
{
  it('no definition', function()
  {
    const wrapper = mount(<Builder/>)

    expect(wrapper).toMatchSnapshot()
  })
})
