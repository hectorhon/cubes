const Koa = require('koa')
const pino = require('pino')

const app = new Koa()
const log = pino()

app.use(ctx => {
  log.info({ a: 123 }, 'Hello Koa', )
  ctx.body = 'Hello Koa'
})

app.listen(3000, () => {
  log.info({ port: 3000 }, 'App started')
})
