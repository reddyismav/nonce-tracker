const express = require('express')
const posDepositController = require('../controllers/pos-deposits')

const router = express.Router()

router.get('/', posDepositController.callCheckDepositTransactionIfReplaced)

module.exports = router
