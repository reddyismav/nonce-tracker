const express = require('express')
const posExitRoutes = require('./pos-exits')
const posDepositRoutes = require('./pos-deposits')

const router = express.Router()
router.use('/exit', posExitRoutes)
router.use('/deposit', posDepositRoutes)

module.exports = router
