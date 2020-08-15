const Game = require('../../games/memory')

const logger = require('../../logger').child({ module: 'games/memory' })

const games = []

function createGame(numPairs) {
  const game = new Game(numPairs)
  games.push(game)
  return game.id
}

function _findGameById(gameId) {
  return games.find(game => game.id === gameId)
}

const clientIdToPlayerIdMapping = {}

function getPlayerIdForClient(clientId) {
  return clientIdToPlayerIdMapping[clientId]
}

function savePlayerIdForClientId(clientId, playerId) {
  clientIdToPlayerIdMapping[clientId] = playerId
}

// clientId is secret, do not share with other clients
function setupClient(clientId, socket, gameId) {
  logger.info({ clientId, socketId: socket.id, gameId }, 'Setting up memory game client')

  const game = games.find(game => game.id === gameId)
  if (!game) {
    logger.info({ gameId }, 'Invalid gameId, closing socket')
    socket.close()
    return
  }

  socket.on('cardClick', cardId => {
    logger.info({ clientId, playerId, gameId, cardId }, 'Card click event')
    const thisPlayerId = getPlayerIdForClient(clientId)
    game.clickCard(thisPlayerId, cardId)
  })

  function socketEmit(eventName, ...args) {
    logger.trace({
      socketId: socket.id,
      eventName, args: [...args],
    }, 'Socket emit event')
    socket.emit(eventName, ...args)
  }

  game.on('playerJoined', ({ clientId: clientId_, playerId }) => {
    if (clientId_ === clientId) {
      const gameState = game.getStateForPlayer(playerId)
      socketEmit('selfJoined', {
        playerId,
        gameState,
      })
    } else {
      socketEmit('playerJoined', {
        playerId,
      })
    }
  })

  game.on('playerSelectedCard', ({ playerId, cardId, cardValue }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socketEmit('selfSelectedCard', {
        cardId,
        cardValue,
      })
    } else {
      socketEmit('playerSelectedCard', {
        playerId,
        cardId,
      })
    }
  })

  game.on('playerDeselectedCard', ({ playerId, cardId }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socketEmit('selfDeselectedCard', {
        cardId,
      })
    } else {
      socketEmit('playerDeselectedCard', {
        playerId,
        cardId,
      })
    }
  })

  game.on('playerSelectCardFailed', ({ playerId, cardId }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socketEmit('selfSelectCardFailed', {
        cardId,
      })
    } else {
      socketEmit('playerSelectCardFailed', {
        playerId,
        cardId,
      })
    }
  })

  game.on('matchFound', ({ playerId, cardIds, cardValue }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socketEmit('selfMatchFound', {
        cardIds,
        cardValue,
      })
    } else {
      socketEmit('matchFound', {
        playerId,
        cardIds,
        cardValue,
      })
    }
  })

  game.on('matchFailed', ({ playerId, cardIds }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socketEmit('selfMatchFailed', {
        cardIds,
      })
    } else {
      socketEmit('matchFailed', {
        playerId,
        cardIds,
      })
    }
  })

  game.on('selectionClearedAfterMatchFound', ({ playerId, cardIds }) => {
    socketEmit('selectionClearedAfterMatchFound', {
      playerId,
      cardIds,
    })
  })

  game.on('selectionClearedAfterMatchFailed', ({ playerId, cardIds }) => {
    socketEmit('selectionClearedAfterMatchFailed', {
      playerId,
      cardIds,
    })
  })

  const playerId = game.addPlayer(clientId)
  savePlayerIdForClientId(clientId, playerId)
}

module.exports = {
  createGame,
  setupClient,
  _findGameById
}
