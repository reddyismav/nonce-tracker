const mongoose = require('mongoose')

const RootExitSchema = mongoose.Schema({
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
  counter: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model('RootExits', RootExitSchema)
