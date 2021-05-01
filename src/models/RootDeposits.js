const mongoose = require('mongoose')

const RootDepositSchema = mongoose.Schema({
  transactionHash: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    required: false,
    default: -1
  },
  timestamp: {
    type: Number,
    required: false
  },
  userAddress: {
    type: String,
    required: true
  },
  rootToken: {
    type: String,
    required: false
  },
  counter: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model('RootDeposits', RootDepositSchema)
