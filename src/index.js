/* eslint-disable quotes,semi */
import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import cors from 'cors'
import Web3 from 'web3'

// Routes
import routes from './routes'

// import logger from './logger'

// SWAGGER
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const { schedule } = require('node-cron')
const { getAndSavePosDepositTransactions, getAndSaveDepositEtherTransaction } = require('./services/root-deposit')
const { getAndSavePosExitTransactions } = require('./services/root-exit')
const { getAndSavePlasmaExits, updatePlasmaExits } = require('./services/plasma-exits')
const { getAndSavePoSTokenIdMappings } = require('./services/fire')
const { findUserBurnTransactions, findPastBurnLogs } = require('./services/user-transaction')

export const mainnetWeb3 = new Web3(process.env.NETWORK_PROVIDER)

const mongoose = require('mongoose')

// DB connection
const connectDb = async() => {
  if (process.env.NODE_ENV === 'local') {
    await mongoose.connect(process.env.MONGO_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }).then(console.log('Connected to DB'))
  } else {
    await mongoose.connect(process.env.MONGO_CONNECTION_PROD, { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, sslCA: [fs.readFileSync('rds-combined-ca-bundle.pem')] }).then(console.log('Connected to DB'))
  }
}

// created express server
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: '1.0.0',
      title: 'Nonce tracker V1',
      description: 'API Information For Nonce Tracker.',
      contact: {
        name: 'Vamsi Reddy'
      },
      servers: ['http://localhost:3000']
    }
  },
  apis: ["./src/routes/*.js"]
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

console.log(swaggerDocs)
console.log(swaggerDocs.paths)

// api router
app.use('/api/v1', routes)

// Start Server
app.listen(process.env.PORT, function() {
  console.log('Nonce Tracker Has been started')
})

// Initialisation and Syncing Function
const initialise = async() => {
  await connectDb()
  await findPastBurnLogs({userAddress:"0xfd71dc9721d9ddcf0480a582927c3dcd42f3064c"})
  try {
    await getAndSavePoSTokenIdMappings()
  } catch (error) {
    console.log("error in saving mapping details")
  }

  try {
    await getAndSavePlasmaExits()
  } catch (error) {
    console.log("error in syncing plasma exits")
  }

  try {
    await getAndSaveDepositEtherTransaction()
  } catch (error) {
    console.log("error in getether", error)
  }

  try {
    await getAndSavePosExitTransactions()
    console.log("Syncing of Exits done")
  } catch (error) {
    console.log("error in syncing root exits")
  }

  try {
    await getAndSavePosDepositTransactions()
    console.log("Syncing of Deposits done")
  } catch (error) {
    console.log("error in syncing root deposits")
  }

  try {
    await updatePlasmaExits()
    console.log("Updating plasma exits done.")
  } catch (error) {
    console.log("error in updating plasma exits")
  }
  schedule('0 */1 * * *', getAndSavePlasmaExits)
  schedule('0 */10 * * * *', getAndSaveDepositEtherTransaction)
  schedule('0 */5 * * * *', getAndSavePosDepositTransactions)
  schedule('0 */2 * * * *', getAndSavePosExitTransactions)
  schedule('0 */1 * * *', updatePlasmaExits)
}

initialise()
