
import express from 'express'
//// import bodyParser from 'body-parser'  //dga- needed for POST - not needed for GET
import cors from 'cors'  //dga- do we need this?

import crimesRouter from './routes/crimes.js'
////import ccadRouter from './routes/ccad.js'
import afdrRouter from './routes/afdr.js'

import dotenv from 'dotenv'
dotenv.config()  // loads .env file into process.env

async function startApp() {

    const app = express()

    //// app.use(bodyParser.urlencoded({ extended: true}))  //dga- needed for POST - not needed for GET
    //// app.use(bodyParser.json())  //dga- needed for POST - not needed for GET
    app.use(cors())  //dga- do we need this?

    //// Maybe for future use to authenticate via JWT or other means
    ////app.use((req, res, next) => {
    ////    console.log('middleware executes here, e.g. to authenticate via JWT')
    ////    next()
    ////})

    // Mount the routers
    app.use('/api/crimes', crimesRouter)
    ////app.use('/api/ccad', ccadRouter)  //dga- not yet implemented
    app.use('/api/afdr', afdrRouter)

    app.route('*').get((req, res) => {
        console.log('DEBUG: req.url = ' + req.url)
        res.write('{ "error" : "Only endpoints supported are /api/crimes and almost /api/ccad" }')
        res.end()
    })

    // Start the API server
    var apiport = process.env.API_PORT || 3000
    console.log('=================================================')
    try {
        app.listen(apiport).on('error', (err) => {  // listen on the port
            console.log('ERROR: ' + err)
            console.log('=================================================')
            console.log('Exiting...')
        })
        console.log('RMS Express API is listening on port ' + apiport)
    } catch (err) {
        console.log('ERROR: ' + err)
        console.log('=================================================')
        console.log('Exiting...')
    }
}

startApp().catch((err) => {
    console.error('Error starting the app: ' + err)
    console.error('Exiting...')
})