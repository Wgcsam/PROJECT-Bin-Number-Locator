const express = require('express');
const mysql = require('mysql');

//Create connection to mysql
const db = mysql.createConnection({
    host     : "localhost",
    user     : "root",
    password : "Password",
    database : "warehousebins"
});

var test = "A01A1";

//Connect
db.connect(function(err) {
    if (err) throw err;
    console.log('MySQL Connected....');
    db.query("SELECT bin_column FROM warehousebins.bin_location WHERE bin_number = '" + test + "'", function (err, result, fields) {
        if (err) throw err;
        console.log(result);
    })
});

const app = express();

app.listen('3000', () => {
    console.log('Server started on port 3000);')
});