import React from 'react'
import { useForm } from "react-hook-form"

function RegistrationForm(props) {
  const { onSubmit: submit } = props
  const { register, watch, handleSubmit, errors, getValues, trigger } = useForm()
  const watchMode = watch('mode')

  const onSubmit = data => {
    const { nickname, mode } = data
    switch (mode) {
      case 'create-new-game':
        submit({
          nickname,
          mode: 'create-new-game',
        })
        break
      case 'join-existing-game':
        submit({
          nickname,
          mode: 'join-existing-game',
          gameId: data['existing-gameid'],
        })
        break
      default:
        throw new Error(`Unexpected value for mode: ${mode}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="nickname-input">Nickname</label>
        <input id="nickname-input"
               name="nickname"
               autoComplete="off"
               ref={register({
                 required: true,
               })} />
        {errors.nickname
         && errors.nickname.type === 'required'
         && <span>Please enter a nickname.</span>}
      </div>
      <div>
        <input id="create-new-game-radio"
               type="radio"
               name="mode"
               value="create-new-game"
               defaultChecked="checked"
               onChange={() => {
                 if (errors['existing-gameid']
                     && errors['existing-gameid'].type === 'required') {
                   trigger('existing-gameid')
                 }
               }}
               ref={register({
                 required: true
               })} />
        <label htmlFor="create-new-game-radio">Create new game</label>
      </div>
      <div>
        <input id="join-existing-game-radio"
               type="radio"
               name="mode"
               value="join-existing-game"
               ref={register({
                 required: true
               })} />
        <label htmlFor="join-existing-game-radio">Join existing game</label>
        <input name="existing-gameid"
               placeholder="Enter a game ID"
               autoComplete="off"
               disabled={watchMode !== 'join-existing-game'}
               ref={register({
                 validate: {
                   required: value => {
                     const createOrJoinGame = getValues('mode')
                     if (createOrJoinGame === 'join-existing-game') {
                       return !!value
                     } else {
                       return true
                     }
                   }
                 }
               })} />
        {errors['existing-gameid']
         && errors['existing-gameid'].type === 'required'
         && <span>Please enter a game ID.</span>}
      </div>
      <input type="submit" value="Continue" />
    </form>
  )
}

export default RegistrationForm
