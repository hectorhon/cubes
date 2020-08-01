const uuid = require('uuid')

const Game = require('../../src/games/memory')

describe('Memory game', () => {
  describe('constructor', () => {
    let game
    const numPairs = 5

    beforeAll(() => {
      game = new Game(numPairs)
    })

    test('assign an id', () => {
      expect(game.id).toBeTruthy()
    })

    test('should create correct number of cards', () => {
      expect(game.cards).toHaveLength(numPairs * 2)
    })

    test('should create correct pairs of cards', () => {
      const valuesCount = {}
      game.cards.forEach(card => {
        if (!valuesCount[card.value]) {
          valuesCount[card.value] = 1
        } else {
          valuesCount[card.value] += 1
        }
      })
      expect(Object.keys(valuesCount)).toHaveLength(numPairs)
      for (let value in valuesCount) {
        expect(valuesCount[value]).toBe(2)
      }
    })

    test.todo('should shuffle the cards')
  })

  describe('add player', () => {
    let game, emit, playerId
    const clientId = uuid.v4()

    beforeAll(() => {
      const numPairs = 5
      game = new Game(numPairs)
      emit = jest.spyOn(game, 'emit')
      playerId = game.addPlayer(clientId)
    })

    test('should add the player', () => {
      expect(game.players.map(player => player.id)).toContain(playerId)
    })

    test('should emit playerJoined event', () => {
      expect(emit).toBeCalledTimes(1)
      const lastArgs = emit.mock.calls[emit.mock.calls.length - 1]
      expect(lastArgs[0]).toBe('playerJoined')
      expect(lastArgs[1]).toHaveProperty('clientId', clientId)
      expect(lastArgs[1]).toHaveProperty('playerId')
    })
  })

  describe('click card', () => {
    let game, emit, playerId1, playerId2

    beforeEach(() => {
      const numPairs = 5
      game = new Game(numPairs)
      emit = jest.spyOn(game, 'emit')
      const clientId1 = uuid.v4()
      const clientId2 = uuid.v4()
      playerId1 = game.addPlayer(clientId1)
      playerId2 = game.addPlayer(clientId2)
    })

    describe("card isn't selected by anyone", () => {
      beforeEach(() => {
        game.clickCard(playerId1, game.cards[0].id)
      })

      test('should select the card', () => {
        expect(game.cards[0]).toHaveProperty('selectedBy', playerId1)
        expect(game.players.find(player => player.id === playerId1).selectedCards)
          .toContain(game.cards[0].id)
      })

      test('should emit playerSelectedCard event', () => {
        expect(emit).toBeCalledWith('playerSelectedCard', {
          playerId: playerId1,
          cardId: game.cards[0].id,
          cardValue: game.cards[0].value,
        })
      })
    })

    describe('card is selected by self', () => {
      beforeEach(() => {
        game.clickCard(playerId1, game.cards[0].id)
        emit.mockClear()
        game.clickCard(playerId1, game.cards[0].id)
      })

      test('should deselect the card', () => {
        expect(game.cards[0].selectedBy).toBeFalsy()
        expect(game.players.find(player => player.id === playerId1).selectedCards)
          .not.toContain(game.cards[0].id)
      })

      test('should emit playerDeselectedCard event', () => {
        expect(emit).toBeCalledWith('playerDeselectedCard', {
          playerId: playerId1,
          cardId: game.cards[0].id,
        })
      })
    })

    describe('card is selected by someone else', () => {
      beforeEach(() => {
        game.clickCard(playerId1, game.cards[0].id)
        emit.mockClear()
        game.clickCard(playerId2, game.cards[0].id)
      })

      test('should fail to select the card', () => {
        expect(game.cards[0]).toHaveProperty('selectedBy', playerId1)
        expect(game.players.find(player => player.id === playerId1).selectedCards)
          .toContain(game.cards[0].id)
        expect(game.players.find(player => player.id === playerId2).selectedCards)
          .not.toContain(game.cards[0].id)
      })

      test('should emit playerSelectCardFailed event', () => {
        expect(emit).toBeCalledWith('playerSelectCardFailed', {
          playerId: playerId2,
          cardId: game.cards[0].id,
        })
      })
    })

    describe('card has already been matched', () => {
      let pair

      beforeEach(() => {
        const valuesCount = {}
        game.cards.forEach(card => {
          if (!valuesCount[card.value]) {
            valuesCount[card.value] = 1
          } else {
            valuesCount[card.value] += 1
          }
        })
        const matchedValue = Object.keys(valuesCount)[0]
        pair = game.cards.filter(card => card.value === parseInt(matchedValue))
        game.clickCard(playerId1, pair[0].id)
        game.clickCard(playerId1, pair[1].id)
        game.clickCard(playerId2, pair[0].id)
      })

      test('should fail to select the card', () => {
        expect(pair[0]).not.toHaveProperty('selectedBy', playerId2)
        expect(game.players.find(player => player.id === playerId2).selectedCards)
          .not.toContain(game.cards[0].id)
      })

      test('should emit playerSelectCardFailed event', () => {
        expect(emit).toBeCalledWith('playerSelectCardFailed', {
          playerId: playerId2,
          cardId: game.cards[0].id,
        })
      })
    })

    test('should trigger checking for matches after every click', () => {
      const checkForMatches = jest.spyOn(game, 'checkForMatches')
      game.clickCard(playerId1, game.cards[0].id)
      game.clickCard(playerId2, game.cards[0].id)
      expect(checkForMatches.mock.calls[0][0]).toBe(playerId1)
      expect(checkForMatches.mock.calls[1][0]).toBe(playerId2)
    })
  })

  describe('check for matches', () => {
    let game, emit, playerId, pair

    beforeEach(() => {
      const numPairs = 5
      game = new Game(numPairs)
      emit = jest.spyOn(game, 'emit')
      const clientId = uuid.v4()
      playerId = game.addPlayer(clientId)

      const valuesCount = {}
      game.cards.forEach(card => {
        if (!valuesCount[card.value]) {
          valuesCount[card.value] = 1
        } else {
          valuesCount[card.value] += 1
        }
      })
      const aMatchingValue = Object.keys(valuesCount)[0]
      pair = game.cards.filter(card => card.value === parseInt(aMatchingValue))
    })

    test('should not clear player selection when only one card selected', () => {
      game.clickCard(playerId, pair[0].id)
      expect(game.players.find(player => player.id === playerId).selectedCards)
        .toHaveLength(1)
    })

    describe('match is present', () => {
      beforeEach(() => {
        game.clickCard(playerId, pair[0].id)
        game.clickCard(playerId, pair[1].id)
      })

      test('should mark the cards as matched', () => {
        const matchedCardIds = game.cards
          .filter(card => card.isMatched)
          .map(card => card.id)
        expect(matchedCardIds).toEqual([pair[0].id, pair[1].id])
      })

      test('should emit matchFound event', () => {
        expect(emit).toBeCalledWith('matchFound', {
          playerId,
          cardIds: [pair[0].id, pair[1].id],
          cardValue: pair[0].value,
        })
      })

      test('should clear selection of the current player', () => {
        expect(game.players.find(player => player.id === playerId).selectedCards)
          .toHaveLength(0)
      })
    })

    describe('match is not present', () => {
      let otherCard

      beforeEach(() => {
        game.clickCard(playerId, pair[0].id)
        otherCard = game.cards.find(card => card.value != pair[0].value)
        game.clickCard(playerId, otherCard.id)
      })

      test('should emit matchFailed event', () => {
        expect(emit).toBeCalledWith('matchFailed', {
          playerId,
          cardIds: [pair[0].id, otherCard.id],
        })
      })

      test('should clear selection of the current player', () => {
        expect(game.players.find(player => player.id === playerId).selectedCards)
          .toHaveLength(0)
      })
    })
  })
})
