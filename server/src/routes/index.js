const Router = require('@koa/router')

const memoryGameRouter = require('./games/memory')

const router = new Router()

router.use(memoryGameRouter.router.routes())

function socketSetup(io) {
  memoryGameRouter.socketSetup(io)
}

module.exports = {
  router,
  socketSetup,
}
