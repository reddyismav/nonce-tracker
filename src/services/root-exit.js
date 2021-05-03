const RootExits = require('../models/RootExits')
const { request, gql } = require('graphql-request')
const { mainnetWeb3 } = require('../index')
require('dotenv').config()
const Web3 = require('web3')


// Save Exit Transaction from Subgraph with nonces
export const getAndSavePosExitTransactions = async() => {
  try {
    const mainnetWeb3 = new Web3(process.env.NETWORK_PROVIDER)
    // await RootExits.deleteMany({ _id: { $ne: null}});
    let start = await RootExits.countDocuments()
    let findMore = true

    while (findMore) {
      let exits = await getExitsFromSubgraph(start)
      if (exits.length === 1000) {
        start = start + 1000
      } else {
        findMore = false
      }
      const datatoInsert = []
      for (const exit of exits) {
        const {
          transactionHash,
          timestamp,
          counter
        } = exit
        const transactionDetails = await mainnetWeb3.eth.getTransaction(transactionHash)
        const { nonce, from: userAddress } = transactionDetails
        console.log("nonce", nonce, userAddress)
        const data = {
          transactionHash,
          timestamp,
          userAddress,
          counter,
          nonce
        }
        datatoInsert.push(data)
        console.log('Exit counter', counter)
      }

      await RootExits.insertMany(datatoInsert)
    }
  } catch (error) {
    console.log('error in getting and saving deposit transaction for POS', error)
  }
}

export const getExitsFromSubgraph = async(start) => {
  try {
    const limit = 1000
    const direction = 'asc'
    const sortBy = 'counter'
    const query = gql`query{
        rootexits(first:${limit}, where:{ counter_gt: ${start}}, orderDirection:${direction}, orderBy:${sortBy}) {
            transactionHash,
            counter,
            timestamp,
        }
        }`
    const resp = await request(process.env.SUBGRAPH_ENDPOINT, query)
    return resp.rootexits
  } catch (error) {
    console.log('error in getting deposits from subgraph', error)
  }
}

export const checkExitTransactionIfReplaced = async(reqParams) => {
  try {
    const mainnetWeb3 = new Web3(process.env.NETWORK_PROVIDER)
    let { transactionHash: initialTransactionHash, userAddress } = reqParams.query
    initialTransactionHash = initialTransactionHash.toLowerCase()
    const transactionDetails = await mainnetWeb3.eth.getTransaction(initialTransactionHash)
    const { nonce: initialNonce } = transactionDetails
    const rootExit = await RootExits.findOne({ nonce: initialNonce, userAddress })
    let response
    if (rootExit) {
      let { transactionHash } = rootExit
      transactionHash = transactionHash.toLowerCase()
      if (transactionHash === initialTransactionHash) {
        response = {
          success: true,
          status: 1,
          initialTransactionHash,
          transactionHash: null
        }
      } else {
        response = {
          success: true,
          status: 2,
          initialTransactionHash,
          transactionHash
        }
      }
    } else {
      response = {
        success: false,
        status: 3,
        message: 'transaction might still be pending as subgraph did not pick this data up.'
      }
    }
    return response
  } catch (error) {
    console.log('error in checking transaction', error)
    const response = {
      success: false,
      error: error.message
    }
    return response
  }
}
