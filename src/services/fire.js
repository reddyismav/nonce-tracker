import { Token } from 'graphql'

var firebaseAdmin = require('firebase-admin')
const serviceAccount = require('../../serviceAccountKeyMainnet.json')
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
})
const fire = firebaseAdmin.firestore()
const TokenMappings = require('../models/TokenMappings')

export const getActionRequiredTxDoc = async(params) => {
  try {
    const { userAddress, burnTransactionHash } = params

    let firebaseEntry = await fire.collection('userInfos').doc(userAddress.toLowerCase()).collection('actionRequiredTx').doc(burnTransactionHash.toLowerCase()).get()
    if (firebaseEntry.data()) {
      return {
        success: true,
        status: 1,
        result: firebaseEntry.data()
      }
    } else {
      return { success: false, status: 2, message: 'Burn tx does not exist in Database.' }
    }
  } catch (error) {
    console.log('error in getting firebase entry', error)
    return { success: false, status: 0, message: 'error in getting firebase entry' }
  }
}

export const addActionRequiredTxDoc = async(params) => {
  try {
    const { userAddress, burnTransactionHash, amount, tokenId, isManual } = params.body
    let firebaseEntry = await getActionRequiredTxDoc({ userAddress, burnTransactionHash })
    if (firebaseEntry.status === 2) {
      if (!isManual) {
        let trasnsactions = await fire.collection('userInfos').doc(userAddress.toLowerCase()).collection('actionRequiredTx').where('amount', '==', amount).where('tokenId', '==', tokenId).where('transactionStatus', '==', -1).get()
        for (const transaction of trasnsactions.docs) {
          const txHash = transaction.data().txHash
          await fire.collection('userInfos').doc(userAddress.toLowerCase()).collection('actionRequiredTx').doc(txHash).update({
            transactionStatus: -21,
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
          })
        }
      }

      let newFirebaseEntry = await fire.collection('userInfos').doc(userAddress.toLowerCase()).collection('actionRequiredTx').doc(burnTransactionHash.toLowerCase()).set({
        wappId: 'polygon wallet',
        txHash: burnTransactionHash.toLowerCase(),
        amount: amount,
        tokenId: tokenId,
        isPoS: true,
        transactionStatus: -3,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      })

      return { success: true, result: newFirebaseEntry }
    } else {
      return firebaseEntry
    }
  } catch (error) {
    console.log('error in adding firebase entry', error)
    return { success: false, status: 0 }
  }
}

export const getAndSavePoSTokenIdMappings = async() => {
  try {
    let mappings = await fire.collection('posERC20TokenList').get()
    const bulk = TokenMappings.collection.initializeUnorderedBulkOp()

    for (const doc of mappings.docs) {
      const data = {
        rootTokenAddress: doc.data().addresses['1'].toLowerCase(),
        childTokenAddress: doc.data().addresses['137'].toLowerCase(),
        name: doc.data().name,
        symbol: doc.data().symbol,
        decimals: doc.data().decimals,
        tokenId: doc.data().id
      }
      bulk.find({ childTokenAddress: doc.data().addresses['137'] }).upsert().update({ $set: data })
    }
    await bulk.execute()
    console.log('Complete token mapper syncing')
  } catch (error) {
    console.log('error in saving tokenmappings entry', error)
    return { success: false, status: 0 }
  }
}
