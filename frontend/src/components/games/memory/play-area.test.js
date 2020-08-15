import React from 'react'
import { render } from '@testing-library/react'

import PlayArea from './play-area'
import io from 'socket.io-client'

jest.mock('socket.io-client')

describe('play area component', () => {
  const handlers = {}
  const fakeSocket = {
    disconnect: jest.fn(),
    on: (eventName, handler) => {
      if (!handlers[eventName]) {
        handlers[eventName] = [handler]
      } else {
        handlers[eventName].push(handler)
      }
    },
    emit: (eventName, ...args) => {
      handlers[eventName].forEach(handler => handler(...args))
    },
  }

  let playArea

  beforeAll(() => {
    io.mockImplementation(() => fakeSocket)
    const nickname = 'james'
    const gameId = '123'
    playArea = render(<PlayArea nickname={nickname} gameId={gameId} />)
  })

  it('should connect websocket', () => {
    expect(io).toHaveBeenCalledTimes(1)
  })

  it('should disconnect websocket on unmount', () => {
    playArea.unmount()
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1)
  })

  describe('event handling', () => {
    it.todo('selfJoined')
    it.todo('playerJoined')
    it.todo('selfSelectedCard')
    it.todo('playerSelectedCard')
    it.todo('selfDeselectedCard')
    it.todo('playerDeselectedCard')
    it.todo('selfSelectCardFailed')
    it.todo('playerSelectCardFailed')
    it.todo('selfMatchFound')
    it.todo('matchFound')
    
    describe('selfMatchFailed', () => {
      it.todo('should show some animation')
    })
    
    it.todo('matchFailed')
    it.todo('selectionCleared')
    it.todo('should send cardClick event when player click on a card')
  })
})
