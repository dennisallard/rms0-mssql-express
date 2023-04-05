'use strict';

const dotenv = require('dotenv');
const assert = require('assert');

dotenv.config();

const {API_PORT, API_HOST, API_HOST_URL, SQL_USER, SQL_PASSWORD, SQL_DATABASE, SQL_SERVER, SQL_PORT} = process.env;

console.log(
    'DEBUG: [API_PORT, API_HOST, API_HOST_URL, SQL_USER, SQL_PASSWORD, SQL_DATABASE, SQL_SERVER, SQL_PORT] =\n' +
    JSON.stringify([API_PORT, API_HOST, API_HOST_URL, SQL_USER, SQL_PASSWORD, SQL_DATABASE, SQL_SERVER, SQL_PORT])
)

const sqlEncrypt = process.env.SQL_ENCRYPT === "true";

assert(API_PORT, 'API_PORT is required');
assert(API_HOST, 'API_HOST is required');

const config = {
    // express:
    apiport: Number(API_PORT),
    host: API_HOST,
    url: API_HOST_URL,
    // sql:
    user: SQL_USER,
    password: SQL_PASSWORD,
    server: SQL_SERVER,
    database: SQL_DATABASE,
    options: {
        port: Number(SQL_PORT),
        trustedconnection: true,
        enableArithAbort: true,
        encrypt: sqlEncrypt
        }
};

module.exports = config;