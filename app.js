var express = require('express');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
//var request = require('request');

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
app.get('/st2', function(request, response){
    response.send(request.query);
});
app.get('/st1', function(request, response){
  console.log('st1 : '+request.query);
  if(request.query.code != "undefined"){
      var post_data = querystring.stringify({
	  'code': request.query.code,
	  'cliend_id': '978616694462.apps.googleusercontent.com',
	  'client_secret': '6gAl6DTmllTdhukvEBGkX2a9',
	  'grant_type': 'authorization_code',
	  'redirect_uri': 'https://trojanware-bookmarks-node.nodejitsu.com/st2'
      });
      var options = {
	host: "accounts.google.com",
	port: 443,
	path: "/o/oauth2/auth?client_id=978616694462.apps.googleusercontent.com&response_type=code&scope=email%20openid&redirect_uri=https://trojanware-bookmarks-node.nodejitsu.com/st1&state=1223",
	method: "POST",
	data: post_data
      };
      https.post(options, function(res) {
	    res.on('end', function(){
	      console.log(data);
	    });
	  }).on('error', function(e){
	    console.log(e);
	  });
      });
  }
});
app.post('/users/', function(request, response){
  user_id = request.body.txtUsername;
  password = request.body.txtPassword;
  name = request.body.txtName;
  var data = "";
  /*request.get('https://accounts.google.com/o/oauth2/auth?client_id=978616694462.apps.googleusercontent.com&response_type=code&scope=email%20openid&redirect_uri=https://trojanware-bookmarks-node.nodejitsu.com/st1&state=1223', function(error, response, body){
      console.log(body);
  })*/

  var options = {
    host: "accounts.google.com",
    port: 443,
    path: "/o/oauth2/auth?client_id=978616694462.apps.googleusercontent.com&response_type=code&scope=email%20openid&redirect_uri=https://trojanware-bookmarks-node.nodejitsu.com/st1&state=1223",
    method: "GET"
  };
  https.get(options, function(res){
    console.log(res.statusCode);
    if(res.statusCode >= 300 && res.statusCode < 400){
	response.redirect(res.headers.location);
    }
    res.on('data', function(chunk){
      data += chunk;
    });
    res.on('end', function(){
      console.log(data);
    });
  }).on('error', function(e){
    console.log(e);
  });
  //response.end('done');

  /*db.Users.find({user_id: user_id}, function(err, user){
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
  });*/
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
