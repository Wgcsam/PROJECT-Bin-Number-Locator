const express = require('express');
const mysql = require('mysql');
const sharp = require ('sharp');
const fs = require("fs");
const { response } = require('express');
require('dotenv').config();

//Variables used for image generation
var warehouseImage = './images/WarehouseLayout_New.png';

let db = null;

if (process.env.DB_NAME != undefined || process.env.DB_NAME.length === 0) {
    mysql.createConnection({
        host     : process.env.DB_NAME,
        user     : process.env.DB_USER,
        password : process.env.DB_PASS,
        database : process.env.DB_BASE
    });
} else {
    mysql.createConnection({
        socketPath : process.env.DB_SOCKET,
        user     : process.env.DB_USER,
        password : process.env.DB_PASS,
        database : process.env.DB_BASE
    });
}


//Connect and query warehouse server to return location of bin
db.connect(function(err) {
    if (err) throw err;
    console.log('MySQL Connected....');
});

//Create local environment for testing at port 3000
const port = process.env.PORT || 3000
const app = express();

app.enable('trust proxy');

//Receive web request and validate
app.get('/warehouse', function(req, res) {
    const binnumber = req.query.binnumber;
    if (typeof binnumber != "string" || binnumber.length > 5)
    {
        res.send("Invalid parameters!");
        res.end();
        return;
    }
    
    //Query MySQL database for bin using data located in web request
    db.query("SELECT bin_x_coord, bin_y_coord FROM " + process.env.DB_BASE + ".bin_location WHERE bin_number = ?", [binnumber], function (err, result, fields) 
    {
        if (err) 
        {
            throw err;
        }
        else if (result[0] == undefined) 
        {
            res.status(400).send("<h1>Bad request. Page not found on the server</h1>");
            console.log('Requested bin number ' + binnumber);
        }
        else 
        { 
            //create buffer of black marker
            const blackPng = sharp({
                create: {
                    width: 68,
                    height: 72,
                    channels: 3,
                    //use below for solid fill
                    //background: { r: 0, g: 0, b: 0 }
                    //
                    //use below for blurred fill
                    noise: {
                        type: 'gaussian',
                        mean: 40,
                        sigma: 50
                    }
                }
            }).png()
            .toBuffer();
            
            blackPng.then((data) => {
            (async () => {
                const processed = sharp(warehouseImage).composite([
                    { 
                        input: data,
                        //Use data from MySQL to place the marker in the correct spot and generate new image
                        left: result[0].bin_x_coord, top: result[0].bin_y_coord
                    }
                ]).png();
                await processed.toBuffer().then((text) => {
                    res.setHeader('content-type', 'image/png');
                    res.send(text)
                    console.log("success");
                });
            })();
        });
        };
    });
});


app.listen(port, () => {
    console.log('Server started on port 3000');
});