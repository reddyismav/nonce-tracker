const express = require('express')
const userTransactionController = require('../controllers/user-transactions')

const router = express.Router()

router.get('/', userTransactionController.callFindUserBurnTransactions)
router.post('/', userTransactionController.callAddActionRequiredTxDoc)

module.exports = router
