const express = require('express');
const mysql = require('mysql');
const sharp = require ('sharp');

//Variables used for image generation
var filePath = '/Users/wgcsa/PROJECT Bin Number Locator/images';
var warehouseImage = '/WarehouseLayout_Base.png';
var marker = '/fill.png';
var combined = '/combined.png';

//Create connection to MySQL server
const db = mysql.createConnection({
    host     : "localhost",
    user     : "root",
    password : "Password",
    database : "warehousebins"
});

//Connect and query warehouse server to return location of bin
db.connect(function(err) {
    if (err) throw err;
    console.log('MySQL Connected....');
});

//Create local environment for testing at port 3000
const port = process.env.PORT || 3000
const app = express();

//Receive web request and validate
app.get('/warehouse', function(req, res) {
    const binnumber = req.query.binnumber;

    db.query("SELECT bin_x_coord, bin_y_coord FROM warehousebins.bin_location WHERE bin_number = '" + binnumber + "'", function (err, result, fields) 
    {
        if (err) 
        {
            throw err;
        }
        else if (result[0] == undefined) 
        {
            res.send("<h1>Page not found on the server</h1>");
            console.log('Requested bin number ' + binnumber);
        }
        else 
        { 
            sharp(filePath + warehouseImage).composite([
                { 
                    input: filePath + marker,
                    left: result[0].bin_x_coord, top: result[0].bin_y_coord
                }
            ]).toFile(filePath + combined);
            
            res.setHeader('content-type', 'image/png');
            res.sendFile(filePath + combined, function (err) 
            {
                if (err) throw err;
                console.log('image sent');
                console.log(result);
            });
        }
    });
});

app.listen(port, () => {
    console.log('Server started on port 3000');
});