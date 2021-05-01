const RootDeposits = require('../models/RootDeposits')
const { request, gql } = require('graphql-request')
// const { mainnetWeb3 } = require('../index')
require('dotenv').config()
const Web3 = require('web3')

// Save Deposit Transaction from Subgraph with nonces
export const getAndSavePosDepositTransactions = async() => {
  try {
    const mainnetWeb3 = new Web3(process.env.NETWORK_PROVIDER)
    let start = await RootDeposits.countDocuments()
    let findMore = true

    while (findMore) {
      let deposits = await getDepositsFromSubgraph(start)
      if (deposits.length === 1000) {
        start = start + 1000
      } else {
        findMore = false
      }
      const datatoInsert = []
      for (const deposit of deposits) {
        const {
          transactionHash,
          timestamp,
          user: userAddress,
          rootToken,
          counter
        } = deposit
        const transactionDetails = await mainnetWeb3.eth.getTransaction(transactionHash)
        const { nonce } = transactionDetails
        const data = {
          transactionHash,
          timestamp,
          userAddress,
          rootToken,
          counter,
          nonce
        }
        datatoInsert.push(data)
        console.log('Deposit counter', counter)
      }

      await RootDeposits.insertMany(datatoInsert)
    }
  } catch (error) {
    console.log('error in getting and saving deposit transaction for POS', error)
  }
}

export const getDepositsFromSubgraph = async(start) => {
  try {
    const limit = 1000
    const direction = 'asc'
    const sortBy = 'counter'
    const query = gql`query{
        rootDeposits(first:${limit}, where:{ counter_gt: ${start}}, orderDirection:${direction}, orderBy:${sortBy}) {
            transactionHash,
            user,
            rootToken,
            counter,
            timestamp,
        }
        }`
    const resp = await request(process.env.SUBGRAPH_ENDPOINT, query)
    return resp.rootDeposits
  } catch (error) {
    console.log('error in getting deposits from subgraph', error)
  }
}

export const checkDepositTransactionIfReplaced = async(reqParams) => {
  try {
    const { transactionHash: initialTransactionHash, userAddress } = reqParams.query
    const { nonce: initialNonce } = await mainnetWeb3.eth.getTransaction(initialTransactionHash)
    const rootDeposit = await RootDeposits.findOne({ nonce: initialNonce, userAddress })
    let response
    if (rootDeposit) {
      const { transactionHash } = rootDeposit
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
