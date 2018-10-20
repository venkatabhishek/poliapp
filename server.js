var express = require('express')
var algoliasearch = require('algoliasearch');
var mustacheExpress = require('mustache-express');

var app = express()

app.use(express.static('assets'))
// mustache templates
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/pages');

var port = process.env.PORT || 3000;

//algolia
var client = algoliasearch('XAGTGFII4B', 'aa7ab17a50f876c8a57b6132f33d8861');
var index = client.initIndex('politics');


app.get("/", (req, res) => {
  res.render("home");
})

app.get("/events", (req, res) => {
  res.render("events")
})

app.get("/bills", (req, res)=>{
  res.render("bills")
})

app.get("/about", (req, res) => {
  res.render("about")
})

app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/people", (req, res) => {
  var browser = index.browseAll();
  var hits = [];

  browser.on('result', function onResult(content) {
    hits = hits.concat(content.hits);
  });

  browser.on('end', function onEnd() {
    res.render('people', {people: hits})
  });

  browser.on('error', function onError(err) {
    throw err;
  });

})

app.post("/legislators/search", (req, res) => {

})

app.listen(port, () =>{
  console.log(`App listening on port ${port}`)
})
