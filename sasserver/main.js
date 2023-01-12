/*©lgpl**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the LGPL License, *
* found in the file license_lgpl.txt.                                           *
*                                                                              *
*****************************************************************************©*/

"use strict"; // Optional. You will see this name in eg. 'ps' or 'top' command

const WebsocketServer = require('./WebsocketServer.js');
var mysql = require('promise-mysql2');
//var mysql = require('mysql');
const SASManager = require('./SASManager.js');
const util = require('util');
const Database = require('./Database.js');
const {
    networkInterfaces
} = require('os');
const crypto = require('crypto');
const Config = require('./config.js');


var db; // database
var SERVER_ID = "1";

class Main {

    constructor(dbcon, config) {

        this.config = config;
        this.id = 'id_1';
        this.websocketServer = null
        this.dbcon = dbcon;
        this.websocketport = config.data.websockets.port;
        this.secured = config.data.websockets.secured;
        this.sslCertPath = config.data.websockets.sslCertPath; // "../cfg/crt/certificate.pem";
        this.sslKeyPath = config.data.websockets.sslKeyPath; // "../cfg/crt/key.pem";
        db = dbcon;

        let macs = JSON.stringify(require('os').networkInterfaces(), null, 2).match(/"mac": ".*?"/g).toString().match(/\w\w:\w\w:\w\w:\w\w:\w\w:\w\w/g);
        let hash = crypto.createHash('md5').update(macs.toString()).digest("hex");
        SERVER_ID = hash;

        this.SASManager = new SASManager(SERVER_ID, dbcon);
        this.Databae = new Database(db);

        //
        // Create FSASServer table if neccessary
        // and add current server to list
        //

        Database.createServer(SERVER_ID, config.data.ip);
    }

    //
    //
    //

    set name(name) {
        this._name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    //
    //
    //

    get name() {
        return this._name;
    }

    //
    //
    //

    runMain() {
        console.log("SASManager: " + this.SASManager);
        this.websocketServer = new WebsocketServer(this);
        console.log('Hello, my name is ' + this.name + ', I have ID: ' + this.id);
    }
}

const fs = require('fs');

//
// Read configuration
//

var rawdata
// default configuration
var config = "";

config = Config;

try {
    if (config.data.ip == "current") {
        const nets = networkInterfaces();
        const results = Object.create(null); // Or just '{}', an empty object

        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
                const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
                if (net.family === familyV4Value && !net.internal) {
                    if (!results[name]) {
                        results[name] = [];
                    }
                    results[name].push(net.address);
                }
            }
        }
        console.log("IP output: " + JSON.stringify(results));
    }
} catch (err) {
    console.log("Error while getting ip address: " + err);
}


console.log("Connect to host: " + config.data.database.host);


var connectionPool = mysql.createPool({
    connectionLimit: 100,
    host: config.data.database.host,
    user: config.data.database.user,
    password: config.data.database.password,
    database: config.data.database.name,
    waitForConnections: true

});
//debug: true

connectionPool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
        console.log("connection err: " + err);
    } else {
        //if (connection) connection.release()
        console.log("connection NO err");
    }
    return
});

const connection = connectionPool.getConnection();

console.log('connection : ' + connection);

console.log("Main start " + config.data.websockets.port);

var main = new Main(connectionPool, config);
main.runMain();
