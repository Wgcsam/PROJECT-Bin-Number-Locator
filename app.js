const express = require('express');
const mysql = require('mysql');

//Create connection to MySQL server
const db = mysql.createConnection({
    host     : "localhost",
    user     : "root",
    password : "Password",
    database : "warehousebins"
});

const port = process.env.PORT || 3000

const app = express();

app.get('/warehouse', function(req, res) {
    const binnumber = req.query.binnumber;

    res.send({
        'bin_number': binnumber
    });

    //Connect and query warehouse server to return location of bin
    db.connect(function(err) {
        if (err) throw err;
        console.log('MySQL Connected....');
        db.query("SELECT bin_column, bin_row FROM warehousebins.bin_location WHERE bin_number = '" + binnumber + "'", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        })
    });
});

app.listen(port, () => {
    console.log('Server started on port 3000');
});