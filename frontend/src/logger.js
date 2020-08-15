import pino from 'pino'

let logLevel = 'trace'
if (process.env.NODE_ENV === 'test') {
  logLevel = 'silent'
}

const logger = pino({
  level: logLevel,
})

export default logger
