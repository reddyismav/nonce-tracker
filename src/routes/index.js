const express = require('express')
const posExitRoutes = require('./pos-exits')
const posDepositRoutes = require('./pos-deposits')

const router = express.Router()
router.use('/pos-exit', posExitRoutes)
router.use('/pos-deposit', posDepositRoutes)

module.exports = router
