const dboperations = require('./dboperations');

var express = require('express');
var bodyParser = require('body-parser')
var cors = require('cors')
var app = express()
var router = express.Router()

app.use(bodyParser.urlencoded({ extended: true}))
app.use(bodyParser.json())
app.use(cors())
app.use('/api', router)

router.use((req, res, next) => {
    console.log('middleware executes here, e.g. to authenticate via JWT')
    next()
})

router.route('/crimes').get((req, res) => {
    dboperations.getCrimesStream(req, res)
})

router.route('*').get((req, res) => {
    console.log('DEBUG: req.url = ' + req.url)
    res.write('{ "error" : "Invalid URL, only endpoint supported is: crimes/?[arg=...[&arg=...]...]" }')
    res.end()
})

var apiport = process.env.API_PORT || 3000
////app.listen(apiport)
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
