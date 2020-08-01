const Game = require('../../games/memory')

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
  const game = games.find(game => game.id === gameId)
  if (!game) {
    socket.close()
    return
  }

  game.on('playerJoined', ({ clientId: clientId_, playerId }) => {
    if (clientId_ === clientId) {
      socket.emit('selfJoined', {
        playerId
      })
    } else {
      socket.emit('playerJoined', {
        playerId,
      })
    }
  })

  game.on('playerSelectedCard', ({ playerId, cardId, cardValue }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socket.emit('selfSelectedCard', {
        cardId,
        cardValue,
      })
    } else {
      socket.emit('playerSelectedCard', {
        playerId,
        cardId,
      })
    }
  })

  game.on('playerDeselectedCard', ({ playerId, cardId }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socket.emit('selfDeselectedCard', {
        cardId,
      })
    } else {
      socket.emit('playerDeselectedCard', {
        playerId,
        cardId,
      })
    }
  })

  game.on('playerSelectCardFailed', ({ playerId, cardId }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socket.emit('selfSelectCardFailed', {
        cardId,
      })
    } else {
      socket.emit('playerSelectCardFailed', {
        playerId,
        cardId,
      })
    }
  })

  game.on('matchFound', ({ playerId, cardIds, cardValue }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socket.emit('selfMatchFound', {
        cardIds,
        cardValue,
      })
    } else {
      socket.emit('matchFound', {
        playerId,
        cardIds,
        cardValue,
      })
    }
  })


  game.on('matchFailed', ({ playerId, cardIds }) => {
    const thisPlayerId = getPlayerIdForClient(clientId)
    if (playerId === thisPlayerId) {
      socket.emit('selfMatchFailed', {
        cardIds,
      })
    } else {
      socket.emit('matchFailed', {
        playerId,
        cardIds,
      })
    }
  })

  const playerId = game.addPlayer(clientId)
  savePlayerIdForClientId(clientId, playerId)
}

module.exports = {
  createGame,
  setupClient,
  _findGameById
}
