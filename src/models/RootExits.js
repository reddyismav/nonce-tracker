const mongoose = require('mongoose')

const RootExitSchema = mongoose.Schema({
  transactionHash: {
    type: String,
    required: true
  },
  burnTransactionHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: false
  },
  userAddress: {
    type: String,
    required: false
  },
  counter: {
    type: Number,
    required: false
  }
})

module.exports = mongoose.model('RootExits', RootExitSchema)
