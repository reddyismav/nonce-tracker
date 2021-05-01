const express = require('express')
const posExitController = require('../controllers/pos-exits')

const router = express.Router()

router.get('/', posExitController.callCheckExitTransactionIfReplaced)

module.exports = router
