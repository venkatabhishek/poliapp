var express = require('express')
var algoliasearch = require('algoliasearch');
var mustacheExpress = require('mustache-express');
var bodyParser = require('body-parser')
const request = require('request')
const cheerio = require('cheerio')

var app = express()


app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// mustache templates
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/pages');

app.use(express.static(__dirname+'/assets'))

var port = process.env.PORT || 3000;

//algolia
var client = algoliasearch('XAGTGFII4B', 'aa7ab17a50f876c8a57b6132f33d8861');
var index = client.initIndex('politics');


app.get("/", (req, res) => {
  res.render("home");
})

app.get("/events", (req, res) => {
  var url = "https://www.realclearpolitics.com/";

  request(url, (error, response, html)=>{
    if (error){
      console.log(error)
    }
      var $ = cheerio.load(html);

      var posts = $('.post a')

      posts.slice(0, Math.floor(posts.length/2))

      var tposts = [];
      for(var i = 0; i< posts.length;i++){
        tposts.push({
            href: posts[i].hasOwnProperty("attribs")? posts[i].attribs.href : "",
            name: posts[i].hasOwnProperty("children")? posts[i].children[0].data : "",
          })
      }

      res.render("events", {posts: tposts})
  })


})

app.get("/bills", (req, res)=>{
    res.render("bills")
})

app.post("/bills/search", (req, res)=>{

  var keyword = req.body.keyword;
  request({
    url: "https://api.propublica.org/congress/v1/bills/search.json?query="+keyword,
    headers: {
      "X-API-Key": "35rILKqzq1YGTj4ZPQWUW4gmnnphiqUR1QJo6Y1n"
    }
  }, function(error, response, body){
    if(error){ console.log(error) }
    var body = JSON.parse(body)
    res.render("bills", {bills: body.results[0].bills})
  })


})

app.get("/about", (req, res) => {
  res.render("about")
})

app.post("/register/search", (req, res)=>{


  request("https://www.googleapis.com/civicinfo/v2/voterinfo?key=AIzaSyC0kklmZ1HC2hnwa3wOVG-7AOvlZrk0Ajs&address="+req.body.location, function(error, response, body){
    if(error){
      console.log(error)
    }else{
      body = JSON.parse(body)
      if(body.contests){
        body.contests = body.contests.map(contest => {
          if(contest.type == "Referendum"){
            contest.hasOffice = false;
            contest.showText = true;
          }else{
            contest.hasOffice = true;
            contest.showText = false;
          }

          return contest;
        })
      }

      res.render('register', {pollingLocations: body["pollingLocations"], earlyVoteSites: body["earlyVoteSites"], contests: body['contests'], show: true})

    }

    })

})

app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/people", (req, res) => {
  res.render('people')
})

function wikiImage(url){
    return new Promise((resolve, reject) => {


        request(url, (error, response, body)=>{
          if(error){
            reject(error)
          }

          var $ = cheerio.load(body);

          var img = $(".infobox img")[0];
          resolve("https:"+img.attribs.src);
        })

        })
}

app.post("/people/search", (req, res)=>{
  index.search(req.body.keyword, function(err, content) {

    var hts = content.hits.map(item => {
      item.terms = item.terms[item.terms.length-1]

      var wiki = (item.id.wikipedia).replace(" ","_");

      var url = "https://en.wikipedia.org/wiki/"+wiki;


      return wikiImage(url).then(wurl => {
        item.imgurl = wurl;
        return item
      })
    })

    Promise.all(hts)
  .then(results => {
      res.render('people', {people: results})
  })
  .catch(e => {
    console.error(e);
  })


  });
})

app.listen(port, () =>{
  console.log(`App listening on port ${port}`)
})
