'use strict';
const express = require('express'),
      app     = express(),
      mongoose = require('mongoose'),
      morgan  = require('morgan'),
      bodyParser = require('body-parser'),
      methodOverride = require('method-override'),
      cors       = require('cors');

mongoose.connect('mongodb://test:test@ds049864.mlab.com:49864/factory');
mongoose.connection.on('open', (req, res) => {
  console.log('connected to DB');
});

// Config
app
  .use(morgan('dev'))
  .use(bodyParser.urlencoded({'extended': 'true'}))
  .use(bodyParser.json())
  .use(bodyParser.json({type: 'application/vnd.api+json'}))
  .use(methodOverride())
  .use(cors())

  .use( (req, res, next) => {
     res.header("Access-Control-Allow-Origin", "*");
     res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
     next();
  });

// Models
let Room = mongoose.model('Room', {
  room_number: Number,
  type: String,
  beds: Number,
  max_occupancy: Number,
  cost_per_night: Number,
  reserved: [
    {
      from: String,
      to: String
    }
  ]
});

/*
 * Generate some test data, if no records exist already
 * MAKE SURE TO REMOVE THIS IN PROD ENVIRONMENT
*/

// function getRandomInt(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }
//
// Room.remove({}, function(res){
//     console.log("removed records");
// });
//
// Room.count({}, function(err, count){
//     console.log("Rooms: " + count);
//
//     if(count === 0){
//
//         var recordsToGenerate = 150;
//
//         var roomTypes = [
//             'standard',
//             'villa',
//             'penthouse',
//             'studio'
//         ];
//
//         // For testing purposes, all rooms will be booked out from:
//         // 18th May 2017 to 25th May 2017, and
//         // 29th Jan 2018 to 31 Jan 2018
//
//         for(var i = 0; i < recordsToGenerate; i++){
//             var newRoom = new Room({
//                 room_number: i,
//                 type: roomTypes[getRandomInt(0,3)],
//                 beds: getRandomInt(1, 6),
//                 max_occupancy: getRandomInt(1, 8),
//                 cost_per_night: getRandomInt(50, 500),
//                 reserved: [
//                     {from: '1970-01-01', to: '1970-01-02'},
//                     {from: '2017-04-18', to: '2017-04-23'},
//                     {from: '2018-01-29', to: '2018-01-30'}
//                 ]
//             });
//
//             newRoom.save(function(err, doc){
//                 console.log("Created test document: " + doc._id);
//             });
//         }
//
//     }
// });

// Routes

app.post('/api/rooms', (req, res) => {
  Room.find({
    type: req.body.roomType,
    beds: req.body.beds,
    max_occupancy: {$gt: req.body.guests},
    cost_per_night: {$gte: req.body.priceRange.lower, $lte: req.body.priceRange.upper},
    reserved: {
      $not: {
        $elemMatch: {from: {$lte: req.body.to.substring(0,10)}, to: {$gt: req.body.from.substring(0, 10)}}
      }
    }
  }, (err, rooms) => {
    if (err)
      res.send(err);
    else
      res.json(rooms);
  });
});

app.post('/api/rooms/reserve', (req, res) => {
  console.log(req.body._id);

  Room.findByIdAndUpdate(req.body._id, {
    $push: {'reserved': {from: req.body.from, to: req.body.to}}
  }, {
    safe: true,
    new: true
  }, (err, room) => {
    if (err)
      res.send(err)
    else
      res.json(room);
  });
});

app.listen(3000);
console.log('App running on localhost:3000');
