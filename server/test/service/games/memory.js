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
          on: jest.fn(),
        }
        clientId2 = uuid.v4()
        fakeSocket2 = {
          emit: jest.fn(),
          on: jest.fn(),
        }
      })

      test('should call game.addPlayer', () => {
        const gameAddPlayer = jest.spyOn(_game, 'addPlayer')
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        expect(gameAddPlayer).toHaveBeenCalledTimes(1)
        expect(gameAddPlayer).toBeCalledWith(clientId1)
        gameAddPlayer.mockRestore()
      })

      test('should forward playerJoined event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        const playerId1 = _game.players[0].id
        expect(fakeSocket1.emit.mock.calls[0][0]).toEqual('selfJoined')
        expect(fakeSocket1.emit.mock.calls[0][1]).toHaveProperty('playerId', playerId1)
        expect(fakeSocket1.emit.mock.calls[0][1]).toHaveProperty('gameState')

        fakeSocket1.emit.mockClear()

        MemoryGameService.setupClient(clientId2, fakeSocket2, gameId)
        const playerId2 = _game.players[1].id
        expect(fakeSocket1.emit.mock.calls[0][0]).toEqual('playerJoined')
        expect(fakeSocket1.emit.mock.calls[0][1]).toHaveProperty('playerId', playerId2)
        expect(fakeSocket2.emit.mock.calls[0][0]).toEqual('selfJoined')
        expect(fakeSocket2.emit.mock.calls[0][1]).toHaveProperty('playerId', playerId2)
        expect(fakeSocket2.emit.mock.calls[0][1]).toHaveProperty('gameState')
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

      test.todo('should forward selectionClearedAfterMatchFound event')

      test.todo('should forward selectionClearedAfterMatchFailed event')
    })

    describe('client event handling', () => {
      let gameId, _game, clientId1, fakeSocket1, playerId1, gameClickCard

      beforeEach(() => {
        const numPairs = 5
        gameId = MemoryGameService.createGame(numPairs)
        _game = MemoryGameService._findGameById(gameId)
        gameClickCard = jest.spyOn(_game, 'clickCard')

        clientId1 = uuid.v4()
        const fakeSocket1Handlers = {}
        fakeSocket1 = {
          emit: jest.fn().mockImplementation((eventName, ...args) => {
            if (!fakeSocket1Handlers[eventName]) {
              return
            }
            fakeSocket1Handlers[eventName].forEach(handler => {
              handler(...args)
            })
          }),
          on: jest.fn().mockImplementation((eventName, handler) => {
            if (!fakeSocket1Handlers[eventName]) {
              fakeSocket1Handlers[eventName] = [handler]
            } else {
              fakeSocket1Handlers[eventName].push(handler)
            }
          }),
        }
        fakeSocket1.on('selfJoined', ({ playerId }) => {
          playerId1 = playerId
        })
      })

      it('should forward card click event', () => {
        MemoryGameService.setupClient(clientId1, fakeSocket1, gameId)
        fakeSocket1.emit('cardClick', _game.cards[0].id)
        expect(gameClickCard).toHaveBeenCalledWith(playerId1, _game.cards[0].id)
      })
    })
  })
})
