/* eslint-disable quotes,semi */
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import Web3 from 'web3'

// Routes
import routes from './routes'
// import logger from './logger'

// SWAGGER
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const { schedule } = require('node-cron')
const { getAndSavePosDepositTransactions } = require('./services/root-deposit')
const { getAndSavePosExitTransactions } = require('./services/root-exit')

export const mainnetWeb3 = new Web3(process.env.NETWORK_PROVIDER)

const mongoose = require('mongoose')

// DB connection
mongoose.connect(process.env.MONGO_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }).then(console.log('Connected to DB'))

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
  try {
    await getAndSavePosDepositTransactions()
    console.log("Syncing of Deposits done")
  } catch (error) {
    console.log("error in syncing root deposits")
  }

  try {
    await getAndSavePosExitTransactions()
    console.log("Syncing of Exits done")
  } catch (error) {
    console.log("error in syncing root exits")
  }

  schedule('*/20 * * * *', getAndSavePosDepositTransactions)
  schedule('*/20 * * * *', getAndSavePosExitTransactions)
}

initialise()
