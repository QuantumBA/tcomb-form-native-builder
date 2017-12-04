import React     from 'react'
import {shallow} from 'enzyme'

import Builder from '../src'


describe('load definition', function()
{
  it('no definition', function()
  {
    const wrapper = shallow(<Builder/>)

    expect(wrapper).toMatchSnapshot()
  })
})
