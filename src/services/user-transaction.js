const Web3 = require('web3')
const axios = require('axios')
require('dotenv').config()
const { addActionRequiredTxDoc } = require('./fire')
const TokenMappings = require('../models/TokenMappings')


const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const findUserBurnTransactionsFromCovalent = async (params) => {
    try {
        const { userAddress, startBlock, endBlock } = params
        const covalentUrl = `https://api.covalenthq.com/v1/137/events/topics/0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef/?&starting-block=${startBlock}&ending-block=${endBlock}&key=${process.env.COVALENT_KEY}&match=`
        const paramString = `{"$and":[{"decoded.params.0.value":"${userAddress}"},{"decoded.params.1.value":"${ZERO_ADDRESS}"}]}`
        const url = covalentUrl + paramString

        const response = await axios.get(url)
        if (response.data) {
            return { success: true, result: response.data}
        } else {
            return { success: false}
        }
    } catch (error) {
        console.log("error in getting user burn transactions", error)
        return { success: false }
    }
}

export const findUserBurnTransactions = async (reqParams) => {
    try {
        const { userAddress } = params.query
        if (!userAddress) {
            throw new Error("User Address is required")
        }
        const web3 = new Web3(process.env.MATIC_NETWORK_PROVIDER)

        const currentBlock = await web3.eth.getBlockNumber()
        const startBlock = currentBlock - 400000

        const userBurnTransactionsResponse = await findUserBurnTransactionsFromCovalent({ userAddress, startBlock, endBlock: currentBlock })
        if (!userBurnTransactionsResponse.success) {
            throw new Error("Error in burn transacrion response")
        }

        const {result: userBurnTransactions} = userBurnTransactionsResponse
        const { items } = userBurnTransactions.data

        const promiseArray = []
        if (items && items.length > 0) {
            for(const item of items) {
                const { sender_address: tokenAddress, decoded, tx_hash: txHash } = item
                const token = await TokenMappings.findOne({ childTokenAddress: tokenAddress.toLowerCase()})

                const { childTokenAddress, tokenId, decimals } = token
                const { value } = decoded.params[2]

                const valueToSend = (parseInt(value, 10)/decimals).toString()
                if (tokenId && childTokenAddress && valueToSend && txHash) {

                }
                const body = {
                    userAddress, 
                    burnTransactionHash: txHash, 
                    tokenId, 
                    amount: valueToSend,
                    isManual: false
                }
                const promiseObject = addActionRequiredTxDoc({ body })
                promiseArray.push(promiseObject)
            }
            await Promise.all(promiseArray)
        }
    } catch (error) {
        console.log("error in finding user burn transactions", error);
        return { success: false }
    }
}

export const findPastBurnLogs = async (params) => {
    try {
        const { userAddress } = params
        const userAddressByte = '0x000000000000000000000000' + userAddress.slice(2,66)
        const web3 = new Web3(process.env.MATIC_NETWORK_PROVIDER)

        const topicsArray = ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",userAddressByte,"0x0000000000000000000000000000000000000000000000000000000000000000"]
        const currentBlock = await web3.eth.getBlockNumber()
        const startBlock = currentBlock - 64800
        const logs = await web3.eth.getPastLogs({
            fromBlock: startBlock,
            toBlock: currentBlock,
            topics: topicsArray
        })

        console.log(logs)
    } catch (error) {
        console.log("error in finding past logs of the user", error)
    }
}

// https://api.covalenthq.com/v1/137/events/topics/0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef/?&starting-block=14653920&sender-address=0x7ceb23fd6bc0add59e62ac25578270cff1b9f619&ending-block=14773922&key=ckey_2230602b71244a05a42158400f7&match={%20%22$and%22:%20[%20{%20%22decoded.params.0.value%22:%20%220xfd71dc9721d9ddcf0480a582927c3dcd42f3064c%22%20},%20{%20%22decoded.params.1.value%22:%20%220x0000000000000000000000000000000000000000%22%20}%20]%20}