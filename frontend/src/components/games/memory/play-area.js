import React, { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import uuid from 'uuid'
import update from 'immutability-helper'
import classNames from 'classnames'

import logger from '../../../logger'
import './play-area.css'

function PlayArea(props) {
  const { nickname, gameId } = props
  const clientIdRef = useRef(uuid.v4())
  const socketRef = useRef()
  const playerIdRef = useRef()
  const [gameState, setGameState] = useState()

  function setupEvents(socket) {
    socket.on('selfJoined', ({ playerId, gameState }) => {
      playerIdRef.current = playerId
      setGameState(gameState)
    })

    socket.on('selfSelectedCard', ({ cardId, cardValue }) => {
      setGameState(gameState => {
        const cardIndex = gameState.cards.findIndex(card => card.id === cardId)
        const newGameState = update(gameState, {
          cards: {
            [cardIndex]: {
              value: { $set: cardValue },
              selectedBy: { $set: playerIdRef.current },
            }
          }
        })
        return newGameState
      })
    })

    socket.on('selfMatchFound', ({ cardIds, cardValue }) => {
      setGameState(gameState => {
        let newGameState = gameState
        cardIds.forEach(cardId => {
          const cardIndex = gameState.cards.findIndex(card => card.id === cardId)
          newGameState = update(newGameState, {
            cards: {
              [cardIndex]: {
                value: { $set: cardValue },
                isMatched: { $set: true },
              }
            }
          })
        })
        return newGameState
      })
    })

    socket.on('selfMatchFailed', ({ cardIds }) => {
      // TODO some animation
    })

    socket.on('selectionClearedAfterMatchFound', ({ playerId, cardIds }) => {
      setGameState(gameState => {
        let newGameState = gameState
        cardIds.forEach(cardId => {
          const cardIndex = gameState.cards.findIndex(card => card.id === cardId)
          newGameState = update(newGameState, {
            cards: {
              [cardIndex]: {
                $unset: ['selectedBy'],
              }
            }
          })
        })
        return newGameState
      })
    })

    socket.on('selectionClearedAfterMatchFailed', ({ playerId, cardIds }) => {
      setGameState(gameState => {
        let newGameState = gameState
        cardIds.forEach(cardId => {
          const cardIndex = gameState.cards.findIndex(card => card.id === cardId)
          newGameState = update(newGameState, {
            cards: {
              [cardIndex]: {
                $unset: ['value', 'selectedBy'],
              }
            }
          })
        })
        return newGameState
      })
    })

    socket.on('selfDeselectedCard', ({ cardId }) => {
      setGameState(gameState => {
        const cardIndex = gameState.cards.findIndex(card => card.id === cardId)
        let newGameState = update(gameState, {
          cards: {
            [cardIndex]: {
              $unset: ['value', 'selectedBy'],
            }
          }
        })
        return newGameState
      })
    })
  }

  useEffect(() => {
    const websocketUrl = '/games/memory'
    logger.info('Connecting websocket...')
    const socket = io(websocketUrl, {
      reconnection: false,
      query: {
        clientId: clientIdRef.current,
        nickname,
        gameId,
      }
    })
    socketRef.current = socket
    socket.on('connect', () => {
      logger.info('Connected to websocket.')
    })
    socket.on('disconnect', reason => {
      logger.info({ reason }, 'Disconnected from websocket.')
    })

    setupEvents(socket)

    return (() => {
      logger.info('Disconnecting from websocket.')
      socketRef.current.disconnect()
    })
  }, [gameId, nickname])

  function handleCardClick(cardId) {
    const socket = socketRef.current
    socket.emit('cardClick', cardId)
  }

  if (!playerIdRef.current || !gameState) {
    return (
      <p>Connecting...</p>
    )
  } else {
    return (
      <div className="memory-game-play-area-div">
        <div className="memory-game-play-area-cards-div">
          {gameState.cards.map(card => {
            const cardClass = classNames({
              'memory-game-card': true,
              'memory-game-card-self-selected': card.selectedBy === playerIdRef.current,
              'memory-game-card-matched': card.isMatched,
            })
            return (
              <div key={card.id}
                   className={cardClass}
                   onClick={() => handleCardClick(card.id)}>
                {card.value}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default PlayArea
