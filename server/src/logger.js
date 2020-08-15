const pino = require('pino')

let logLevel = 'trace'
if (process.env.NODE_ENV === 'test') {
  logLevel = 'silent'
}

const logger = pino({
  level: logLevel,
})

module.exports = logger
