const RootDeposits = require('../models/RootDeposits')
const { request, gql } = require('graphql-request')
// const { mainnetWeb3 } = require('../index')
require('dotenv').config()
const Web3 = require('web3')
const { ROOT_CHAIN_MANAGER_ABI, WITHDRAW_MANAGER_ABI } = require('../constants')
const { getParsedTxDataFromAbiDecoder } = require('./decoder')

// Save Deposit Transaction from Subgraph with nonces
export const getAndSavePosDepositTransactions = async() => {
  try {
    const mainnetWeb3 = new Web3(process.env.ETH_NETWORK_PROVIDER)
    await RootDeposits.deleteMany({ _id: { $ne: null}});
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
        const transactionDetails = await mainnetWeb3.eth.getTransactionReceipt(transactionHash)
        console.log("transactionDetails", transactionDetails)
        const { input, blockNumber } = transactionDetails
        const decodedAbiDataResponse = await getParsedTxDataFromAbiDecoder(input, ROOT_CHAIN_MANAGER_ABI.abi)
        if (!decodedAbiDataResponse.success) throw new Error('error in decoding abi')
        const decodedInputData = decodedAbiDataResponse.result
        let data;
        if (decodedInputData) {
          const depositData = decodedInputData.params[2].value
          const amount = await mainnetWeb3.eth.abi.decodeParameter('uint256', depositData).toString();
          data = {
            transactionHash,
            timestamp,
            userAddress: userAddress.toLowerCase(),
            rootToken,
            amount,
            counter,
            blockNumber,
          }
          datatoInsert.push(data)
        } else {
          data = {
            transactionHash,
            timestamp,
            userAddress: userAddress.toLowerCase(),
            rootToken,
            // amount,
            counter,
            blockNumber,
            cannotBeDecoded,
          }
        }
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
    const mainnetWeb3 = new Web3(process.env.NETWORK_PROVIDER)
    let { transactionHash: initialTransactionHash, userAddress, amount } = reqParams.query
    const rootDeposit = await RootDeposits.findOne({ userAddress, amount, rootToken, isResolved: false })
    let response
    if (rootDeposit) {
      const { transactionHash } = rootDeposit
      response = {
        success: true,
        initialTransactionHash,
        newTransactionHash: transactionHash,
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
