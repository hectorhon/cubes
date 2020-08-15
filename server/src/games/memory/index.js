const EventEmitter = require('events')
const uuid = require('uuid')

class Player {
  id
  selectedCards = []

  constructor() {
    this.id = uuid.v4()
  }
}

class Card {
  id
  value
  selectedBy  // Value is a playerId. Can only one player at a time
  isMatched

  constructor(value) {
    this.id = uuid.v4()
    this.value = value
  }
}

class Game extends EventEmitter {
  id
  players = []
  cards = []

  constructor(numPairs) {
    super()
    this.id = uuid.v4()
    for (let pairIndex = 0; pairIndex < numPairs; pairIndex++) {
      for (let i = 0; i < 2; i++) {
        const value = pairIndex // * 2 + i
        const card = new Card(value)
        this.cards.push(card)
      }
    }
  }

  addPlayer(clientId) {
    const player = new Player()
    this.players.push(player)
    this.emit('playerJoined', {
      clientId,
      playerId: player.id,
    })
    return player.id
  }

  getStateForPlayer(playerId) {
    return {
      players: this.players.map(player => ({
        id: player.id,
      })),
      cards: this.cards.map(card => {
        if (card.isMatched) {
          return {
            id: card.id,
            value: card.value,
            isMatched: card.isMatched,
          }
        } else if (card.selectedBy === playerId) {
          return {
            id: card.id,
            value: card.value,
          }
        } else {
          return {
            id: card.id,
          }
        }
      })
    }
  }

  clickCard(playerId, cardId) {
    const card = this.cards.find(card => card.id === cardId)
    const player = this.players.find(player => player.id === playerId)

    if (card.isMatched) {
      this.emit('playerSelectCardFailed', {
        playerId,
        cardId,
      })
    } else if (card.selectedBy === null || card.selectedBy === undefined) {
      card.selectedBy = playerId
      player.selectedCards.push(card.id)
      this.emit('playerSelectedCard', {
        playerId,
        cardId,
        cardValue: card.value,
      })
    } else if (card.selectedBy === playerId) {
      card.selectedBy = null
      const cardIndex = player.selectedCards.findIndex(card => card.id === cardId)
      player.selectedCards.splice(cardIndex, 1)
      this.emit('playerDeselectedCard', {
        playerId,
        cardId,
      })
    } else if (card.selectedBy !== playerId) {
      this.emit('playerSelectCardFailed', {
        playerId,
        cardId,
      })
    }

    this.checkForMatches(playerId)
  }

  checkForMatches(playerId) {
    const player = this.players.find(player => player.id === playerId)
    if (player.selectedCards.length <= 1) {
      // Do nothing; wait for next card
    } else if (player.selectedCards.length === 2) {
      const [card1, card2] = player.selectedCards
        .map(cardId => this.cards.find(card => card.id === cardId))
      if (card1.value === card2.value) {
        card1.isMatched = true
        card2.isMatched = true
        this.emit('matchFound', {
          playerId,
          cardIds: [card1.id, card2.id],
          cardValue: card1.value,
        })
        setTimeout(() => {
          player.selectedCards.length = 0
          card1.selectedBy = null
          card2.selectedBy = null
          this.emit('selectionClearedAfterMatchFound', {
            playerId,
            cardIds: [card1.id, card2.id],
          })
        }, 1000)
      } else {
        this.emit('matchFailed', {
          playerId,
          cardIds: [card1.id, card2.id],
        })
        setTimeout(() => {
          player.selectedCards.length = 0
          card1.selectedBy = null
          card2.selectedBy = null
          this.emit('selectionClearedAfterMatchFailed', {
            playerId,
            cardIds: [card1.id, card2.id],
          })
        }, 1000)
      }
    } else {
      throw `Unexpected number of selected cards: ${player.selectedCards.length}`
    }
  }
}

module.exports = Game
