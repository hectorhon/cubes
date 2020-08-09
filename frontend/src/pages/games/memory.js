import React, { useState } from 'react'

import RegistrationForm from '../../components/games/memory/registration-form'
import PlayArea from '../../components/games/memory/play-area'

const States = {
  INITIAL: 0,
  FORM_SUBMITTED: 1,
  CREATING_GAME: 2,
  READY_TO_CONNECT: 3,
}

function MemoryGamePage() {
  const [state, setState] = useState(States.INITIAL)
  const [nickname, setNickname] = useState()
  const [gameId, setGameId] = useState()

  async function handleSubmit({ nickname, mode, gameId }) {
    setState(States.FORM_SUBMITTED)
    setNickname(nickname)
    if (mode === 'create-new-game') {
      setState(States.CREATING_GAME)
      const response = await fetch('/games/memory/create', {
        method: 'POST',
        mode: 'cors',
        // headers: {
        //   'Content-Type': 'application/json',
        // },
        // body: JSON.stringify({}),
      })
      const { gameId } = await response.json()
      setGameId(gameId)
    } else if (mode === 'join-existing-game') {
      setGameId(gameId)
    }
    setState(States.READY_TO_CONNECT)
  }

  return (
    <div>
      <h1>Memory game</h1>

      {state === States.INITIAL &&
       <RegistrationForm onSubmit={async data => await handleSubmit(data)} />}

      {state === States.CREATING_GAME &&
       <p>Creating a new game...</p>}

      {state === States.READY_TO_CONNECT &&
       <PlayArea nickname={nickname} gameId={gameId} />}
    </div>
  )
}

export default MemoryGamePage
