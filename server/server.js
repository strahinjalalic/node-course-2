var env = process.env.NODE_ENV || "development";

console.log("env****", env);

if(env === "development") {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = "mongodb://localhost:27017/TodosApp";
} else if(env === "test") {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = "mongodb://localhost:27017/TodosAppTest"
}

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const {ObjectID} = require("mongodb");
const _ = require("lodash");


app.use(bodyParser.json());

var {mongoose} = require("./db/mongoose");
var {Todo} = require("./models/todo");
var {User} = require("./models/user");

var port = process.env.PORT;


app.post("/todos", (req, res) => {
      // console.log(req.body); //salje se preko postmana
      var todo = new Todo({
      	text: req.body.text//odnosi se na zahtev koji saljemo preko postmana kada sami pisemo "text":"vrednost"
      });
      todo.save().then((doc) => {
      	res.send(doc);
      }, (err) => {
      	res.status(400).send(err);
      });
});


app.get("/todos", (req, res) => {
	Todo.find().then((todos) => {
		res.send({todos})//bolje je slati ovaj niz unutar objekta, jer bi tako mogli da saljemo jos neke stvari u buducnosti, a ako ga ostavimo kao niz(res.send(todos)) => nista necemo moci da saljemo
	}, (err) => {
		res.status(400).send(err);
	})
});


app.get("/todos/:id", (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
      res.status(404).send();
    } else {
      Todo.findById(id).then((todo) => {
            if(!todo) {
                  res.status(404).send();
            } else {
                  res.send({todo});
            }
      }, () => {
            res.status(400).send();
      });
    }
});

app.patch("/todos/:id", (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ["text", "completed"]); //pick() je metod koji nam omogucava da odredimo stvari koje user moze da update-uje => van ova dva property-ja ne moze nista => prvi argument je req.body, jer se izvlace info iz njega, a drugi argument je niz sa stavkama koje zelimo da omogucimo useru da update-uje

  if(!ObjectID.isValid(id)) {
    res.status(404).send();
  }

  if(_.isBoolean(body.completed) && body.completed) {
       body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {//new:true => slicno returnOriginal property-ju
     if(!todo) {
      return res.status(404).send();
     }

     res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  }); 
});

app.delete("/todos/:id", (req, res) => {
  var id = req.params.id;

  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  } 

  Todo.findByIdAndRemove(id).then((todo) => {
    if(!todo) {
      return res.status(404).send();
    } 

     res.status(200).send({todo});
  }, (err) => {
    res.status(400).send();
  });
});

app.post("/users", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);

  var user = new User({
    email: body.email,
    password: body.password
  });

  user.save().then(() => {
    return user.generateAuthToken();//return da bi se chainovao Promise
  }).then((token) => {
    res.header('x-auth', token).send(user); //x-auth je custom header koji sami pravimo, headeri se odnose na http zahteve
  }).catch((e) => {
    res.status(400).send(e);
  });
});



app.listen(port, () => {
	console.log(`Server je pokrenut na portu ${port}`);
});


module.exports = {app};



