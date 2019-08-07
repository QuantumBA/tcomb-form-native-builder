import React, { Component } from 'react'

import styled               from 'styled-components/native'

import { Card }             from 'react-native-material-ui'

const Wrapper = styled.View`
  position: ${props => (props.position ? props.position : 'fixed')};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background-color: rgba(73,80,87,0.6);
  justify-content: center;
  align-items: center;
`

// const ModalContainer = styled(CardSmall)`
//   align-items: center;
//   justify-content: space-between;
//   width: 300px;
//   height: 240px;
//   background-color: rgba(255,255,255,1.0);
//   overflow: hidden;
// `

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
`
const Title = styled.Text`
  font-size: 1.5rem;
  color: red;
  text-align: center;
  margin-bottom: 10px;
  font-weight: bold;
`
const Message = styled.Text`
  font-size: 1rem;
  color: #424751;
  text-align: center;
  width: 280px;
  margin-bottom: 5px;
`

const ActionButton = styled.Button`
`
const CommentContainer = styled.View`
  padding-vertical: 5px;
  margin-bottom: 5px
`
const Comment = styled.TextInput`
  border-bottom-width: 1px;
  height: 40px;
`

export default class Modal extends Component {

  constructor(props) {
    const { setModalFunction } = props
    super(props)
    this.state = {
      isVisible: false,
      success: false,
      leftBtnText: 'CANCEL',
      message: 'Submit this form?',
      position: 'absolute',
      rightBtnText: 'CONFIRM',
      title: 'CONFIRM ACTION',
    }
    /*
      Allow parent component to change the visibility state of the Modal
      by passing the callback prop "setModalFunction"
    */
    setModalFunction(this.showModal)
  }

  showModal = (action) => {
    /*
      A callback is passed to showModal from submit.js (builder-components),
      defining the action to be performed when the user accepts/confirms the modal message.
      By default, the right button will call this callback if pressed.
    */
    this.setState({ isVisible: true, action })
  }

  render() {
    const {
      action,
      buttonLabel,
      comment,
      children,
      isVisible,
      leftBtnText,
      message,
      position,
      rightBtnText,
      title,
    } = this.state

    const { buttonColor } = this.props

    if (isVisible) {
      return (
        <Wrapper position={position}>
          <Card style={{ container: { padding: 20 } }}>
            <Title>{title}</Title>
            <Message>{message}</Message>
            <CommentContainer>
              <Comment
                value={comment}
                onChangeText={comment => this.setState({ comment })}
                multiline
              />
            </CommentContainer>
            { children }
            <ButtonsContainer>
              <ActionButton
                textStyles={buttonLabel}
                onPress={() => this.setState({ isVisible: false })}
                title={leftBtnText}
                color={buttonColor}
              />
              <ActionButton
                textStyles={buttonLabel}
                onPress={() => action(comment)}
                title={rightBtnText}
                color={buttonColor}
              />
            </ButtonsContainer>
          </Card>
        </Wrapper>
      )
    }
    return null
  }

}
