const mongoose = require('mongoose')

const TokenMappingsSchema = mongoose.Schema({
  rootTokenAddress: {
    type: String,
    required: true
  },
  childTokenAddress: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  decimals: {
    type: Number,
    required: true
  },
  tokenId: {
    type: String,
    required: false
  }
})

module.exports = mongoose.model('TokenMappings', TokenMappingsSchema)
