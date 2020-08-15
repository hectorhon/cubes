const Koa = require('koa')
const http = require('http')
const socketIo = require('socket.io')

const logger = require('./logger')
const router = require('./routes')

const port = 3000
const app = new Koa()

app.use(async (ctx, next) => {
  logger.trace({
    method: ctx.method,
    url: ctx.url,
    ip: ctx.ip,
  }, 'Received request')
  const start = Date.now()
  await next()
  const responseTime = Date.now() - start
  logger.trace({
    method: ctx.method,
    url: ctx.url,
    ip: ctx.ip,
    status: ctx.status,
    responseTime,
  }, 'Completed request')
})

app.use(router.router.routes())

const server = http.createServer(app.callback())

const io = socketIo(server, {
})

router.socketSetup(io)

server.listen(port, () => {
  logger.info({ port }, 'App started')
})
