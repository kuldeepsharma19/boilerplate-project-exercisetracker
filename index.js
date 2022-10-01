const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let mongodb = require("mongodb");

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

  mongoose.connect(process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

let etSchema1 = new mongoose.Schema({
  description: { type: String, required: true },
    duration: { type: Number, required: true },
  date: Date
  
}, {_id: false});
let etSchema2 = new mongoose.Schema({
  username: String,
  log: [etSchema1],
});

let Exercise = mongoose.model("Exercise", etSchema1);
let Subscriber = mongoose.model("Subscriber", etSchema2);

//to create a new user
app.post(
  "/api/users",
  bodyParser.urlencoded({ extended: false }),
  (request, response) => {
    let newuser = new Subscriber({ username: request.body.username });

    newuser.save((error, data) => {
      if (!error) {
        response.json({ username: data.username, _id: data._id });
      }
    });
  }
);
//to get list of all users with their username and id
app.get("/api/users", (request, response) => {
  Subscriber.find({}).exec((error, data) => {
    if (error) {
      console.log(error);
    } else {
      response.json(data);
    }
  });
});
//to return user object with the exercise fields added
app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  (request, response) => {
    let addExercise = new Exercise({
     description: request.body.description, 
      duration: request.body.duration,
      date: request.body.date
      
    });

    if (addExercise.date === "") {
      addExercise.date = new Date().toISOString().substring(0, 10); // substring() is being used to get only the date and not time
    }

    addExercise.date = new Date(addExercise.date).toDateString()

    Subscriber.findByIdAndUpdate(
      request.params._id,
      { $push: { log: addExercise } },
      { new: true },
      (error, data) => {
        if (!error) {
          let resObj = {}
          resObj['_id'] =  request.params._id
          resObj['username'] =  data.username
          resObj['date'] = new Date(addExercise.date).toDateString()
          resObj['duration'] = addExercise.duration
          resObj['description'] = addExercise.description          
          response.json(resObj);
        }
      }
    );
  }
);
//GET request to retrieve a full exercise log of any user
app.get('/api/users/:_id/logs', (request, response) => {
  let resObj = {}
  let _id = request.params._id
   
  Subscriber
    .findById({_id})
    .exec((error, data) => {
      if (!error) {
          let resObj = {}
          resObj['_id'] =  request.params._id
          resObj['username'] =  data.username
          resObj['count'] = data.log.length
          resObj['log'] = data.log
          response.json(resObj);
        }
    })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
