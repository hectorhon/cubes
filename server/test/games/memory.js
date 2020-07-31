require('should')
const sinon = require('sinon')
require('should-sinon')
const uuid = require('uuid')

const Game = require('../../src/games/memory')

describe('Memory game', () => {
  describe('constructor', () => {
    let game
    const numPairs = 5

    before(() => {
      game = new Game(numPairs)
    })

    it('assign an id', () => {
      (!!game.id).should.be.true()
    })

    it('should create correct number of cards', () => {
      game.cards.should.have.length(numPairs * 2)
    })

    it('should create correct pairs of cards', () => {
      const valuesCount = {}
      game.cards.forEach(card => {
        if (!valuesCount[card.value]) {
          valuesCount[card.value] = 1
        } else {
          valuesCount[card.value] += 1
        }
      })
      Object.keys(valuesCount).should.have.length(numPairs)
      for (let value in valuesCount) {
        valuesCount[value].should.equal(2)
      }
    })

    it('should shuffle the cards')
  })

  describe('add player', () => {
    let game, emit, playerId
    const clientId = uuid.v4()

    before(() => {
      const numPairs = 5
      game = new Game(numPairs)
      emit = sinon.spy(game, 'emit')
      playerId = game.addPlayer(clientId)
    })

    it('should add the player', () => {
      game.players.map(player => player.id).should.containEql(playerId)
    })

    it('should emit playerJoined event', () => {
      emit.should.be.calledWith('playerJoined')
      emit.lastCall.args[1].should.have.property('clientId', clientId)
      emit.lastCall.args[1].should.have.property('playerId')
    })
  })

  describe('click card', () => {
    let game, emit, playerId1, playerId2

    beforeEach(() => {
      const numPairs = 5
      game = new Game(numPairs)
      emit = sinon.spy(game, 'emit')
      const clientId1 = uuid.v4()
      const clientId2 = uuid.v4()
      playerId1 = game.addPlayer(clientId1)
      playerId2 = game.addPlayer(clientId2)
    })

    describe("card isn't selected by anyone", () => {
      beforeEach(() => {
        game.clickCard(playerId1, game.cards[0].id)
      })

      it('should select the card', () => {
        game.cards[0].should.have.property('selectedBy', playerId1)
        game.players.find(player => player.id === playerId1).selectedCards
          .should.containEql(game.cards[0].id)
      })

      it('should emit playerSelectedCard event', () => {
        emit.should.be.calledWith('playerSelectedCard')
        emit.lastCall.args[1].should.have.property('playerId', playerId1)
        emit.lastCall.args[1].should.have.property('cardId', game.cards[0].id)
        emit.lastCall.args[1].should.have.property('cardValue', game.cards[0].value)
      })
    })

    describe('card is selected by self', () => {
      beforeEach(() => {
        game.clickCard(playerId1, game.cards[0].id)
        emit.resetHistory()
        game.clickCard(playerId1, game.cards[0].id)
      })

      it('should deselect the card', () => {
        (!!game.cards[0].selectedBy).should.be.false()
        game.players.find(player => player.id === playerId1).selectedCards
          .should.not.containEql(game.cards[0].id)
      })

      it('should emit playerDeselectedCard event', () => {
        emit.should.be.calledWith('playerDeselectedCard')
        emit.lastCall.args[1].should.have.property('playerId', playerId1)
        emit.lastCall.args[1].should.have.property('cardId', game.cards[0].id)
      })
    })

    describe('card is selected by someone else', () => {
      beforeEach(() => {
        game.clickCard(playerId1, game.cards[0].id)
        emit.resetHistory()
        game.clickCard(playerId2, game.cards[0].id)
      })

      it('should fail to select the card', () => {
        game.cards[0].should.have.property('selectedBy', playerId1)
        game.players.find(player => player.id === playerId1).selectedCards
          .should.containEql(game.cards[0].id)
        game.players.find(player => player.id === playerId2).selectedCards
          .should.not.containEql(game.cards[0].id)
      })

      it('should emit playerSelectCardFailed event', () => {
        emit.should.be.calledWith('playerSelectCardFailed')
        emit.lastCall.args[1].should.have.property('playerId', playerId2)
        emit.lastCall.args[1].should.have.property('cardId', game.cards[0].id)
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

      it('should fail to select the card', () => {
        pair[0].should.not.have.property('selectedBy', playerId2)
        game.players.find(player => player.id === playerId2).selectedCards
          .should.not.containEql(game.cards[0].id)
      })

      it('should emit playerSelectCardFailed event', () => {
        emit.should.be.calledWith('playerSelectCardFailed')
        emit.lastCall.args[1].should.have.property('playerId', playerId2)
        emit.lastCall.args[1].should.have.property('cardId', game.cards[0].id)
      })
    })

    it('should trigger checking for matches after every click', () => {
      const checkForMatches = sinon.spy(game, 'checkForMatches')
      game.clickCard(playerId1, game.cards[0].id)
      game.clickCard(playerId2, game.cards[0].id)
      checkForMatches.firstCall.args[0].should.equal(playerId1)
      checkForMatches.secondCall.args[0].should.equal(playerId2)
    })
  })

  describe('check for matches', () => {
    let game, emit, playerId, pair

    beforeEach(() => {
      const numPairs = 5
      game = new Game(numPairs)
      emit = sinon.spy(game, 'emit')
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

    it('should not clear player selection when only one card selected', () => {
      game.clickCard(playerId, pair[0].id)
      game.players.find(player => player.id === playerId)
        .selectedCards.should.have.length(1)
    })

    describe('match is present', () => {
      beforeEach(() => {
        game.clickCard(playerId, pair[0].id)
        game.clickCard(playerId, pair[1].id)
      })

      it('should mark the cards as matched', () => {
        const matchedCardIds = game.cards
          .filter(card => card.isMatched)
          .map(card => card.id)
        matchedCardIds.should.containDeep([pair[0].id, pair[1].id])
      })

      it('should emit matchFound event', () => {
        emit.should.be.calledWith('matchFound')
        emit.lastCall.args[1].should.have.property('playerId', playerId)
        emit.lastCall.args[1].cardIds.should.deepEqual([pair[0].id, pair[1].id])
        emit.lastCall.args[1].should.have.property('cardValue', pair[0].value)
      })

      it('should clear selection of the current player', () => {
        game.players.find(player => player.id === playerId).selectedCards
          .should.have.length(0)
      })
    })

    describe('match is not present', () => {
      let otherCard

      beforeEach(() => {
        game.clickCard(playerId, pair[0].id)
        otherCard = game.cards.find(card => card.value != pair[0].value)
        game.clickCard(playerId, otherCard.id)
      })

      it('should emit matchFailed event', () => {
        emit.should.be.calledWith('matchFailed')
        emit.lastCall.args[1].should.have.property('playerId', playerId)
        emit.lastCall.args[1].cardIds.should.deepEqual([pair[0].id, otherCard.id])
      })

      it('should clear selection of the current player', () => {
        game.players.find(player => player.id === playerId).selectedCards
          .should.have.length(0)
      })
    })
  })
})
