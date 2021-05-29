'use strict'
require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')
const logger = require('morgan')
const routes = require('./routes')
const helmet = require('helmet')
const csrf = require('csurf')

const passport = require('passport')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const app = express()

app.use(logger('dev'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.disable('x-powered-by')

/* RATE LIMITING
const RateLimit = require('express-rate-limit');

const limiter = new RateLimit({
  windowMs: 15*60*1000, // 15 minutes 
  max: 100, // limit each IP to 100 requests per windowMs 
  delayMs: 0 // disable delaying — full speed until the max limit is  reached
})
*/
app.use(helmet.hsts({ maxAge: 6666666777, includeSubdomains: true }))
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
      'script-src': ["'self'"],
      'object-src': ["'self'"],
    }
  },
  referrerPolicy: { policy: 'same-origin' },
  frameguard: {
    action: 'deny'
  }
}))

app.use(cors({
  origin: process.env.HOST,
  methods: ['GET', 'POST', 'PUT']
}))

app.use(cookieParser())

app.use(csrf({ cookie: true }))

var expiryDate = new Date(Date.now() + 60 * 60 * 1000)
app.use(session(
  {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000,
      expires: expiryDate,
      host: process.env.HOST,
      path: '/',
      httpOnly: process.env.NODE_ENV === 'development',
      secure: process.env.NODE_ENV === 'production'
    }
  }
))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'))
app.use(express.static(path.join(__dirname, './public')))

app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, next) => next(null, user))
passport.deserializeUser((user, next) => next(null, user))

app.use(routes)

app.use(function Authenticated(req, res, next) {
  res.locals.authenticated = req.session.passport && req.user

  if (res.locals.authenticated) {
    res.locals.accounts = {}

    Object.keys(req.session.accounts).forEach(function(e) {
      res.locals.accounts[e] = req.session.accounts[e].public
    })
  }
  res.locals.originalUrl = req.originalUrl
  next()
})

const port = process.env.port
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

