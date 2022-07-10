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

    //Query MySQL database for bin using data located in web request
    db.query("SELECT bin_x_coord, bin_y_coord FROM warehousebins.bin_location WHERE bin_number = '" + binnumber + "'", function (err, result, fields) 
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
            //Asynchronously begin image generation
            (async () => {
                const processed = sharp(filePath + warehouseImage).composite([
                    { 
                        //Use data from MySQL to place the marker in the correct spot and generate new image
                        input: filePath + marker,
                        left: result[0].bin_x_coord, top: result[0].bin_y_coord
                    }
                ]);
                //Ensure new image is saved before returning result to user
                await processed.toFile(filePath + combined).then(() => {
                    //Set http header for png and send to user
                    res.setHeader('content-type', 'image/png');
                    res.sendFile(filePath + combined, function (err) 
                    {
                        if (err) throw err;
                        console.log('image sent');
                        console.log(result);
                    });
                });
            })();
        }
    });
});

app.listen(port, () => {
    console.log('Server started on port 3000');
});