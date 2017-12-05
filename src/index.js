import React, {Component} from 'react'
import t                  from 'tcomb-form-native'
import transform          from 'tcomb-json-schema'

const {Form} = t.form


function getPropState(type, children)
{
  type = type || children || {}

  // JSON string
  if(typeof type === 'string') type = JSON.parse(type)

  // JSON object
  if(!(type instanceof Function)) type = transform(type)

  return {type}
}


export default class Builder extends Component
{
  constructor({type, children})
  {
    super()

    this.state = getPropState(type, children)
  }

  componentWillReceiveProps({type, children})
  {
    this.setState(getPropState(type, children))
  }

  render()
  {
    const {options, type} = this.state

    return <Form options={options} type={type}/>
  }
}
