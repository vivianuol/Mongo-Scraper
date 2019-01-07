var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");


var PORT = 5000;

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongoscraper", { useNewUrlParser: true });

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
app.get("/", function (req, res) {
    res.sendFile("/assets/index.html")
})

app.get("/api/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.nytimes.com/section/world").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);
        console.log("after cheerio" + $(".story-body").length);
        // Now, we grab every headline and summary within an article tag, and do the following:

        var results = [];

        $(".story-body").each(function (i, element) {

            // Save an empty result object
            var result = {
                headline: "",
                summary: ""
            };

            console.log($(this));
            // Add the text and href of every link, and save them as properties of the result object
            result.headline = $(this)
                .find(".headline > a").text().replace(/ +/g, " ");
            result.summary = $(this).find(" .summary").text().replace(/ +/g, " ");

            console.log("result: " + result)
            // Create a new Article using the `result` object built from scraping


            results.push(result);
            // Send a message to the client

        });
        res.json(results);

    });

});

app.post("/api/articles", function (req, res) {
    db.Article.create(req.body).then(function (dbArticle) {
        console.log("dbArticle: " + dbArticle);
        res.json(dbArticle);
    }).catch(function (err) {
        console.log(err);
    });

})

// app.post("/api/notes", function (req, res) {
//     db.Note.create(req.body).then(function (dbNote) {
//         console.log("dbNote: " + dbNote);
//         res.json(dbNote);
//     }).catch(function (err) {
//         console.log(err);
//     });

// })

// Route for saving/updating an Article's associated Note
app.post("/articles/:thisId", function (req, res) {

    console.log(req.params.thisId)
    console.log(req.body)

    db.Article.findById(req.params.thisId, function(err, dbArticle) {
        if (dbArticle.note){
            db.Note.deleteOne({_id: dbArticle.note})
        }
    }).then(function(){
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)})
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            
            console.log(dbNote._id)
            console.log(dbNote.noteContent)

            return db.Article.findOneAndUpdate({ _id: req.params.thisId }, { note: dbNote._id }, { new: true });

        }).then(function(dbArticle) {
            return db.Note.findById(dbArticle.note);
        })
        .then(function (dbNote) {
            // If we were able to successfully update an Article, send it back to the client
            console.log(dbNote)
            res.json(dbNote);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/api/clear", function (req, res) {
    res.json("get it.")
})

app.get("/saved", function (req, res) {
    db.Article.find({})
    .populate("note")
    .then(function (dbArticle) {
        var objs = {
            articles: dbArticle
        };
        console.log(objs);
        res.render("abc", objs)
    }).catch(function (err) {
        res.json(err);
    });
});


app.delete("/article/delete/:id", function (req, res) {
    console.log(req.params.id);
    db.Article.findByIdAndDelete(req.params.id, function (err) {
        if (!err)
            res.send("article been deleted")
    })

})


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});