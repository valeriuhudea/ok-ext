const { Router } = require('express')
const passport = require('passport')
const jwtDecode  = require('jwt-decode')
const LoginStrategy = require('passport-openidconnect').Strategy
const axios = require('axios')
const querystring = require('querystring')
const db = require('./db')


const bcrypt = require('bcrypt')

const saltRounds = 10

const activeConfigs = {}
const getStatus = (name) => !!activeConfigs[name]

const router = Router()

router.get('/auth/:name', (req, ...args) => {
  const { name } = req.params
  if (!getStatus(name)) init(name)
  return passport.authenticate(name)(req, ...args)
})
router.get('/auth/:name/callback', (req, ...args) => {
  const { name } = req.params
  return passport.authenticate(name, {
    failureRedirect: '/',
    successRedirect: '/dashboard'
  })(req, ...args)
})

// this can be loaded whenever a config is updated
const init = (name) => {
  activeConfigs[name] = true
  const config =  db.get('configs').find({ name }).value()
  if (config)  {
    const {
      client_id,
      client_secret,
      issuer,
      authorization_endpoint,
      token_endpoint,
      userinfo_endpoint,
      scope
    } = config
    passport.use(
      name,
      new LoginStrategy(
        {
          issuer: issuer,
          authorizationURL: authorization_endpoint,
          clientID: client_id,
          tokenURL: token_endpoint,
          clientSecret: client_secret,
          callbackURL: `${process.env.HOST}/auth/${name}/callback`,
          userInfoURL: userinfo_endpoint,
          scope: scope,
          skipUserProfile: true,
          passReqToCallback: false,
          realm: process.env.HOST
        },
        (iss, sub, profile, accessToken, refreshToken, tokens, done)  => {
          const decoded_access_token = jwtDecode(tokens.access_token)
          const decoded_id_token = jwtDecode(tokens.id_token)
          console.log(decoded_access_token)
          console.log(decoded_id_token)

          var userEmail = decoded_access_token.sub
          var userId = decoded_access_token.uid
          var acs_scope = decoded_access_token.scp
          var activate = false
          const operations = {
            allowed_ops: acs_scope
          }
          const user = {
            issuer: issuer,
            userId: userId,
            email: userEmail,
            //jwtClaims: jwtClaims,
            access_token: accessToken,
            id_token: tokens.id_token,
            operations: operations
          }
          return done(null, user)
        }
      )
    )
  }
}

module.exports =  {
  router,
  init
}