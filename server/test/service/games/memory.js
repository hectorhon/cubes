const uuid = require('uuid')

const MemoryGameService = require('../../../src/service/games/memory')

describe('Memory game service', () => {
  describe('create new game', () => {
    test('should return id of the new game', () => {
      const numPairs = 5
      const newGameId = MemoryGameService.createGame(numPairs)
      const newGame = MemoryGameService._findGameById(newGameId)
      expect(newGame).toBeTruthy()
    })
  })

  describe('setupClient', () => {
    test('should close socket if given an invalid gameId', () => {
      const fakeSocket = {
        close: jest.fn()
      }
      MemoryGameService.setupClient(uuid.v4(), fakeSocket, uuid.v4())
      expect(fakeSocket.close).toBeCalled()
    })

    describe('game event handling', () => {
      let gameId, _game, clientId1, clientId2, fakeSocket1, fakeSocket2

      beforeEach(() => {
        const numPairs = 5
        gameId = MemoryGameService.createGame(numPairs)
        _game = MemoryGameService._findGameById(gameId)

        clientId1 = uuid.v4()
        fakeSocket1 = {
          emit: jest.fn(),
        }
        clientId2 = uuid.v4()
        fakeSocket2 = {
          emit: jest.fn(),
        }
      })

      test('should forward playerJoined event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        const playerId1 = _game.players[0].id
        expect(fakeSocket1.emit).toBeCalledWith('selfJoined', {
          playerId: playerId1,
        })

        fakeSocket1.emit.mockClear()

        MemoryGameService.setupClient(clientId2, fakeSocket2, gameId)
        const playerId2 = _game.players[1].id
        expect(fakeSocket1.emit).toBeCalledWith('playerJoined', {
          playerId: playerId2,
        })
        expect(fakeSocket2.emit).toBeCalledWith('selfJoined', {
          playerId: playerId2,
        })
      })

      test('should forward playerSelectedCard event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        MemoryGameService.setupClient(clientId2, fakeSocket2, gameId)
        const playerId1 = _game.players[0].id
        const cardId = uuid.v4()
        const cardValue = 123
        _game.emit('playerSelectedCard', {
          playerId: playerId1,
          cardId,
          cardValue,
        })
        expect(fakeSocket1.emit).toBeCalledWith('selfSelectedCard', {
          cardId,
          cardValue,
        })
        expect(fakeSocket2.emit).toBeCalledWith('playerSelectedCard', {
          playerId: playerId1,
          cardId,
        })
      })

      test('should forward playerDeselectedCard event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        MemoryGameService.setupClient(clientId2, fakeSocket2, gameId)
        const playerId1 = _game.players[0].id
        const cardId = uuid.v4()
        _game.emit('playerDeselectedCard', {
          playerId: playerId1,
          cardId,
        })
        expect(fakeSocket1.emit).toBeCalledWith('selfDeselectedCard', {
          cardId,
        })
        expect(fakeSocket2.emit).toBeCalledWith('playerDeselectedCard', {
          playerId: playerId1,
          cardId,
        })
      })

      test('should forward playerSelectCardFailed event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        MemoryGameService.setupClient(clientId2, fakeSocket2, gameId)
        const playerId1 = _game.players[0].id
        const cardId = uuid.v4()
        _game.emit('playerSelectCardFailed', {
          playerId: playerId1,
          cardId,
        })
        expect(fakeSocket1.emit).toBeCalledWith('selfSelectCardFailed', {
          cardId,
        })
        expect(fakeSocket2.emit).toBeCalledWith('playerSelectCardFailed', {
          playerId: playerId1,
          cardId,
        })
      })

      test('should forward matchFound event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        MemoryGameService.setupClient(clientId2, fakeSocket2, gameId)
        const playerId1 = _game.players[0].id
        const cardId1 = uuid.v4()
        const cardId2 = uuid.v4()
        const cardValue = 123
        _game.emit('matchFound', {
          playerId: playerId1,
          cardIds: [cardId1, cardId2],
          cardValue,
        })
        expect(fakeSocket1.emit).toBeCalledWith('selfMatchFound', {
          cardIds: [cardId1, cardId2],
          cardValue,
        })
        expect(fakeSocket2.emit).toBeCalledWith('matchFound', {
          playerId: playerId1,
          cardIds: [cardId1, cardId2],
          cardValue,
        })
      })

      test('should forward matchFailed event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        MemoryGameService.setupClient(clientId2, fakeSocket2, gameId)
        const playerId1 = _game.players[0].id
        const cardId1 = uuid.v4()
        const cardId2 = uuid.v4()
        _game.emit('matchFailed', {
          playerId: playerId1,
          cardIds: [cardId1, cardId2],
        })
        expect(fakeSocket1.emit).toBeCalledWith('selfMatchFailed', {
          cardIds: [cardId1, cardId2],
        })
        expect(fakeSocket2.emit).toBeCalledWith('matchFailed', {
          playerId: playerId1,
          cardIds: [cardId1, cardId2],
        })
      })
    })
  })
})
