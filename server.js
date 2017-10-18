'use strict'

var express = require('express');
var app = express();
var mcache = require('memory-cache');
var bodyParser = require('body-parser');
var redis = require("redis"),
  client = redis.createClient();

client.on("error", function (err) {
  console.log("Error " + err);
});

setInterval(() => client.set("foo_rand000000000000", new Date()), 5000)

app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

var cache = (duration) => {
  return (req, res, next) => {

    console.log(req.headers)
    // let key = '__express__' + req.originalUrl || req.url
    // let cachedBody = mcache.get(key)
    // if (cachedBody) {
    //   res.send(cachedBody)
    //   return
    // } else {
    //   res.sendResponse = res.send
    //   res.send = (body) => {
    //     mcache.put(key, body, duration * 1000);
    //     res.sendResponse(body)
    //   }
    //   next()
    // }
    next()
  }
}

app.get('/', cache(10), (req, res) => {
  setTimeout(() => {
    res.render('index', {
      title: 'Hey',
      message: 'Hello there',
      date: new Date()
    })
  }, 5000) //setTimeout was used to simulate a slow processing request
})

app.get('/redis', cache(10), (req, res) => {

  client.get("foo_rand000000000000", function (err, reply2) {
    // console.log(reply)
    let key = 'Last-Modified' + req.originalUrl || req.url


    client.get(key, function (err, reply) {
      
      let t = new Date().toUTCString()
      console.log(req.headers['if-modified-since'])
      if (req.headers['if-modified-since'] != reply) {

        res.setHeader("Last-Modified", reply);
        
        res.setHeader("Cache-Control", "public,max-age=60000");
        // res.status(412).end("412")
        res.send(reply2)
      } else {

        client.set(key, t)
        res.setHeader("Last-Modified", t);
        res.setHeader("Cache-Control", "max-age=60000");
        client.set("foo_rand000000000000", t)
        res.send(t); // Will print `OK`
      }
    })



  });

})

// app.get('/redis', (req, res) => {
//   client.get("foo_rand000000000000", function (err, reply) {
//     console.log(reply)
//     res.send(reply.toString()); // Will print `OK`

//   });
// })

app.get('/user/:id', cache(10), (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=2592000");
  res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
  // res.setHeader("Pragma", 'no-cache');
  setTimeout(() => {
    if (req.params.id == 1) {
      res.json({
        id: 1,
        name: "John"
      })
    } else if (req.params.id == 2) {
      res.json({
        id: 2,
        name: "Bob"
      })
    } else if (req.params.id == 3) {
      res.json({
        id: 3,
        name: "Stuart"
      })
    }
  }, 1000) //setTimeout was used to simulate a slow processing request
})

app.use((req, res) => {
  res.status(404).send('') //not found
})

app.listen(3000, function () {
  console.log(`Example app listening on port 3000`)
})