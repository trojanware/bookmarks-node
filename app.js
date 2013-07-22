var express = require('express');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var app = express();
var MongoStore = require('connect-mongo')(express);

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: "test1"}));
app.use('/static', express.static(__dirname+'/static'));

var databaseUrl = "Bookmarks";
var collections = ['Users'];
var db = require('mongojs').connect(databaseUrl, collections);

//To serve the index page
app.get('/', function(request, response){
  response.redirect('/static/index.htm');
});

//For adding a new user to the DB
app.post('/users/', function(request, response){
  user_id = request.body.txtUsername;
  password = request.body.txtPassword;
  name = request.body.txtName;

  db.Users.find({user_id: user_id}, function(err, user){
    console.log('userod : '+user_id);
    if(err || !user){
      response.writeHead(500);
      response.write('An error occured while checking if a user exists');
      response.end();
    }
    else{
      if(user.length!=0){
	response.write('A user with this ID already exists!');
	response.end();
      }
      else{
	bcrypt.genSalt(10, function(err, salt){
	  bcrypt.hash(password, salt, function(err, hash){
	    //Add a new document to the collection
	    if(addUser(user_id, name, hash)){
	      response.writeHead(200);
	      response.send('Successful');
	    }
	    else{
	      response.send("An error occured while saving data");
	    }
	  });
	});
      }
    }
  });
});

function addUser(user_id, password, hash){
  var new_user = {};
  new_user = {
    user_id: user_id,
    name: name,
    password: password,
    bookmarks: []
  };
  db.Users.save(new_user, function(err, saved){
    if(err || !saved){
      console.log("add error occured while saving\n"+err);
      return false;
      //response.send(err);
    }
    else{
      return true;
      //response.writeHead(200, {'Content-Type': 'text/html'});
      //repsonse.send('Successful');
    }
  });
}

app.listen(3001);
