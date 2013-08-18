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

var databaseUrl = "trojanware:nm123nm$$@ds041178.mongolab.com:41178/bookmarks";
var collections = ['Users'];
var db = require('mongojs').connect(databaseUrl, collections);

//To serve the index page
app.get('/', function(request, response){
  //response.redirect('/static/index.htm');
  response.sendfile(__dirname + '/static/index.htm');
});

//For adding a new user to the DB
app.get('/st2', function(request, response){
    response.sendfile(__dirname + '/static/echoToken.htm');
});
app.post('/saveToken', function(request, response) {
    var token = request.body.token;
    var name = request.body.name;
    var url = "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=";
    var options = {
	'host': 'www.googleapis.com',
	'port': 443,
	'path': '/oauth2/v1/tokeninfo?access_token='+token,
	'method': 'GET'
    };
    var data = '';
    https.get(options, function(res) {
	res.on('data', function(chunk) {
	    data += chunk;
	});
	res.on('end', function() {
	    data = JSON.parse(data);
	    var user_id = data['user_id'];
	    var email = data['email'];
	    addUser(response, user_id, email, name);
	});
    });
});
/*app.get('/st1', function(request, response){
  console.log('st1 : '+request.query);
  var data = '';
  if(request.query.code != "undefined"){
      console.log("code found");
      var post_data = querystring.stringify({
	  'code': request.query.code,
	  'client_id': '978616694462.apps.googleusercontent.com',
	  'client_secret': '6gAl6DTmllTdhukvEBGkX2a9',
	  'redirect_uri': 'https://trojanware1-bookmarks-node.nodejitsu.com/st2',
	  'grant_type': 'authorization_code'
      });
      console.log('post_data : '+post_data);
      var options = {
	host: "accounts.google.com",
	port: 443,
	path: "/o/oauth2/token",
	method: "POST",
	headers: {
	    'Content-Type': 'application/x-www-form-urlencoded'
	}
      };
      console.log("making query");
      var post_req = https.request(options, function(res) {
	    res.on('data', function(chunk){
		console.log("got data : "+chunk);
		data += chunk;
	    });
	    res.on('end', function(){
		response.send(data);
	    });
	  }).on('error', function(e){
	      response.send('error : '+e);
	  });
	  post_req.write(post_data);
	  post_req.end();
  }
  else{
      response.send("no code");
  }
});*/
app.post('/users/', function(request, response){
    name = request.body.txtName;
    var data = "";
    var options = {
	'host': 'accounts.google.com',
	'port': 443,
	'path': '/o/oauth2/auth?response_type=token&client_id=978616694462.apps.googleusercontent.com&redirect_uri=https://trojanware1-bookmarks-node.nodejitsu.com/st2&scope=email&state=name:'+name,
	'method': 'GET'
    };
    var data = '';
    var req_obj = https.get(options, function(res) {
	if(res.statusCode >= 300 && res.statusCode < 400){
	    response.redirect(res.headers.location);
	}
	res.on('data', function(chunk) {
	    console.log('data : '+data);
	    data += chunk;
	});
	res.on('end', function() {
	    response.end('hello');
	});
    });
    req_obj.on('error', function(e) {
	response.send('error :' + e);
    });
  /*request.get('https://accounts.google.com/o/oauth2/auth?client_id=978616694462.apps.googleusercontent.com&response_type=code&scope=email%20openid&redirect_uri=https://trojanware-bookmarks-node.nodejitsu.com/st1&state=1223', function(error, response, body){
      console.log(body);
  })*/

  /*var options = {
    host: "accounts.google.com",
    port: 443,
    path: "/o/oauth2/auth?client_id=978616694462.apps.googleusercontent.com&response_type=code&scope=email%20openid&redirect_uri=https://trojanware1-bookmarks-node.nodejitsu.com/st1&state=1223",
    method: "GET"
  };
  https.get(options, function(res){
    if(res.statusCode >= 300 && res.statusCode < 400){
	response.redirect(res.headers.location);
    }
    res.on('data', function(chunk){
      data += chunk;
    });
    res.on('end', function(){
      console.log('end');
    });
  }).on('error', function(e){
    console.log(e);
  }); */
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

function addUser(response, user_id, email, name){
  var new_user = {};
  new_user = {
    user_id: user_id,
    name: name,
    bookmarks: []
  };
  db.Users.save(new_user, function(err, saved){
    if(err || !saved){
      console.log("add error occured while saving\n"+err);
      return false;
      response.send(err);
    }
    else{
      return true;
      response.writeHead(200, {'Content-Type': 'text/html'});
      repsonse.send('Successful');
    }
  });
}

app.listen(3001);
