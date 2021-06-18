const express = require('express')
const posExitRoutes = require('./pos-exits')
const posDepositRoutes = require('./pos-deposits')
const plasmaExitRoutes = require('./plasma-exits')
const userTransactionRoutes = require('./user-transactions')

const router = express.Router()
router.use('/exit', posExitRoutes)
router.use('/deposit', posDepositRoutes)
router.use('/plasma-exit', plasmaExitRoutes)
router.use('/user-transactions', userTransactionRoutes)

module.exports = router
