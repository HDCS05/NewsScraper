/* Showing Mongoose's "Populated" Method
 * =============================================== */

// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
// Requiring our Note and Article models
var Note = require("./models/note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
var port = process.env.PORT || 3000;
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

var result = [];

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
//mongoose.connect("mongodb://localhost/hwScrapedData");
//mongoose.connect("mongodb://heroku_psmm8d9c:5hgpgisngk163uepdrve9vblja@ds147034.mlab.com:47034/heroku_psmm8d9c");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/hwScrapedData",
  {
    useMongoClient: true
  }
);
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Set Handlebars.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// Routes
// ======

app.get("/", function(req, res) {
    res.render("index");
});


// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
 
  request("http://www.npr.org/sections/politics-pop-culture/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    // Save an empty result object
    //result = [];
    $(".item-info").each(function(i, element) {

      var vtitle = $(this).children("h2").children("a").text();
      var vlink = $(this).children("h2").children("a").attr("href");
      var vdescription = $(this).children("p").children("a").text();
      var vid = i;

      result.push({
        id: vid,
        title: vtitle,
        link: vlink,
        description: vdescription
      });

    });
    var hbsObject = {
      scrapednews: result
    };
    //console.log(result);
    res.render("scraped", hbsObject);
  });
  // Tell the browser that we finished scraping the text
  //res.render("scraped", result);
  //res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/savedArticles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      var hbsObject = {
        oSavedNews: doc
      };
      //res.json(doc);
      res.render("savednews",hbsObject);
    }
  });
});

// When save article button is clicked
app.post("/:id", function(req, res) {

  //create empty array
  var oData = {};

  //this logs were used to test the values of the form
  //console.log("-----------------" + req)
  // console.log("");
  // console.log("1-----------------------")
  // console.log(req.body.inputTitle);
  // console.log("2-----------------------")
  // console.log(req.body.inputLink);
  // console.log("3-----------------------")
  // console.log(req.body.inputDescription);
  // console.log("4-----------------------")
  // console.log(req.body);
  // console.log("----------------------")
  // console.log("");
  
  //do not use the following lines was to test values of the array
  //var vindex = req.params.id
  // oData.title = result[vindex].title;
  // oData.link = result[vindex].link;
  // oData.description = result[vindex].description;
  // var entry = new Article(oData);
  // console.log(oData.title);
  // console.log(oData.link);
  // console.log(oData.description);
  // console.log("-----------------" + oData);

  // Using our Article model, create a new entry
  // This effectively passes the result object to the entry (and the title and link)
  oData.title = req.body.inputTitle;
  oData.link = req.body.inputLink;
  oData.description = req.body.inputDescription;
  var entry = new Article(oData);

  // Now, save that entry to the db
  entry.save(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    }
    // Or log the doc
    else {
      //console.log(doc);
      res.redirect("/savedArticles");
    }
  });

});



// Listen on port defined at the top
app.listen(port, function() {
  console.log("App running on port 3000!");
});
