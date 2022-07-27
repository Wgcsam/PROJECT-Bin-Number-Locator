const express = require('express');
const mysql = require('mysql');
const sharp = require ('sharp');
require('dotenv').config();

//Variables used for image generation
var warehouseImage = './images/WarehouseLayout_New.png';
var errorImage = './images/WarehouseErrorMessage.png';

let db = null;

if ('DB_NAME' in process.env) {
    db = mysql.createConnection({
        host     : process.env.DB_NAME,
        user     : process.env.DB_USER,
        password : process.env.DB_PASS,
        database : process.env.DB_BASE
    });
} else {
    db = mysql.createConnection({
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
    let imageWidth = 3000;
    const binnumber = req.query.binnumber;
    if (req.query.width != null)
    {
        if (parseInt(req.query.width) && !Number(isNaN))
        {
            imageWidth = parseInt(req.query.width);
            console.log(imageWidth);
        }
        else{
            res.send("Invalid parameters!");
            res.end();
            return;
        }
    }

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
            (async () => {
                const errorMessage = sharp(errorImage).resize({width: imageWidth})
                .png();

                await errorMessage.toBuffer().then((text) => {
                    res.setHeader('content-type', 'image/png');
                    res.send(text)
                })
            })();
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
                    background: { r: 0, g: 0, b: 0 }
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
                
                await processed.toBuffer().then((fill) => {
                    (async () => {
                        fill = sharp(fill).resize({width: imageWidth});

                        await fill.toBuffer().then((text) => {
                            res.setHeader('content-type', 'image/png');
                            res.send(text)
                            console.log("success");
                        })
                    })();
                });
            })();
        });
        };
    });
});


app.listen(port, () => {
    console.log('Server started on port 3000');
});