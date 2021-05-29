const { Router } = require('express')
const strategy = require('../strategy')
const protectedRoutes = require('./dashboard')
const unprotectedRoutes = require('./public')
const logoutRoute = require('./logout')
const db = require('../db')

const router = Router()
router.use(strategy.router)
router.use(unprotectedRoutes)

router.use('/dashboard', (req, res, next) => {
  const authenticated = req.isAuthenticated()
  if (authenticated) {
    next()
  } else {
    res.sendStatus(401)
  }
}, protectedRoutes)

router.use('/logout', (req, res, next) => {
  const authenticated = req.isAuthenticated()
  if (authenticated) {
    next()
  } else {
    res.sendStatus(401)
  }
}, logoutRoute)

router.use('*', (req, res) => res.sendStatus(404))
router.use((error, req, res, next) => {
  const { status = 404, message } = error
  res.status(status).json({ status, message })
})

module.exports = router
