
require('dotenv').config();
const https = require('https');
const app = require('./app');
const fs = require('fs');

const port = process.env.BASE_PORT;

const server = https.createServer({
    key: fs.readFileSync('keys/privatekey.pem'),
    cert: fs.readFileSync('keys/certificate.pem')
}, app);

server.listen(port);
