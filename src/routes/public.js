const { Router } = require('express')
const db = require('../db')
const router = Router()
const strategy = require('../strategy')

router.get('/', async (req, res) => res.render('index'))

router.post('/config', async (req, res, next) => {
  try {
    const config = req.body
    db.set(`configs.${config.name}`, config)
      .write()
    strategy.init(config.name)
    res.sendStatus(200)
  } catch (error) {
    next(error)
  }
})

router.put('/config', async (req, res, next) => {
  try {
    const config  = req.body
    db.get('configs')
      .find({ name: config.name })
      .assign(config)
      .write()
    strategy.init(config.name)
    res.sendStatus(200)
  } catch (error) {
    next(error)
  }
})

router.get('/config', async (req, res, next) => {
  try {
    const configs = db.get('configs').value()
    res.status(200).json(configs)
  } catch (error) {
    next(error)
  }
})

module.exports = router
