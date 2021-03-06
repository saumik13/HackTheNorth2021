let express = require("express");
app = express();
let Sequelize = require('sequelize-cockroachdb');
let async = require('async');
let fs = require('fs');
let pg = require('pg');
let Queue = require('bull');
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let bodyParser =    require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use("/css/",express.static("css"));
app.use("/front-end/assets",express.static("front-end/assets"));
app.use("/front-end", express.static("front-end"));
app.use("/ssl", express.static("ssl"));

app.set("view engine", "ejs");

let workQueue = new Queue('work', REDIS_URL);


//creating data directory for input.txt and questions.json
// let dir = 'data/';
//
// if (!fs.existsSync(dir)){
//     fs.mkdirSync(dir);
// }

// Connect to the bank database.

let config = {
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

let pool = new pg.Pool(config);




app.get("/", function (req,res) {
    console.log(__dirname +"/index.html");
    res.sendFile(__dirname +"/front-end/landing.html");

});

app.get("/start", function (req,res){
    res.render("start");
})

var rows;
var numOfRows;
var i = 0;

app.get("/result", function(req,res){

    let jsonFile = fs.readFileSync('data/questions.json');
    let jsonObject = JSON.parse(jsonFile);

    Object.keys(jsonObject).forEach(function (key){
        let answer_entry = jsonObject[key].answer;
        let question_entry = jsonObject[key].question;

        let query_statement = `INSERT INTO qna VALUES ('${question_entry}', '${answer_entry}');`;

        pool.query(query_statement);
        console.log(query_statement)
        console.log("FILLED UP!");







    });











    res.render("result");

    }
)


// Connecting to CockroachDB using pg


//form sends the string here when submit is pressed
app.post("/makeq", async (req,res) => {
    //console.log(req.body.notes);
    //writing file (sync, sorry)
    fs.writeFileSync('data/' + "input.txt", req.body.notes, 'ascii', function (err) {
        if (err) return console.log(err);
        console.log("Text written to "+  "input.txt");
    });
    //running python (sync again, sorry not sorry)
    console.log("Python running now");
    // const exec = require("child_process").exec;
    // exec("python3 question_generation/generate_json.py input.txt");

     workQueue.add();

    // res.redirect("/result");



    
    
})


//ACTION ON SDK PART ///////////////////////////////



const {
    conversation
} = require('@assistant/conversation');
const { CANCELLED } = require("dns");

// Create an app instance
const appGoogle = conversation();

// Register handlers for Actions SDK


appGoogle.handle('initialize', conv => {


    let query_statement2 = `SELECT * FROM qna ORDER by id ASC`;

    pool.query(query_statement2, (err, result)=> {
        if(err){
            console.log(err);
        }
        rows = result.rows;
        numOfRows = result.rowCount;
        console.log(rows)
        console.log(numOfRows);
    });

})

appGoogle.handle('question', conv => {
    conv.add("Here is the question!");
    conv.add(rows[i].question);
})

appGoogle.handle('answer', conv => {
    conv.add("Here is the answer!");
    conv.add(rows[i].ans);
    i = i + 1;
    if (i >= numOfRows)
    {
        i = 0;
    }

})

app.post('/fulfillment', appGoogle);

//bitch yeah
/////////////////////////////////


const HEROKU_PORT = process.env.PORT;

app.listen(HEROKU_PORT||3000, function (req,res) {
    console.log("Server started.")

});