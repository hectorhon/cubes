const Router = require('@koa/router')

const logger = require('../../logger')
const memoryGameService = require('../../service/games/memory')

const router = new Router()

router.post('/games/memory/create', ctx => {
  const numPairs = 5
  const gameId = memoryGameService.createGame(numPairs)
  ctx.body = { gameId }
})

function socketSetup(io) {
  const io_ = io.of('/games/memory')
  io_.on('connection', socket => {
    logger.info({ socketId: socket.id }, 'A socket connected')

    const { clientId, nickname, gameId } = socket.handshake.query

    socket.on('disconnect', reason => {
      logger.info({ socketId: socket.id, reason }, 'A socket disconnected')
    })

    memoryGameService.setupClient(clientId, socket, gameId)
  })
}

module.exports = {
  router,
  socketSetup,
}
