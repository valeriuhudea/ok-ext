'use strict'
require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const routes = require('./routes')
const helmet = require('helmet')
const csrf = require('csurf')
const RateLimit = require('express-rate-limit')

const winston = require('winston')

const passport = require('passport')
const session = require('express-session')
const cookieParser = require('cookie-parser')
//const { initAuth } = require('./strategy')

const redis = require('redis')
const connectRedis = require('connect-redis')

let RedisStore = connectRedis(session)

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_KEY,
  socket_keepalive: true,
  enable_offline_queue: true,
  ttls: {
    servername: process.env.REDIS_HOST
  }
})

redisClient.on('error', function(error) {
  console.log('Could not establish a connection with redis. ' + error)
})

redisClient.on('connect', function(error) {
  console.log('Connected to redis successfully')
})

const app = express()

app.use(morgan('combined'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.disable('x-powered-by')

const limiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying — full speed until the max limit is  reached
})

app.use(limiter)

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
      'script-src': ["'self'", "'unsafe-inline'"],
      'object-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
    }
  },
  referrerPolicy: { policy: 'same-origin' },
  frameguard: {
    action: 'deny'
  },
  hsts: {
    maxAge: 315360000,
    includeSubDomains: true,
    preload: false
  }
}))
app.use(helmet.xssFilter())

app.use(cors({
  origin: process.env.HOST,
  methods: ['GET', 'POST', 'PUT']
}))

app.use(cookieParser())

app.use(session(
  {
    secret: process.env.SESSION_SECRET,
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000,
      expires: new Date(Date.now() + 60 * 60 * 1000),
      host: process.env.HOST,
      path: '/',
      httpOnly: true,
      secure: false
    }
  }
))
app.use(csrf({ cookie: true }))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'))
app.set('trust proxy', 1)

app.use(express.static(path.join(__dirname, '../../../../app/src/public')))

app.use(passport.initialize())
app.use(passport.session())

/* Storing user data received from the Authorization callback in the session, i.e. in `req.session.passport.user` */
passport.serializeUser((user, next) => next(null, user))
/* Getting the user data back from session and attaching it to the request object, i.e. to `req.user` */
passport.deserializeUser((user, next) => {
  /*
    If we only use the user identifier, it is stored in the session, this is where
    the full set could be retrieved, e.g. from a database, and passed to the next step
  */
  next(null, user)
})

app.use(routes)

const port = process.env.PORT
app.listen(port, () => {
  //initAuth()
  console.log(`Server running on port ${port}`)
})

