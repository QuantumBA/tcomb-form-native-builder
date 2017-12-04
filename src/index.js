import React, {Component} from 'react'
import t                  from 'tcomb-form-native'
import transform          from 'tcomb-json-schema'

const {Form} = t.form


function getPropState(type = {})
{
  // JSON string
  if(typeof type === 'string') type = JSON.parse(type)

  // JSON object
  if(!(type instanceof Function)) type = transform(type)

  return {type}
}


export default class Builder extends Component
{
  constructor({json})
  {
    super()

    this.state = getPropState(json)
  }

  componentWillReceiveProps({json})
  {
    this.setState(getPropState(json))
  }

  render()
  {
    const {options, type} = this.state

    return <Form options={options} type={type}/>
  }
}
