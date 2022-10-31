require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const urlPrefix = process.env.BASE_API_PREFIX;
const connectionString = process.env.MONGO_CONNECTION_STRING;
const fs = require('fs');
const cert = fs.readFileSync('keys/certificate.pem');

//register models
require('./models/card');
require('./models/board');
require('./models/user');

app.use(express.json());

app.use((reg,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods', '*');
    next();
});

const userRoutes = require('./routes/user');
const boardRoutes = require('./routes/board');
const cardRoutes = require('./routes/card');

console.log("Connecting to database...");

mongoose.connect(connectionString, {ssl: true, sslValidate: false, sslCA: 'keys/certificate.pem', useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log('Connected to database');
    })
    .catch(err => {
        console.log('Connection failed');
        console.error(err);
    });

// user routes
app.use(urlPrefix + '/user', userRoutes);

// board routes
app.use(urlPrefix + '/board', boardRoutes);

// card routes
app.use(urlPrefix + '/card', cardRoutes);

module.exports = app;
