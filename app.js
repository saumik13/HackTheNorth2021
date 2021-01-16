let express = require("express");
app = express();
let Sequelize = require('sequelize-cockroachdb');
//let fs = require('fs');
let bodyParser =    require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//new
var async = require('async');
var fs = require('fs');
var pg = require('pg');

//creating data directory for input.txt and questions.json
var dir = 'data/';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// Connect to the bank database.

var config = {
    user: 'arjuns',
    password: 'arjunhackthenorth',
    host: 'free-tier.gcp-us-central1.cockroachlabs.cloud',
    database: 'pastel-vole-236.bank',
    port: 26257,
    ssl: {
        ca: fs.readFileSync('ssl/certs/cc-ca.crt')
            .toString(),
        key: fs.readFileSync('ssl/certs/client.arjuns.key')
            .toString(),
        cert: fs.readFileSync('ssl/certs/client.arjuns.crt')
            .toString()
    }
};

//end new

app.use("/css/",express.static("css"));
app.use("/front-end/assets",express.static("front-end/assets"));
app.use("/front-end", express.static("front-end"));
app.use("/ssl", express.static("ssl"));

app.set("view engine", "ejs");

app.get("/", function (req,res) {
    console.log(__dirname +"/index.html");
    res.sendFile(__dirname +"/front-end/landing.html");

});

//Passing the URI string
/*
let URI = "postgres://abdulrahman:d1dkUYmnI1dqkSmY@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/pastel-vole-236.defaultdb?sslmode=verify-full&sslrootcert=cc-ca.crt/cc-ca.crt"
let cert_dir = __dirname + "/ssl/cc-ca.crt";
console.log(cert_dir);

 const sequelize = new Sequelize('postgres://abdulrahman:d1dkUYmnI1dqkSmY@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/pastel-vole-236.defaultdb?sslmode=verify-full&sslrootcert=' + cert_dir);
*/
// sequelize.authenticate();
// const User = sequelize.define('User', {
//     // Model attributes are defined here
//     firstName: {
//         type: String,
//         allowNull: false
//     },
//     lastName: {
//         type: String
//         // allowNull defaults to true
//     }
// }, {
//     // Other model options go here
// });
// sequelize.query('show tables').then(function(rows) {
//     console.log(JSON.stringify(rows));
// });
//
// // `sequelize.define` also returns the model
// console.log(User === sequelize.models.User); // true
// try {
//     sequelize.authenticate();
//     console.log('Connection has been established successfully.');
// } catch (error) {
//     console.error('Unable to connect to the database:', error);
// }
app.get("/start", function (req,res){
    res.render("start");
})

//trying it oout the oop way
// Connect to CockroachDB through Sequelize.
// let sequelize = new Sequelize('defaultdb', 'abdulrahman', 'Ilovebangladesh', {
//     host: 'free-tier.gcp-us-central1.cockroachlabs.cloud/pastel-vole',
//     dialect: 'postgres',
//     port: 26257,
//     logging: false,
//     dialectOptions: {
//         ssl: {
//             ca: fs.readFileSync('ssl/cc-ca.crt')
//                 .toString()
//         }
//     }
// });




// let dialectOptions = {
//     ssl: {
//         ca: fs.readFileSync("ssl/cc-ca.crt")
//             .toString()
//     }
// }


var pool = new pg.Pool(config);

pool.connect(function (err, client, done) {

    // Close communication with the database and exit.
    var finish = function () {
        done();
        process.exit();
    };

    if (err) {
        console.error('could not connect to cockroachdb', err);
        finish();
    }

    async.waterfall([
            function (next) {
                // Create the 'accounts' table.
                client.query('CREATE TABLE IF NOT EXISTS qna (question TEXT, ans TEXT not null);', next);
            },

            function (results, next) {
                // Insert two rows into the 'accounts' table.
                client.query("INSERT INTO qna VALUES ('What does the fox say\?', 'eueue');",next);
            },//, ("What does the fox say\?", "Eeueue");
            function (results, next) {
                // Print out account balances.
                client.query('SELECT question, ans FROM qna;', next);
            },
        ],
        function (err, results) {
            if (err) {
                console.error('Error inserting into and selecting from qna: ', err);
                finish();
            }

            console.log('QnAs:');
            results.rows.forEach(function (row) {
                console.log(row);
            });

            finish();
        });




//form sends the string here when submit is pressed
app.post("/makeq", function (req,res) {
    //console.log(req.body.notes);
    //writing file (sync, sorry)
    fs.writeFileSync('data/' + "input.txt", req.body.notes, 'ascii', function (err) {
        if (err) return console.log(err);
        console.log("Text written to "+  "input.txt");
    });
    //running python (sync again, sorry)
    console.log("Python running now");
    const exec = require("child_process").execSync;
    exec("python3 question_generation/generate_json.py input.txt");

    
    
})


//ACTION ON SDK PART

const {
    dialogflow,
    actionssdk,
    Image,
    Table,
    Carousel,
} = require('actions-on-google');
// const express = require('express');
// const bodyParser = require('body-parser');

// const app = dialogflow();

// app.intent('Default Welcome Intent', (conv) => {
//     conv.ask('How are you?');
//   });

// app.intent('bye', (conv) => {
//     conv.close('See you later!');
//   });

const {
    conversation
} = require('@assistant/conversation');
const { CANCELLED } = require("dns");

// Create an app instance
const appGoogle = conversation();

// Register handlers for Actions SDK

appGoogle.handle('handler', conv => {
    conv.add('Hi, how is it going?')
    conv.add(new Image({
        url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
        alt: 'A cat',
    }))
})

app.post('/fulfillment', appGoogle);




const HEROKU_PORT = process.env.PORT;

app.listen(3000, function (){
    console.log("Server started");
})