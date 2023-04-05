var Customer = require('./customer');
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

var apiport = process.env.API_PORT || 3000
app.listen(apiport)
console.log('Customer Express API is listening on port ' + apiport)

console.log('=================================================')