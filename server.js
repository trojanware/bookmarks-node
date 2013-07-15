var express = require('express');
var redis = require('redis');
var client = redis.createClient();
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var cons = require('consolidate');
var swig = require('swig');
var path = require('path');

swig.init({
  root: __dirname,
  allowError: true,
});

client.select(1,function(){
  console.log("REDIS: db 1 select");
});

var app = express();
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret:'vaibhav'}));
app.use('/static',express.static(__dirname+'/static'));
app.use('/styles',express.static(__dirname+'/static/styles'));

app.engine('.html',cons.swig);
app.set('views', path.join(__dirname,'views'));
app.set('view engine','html');

app.get('/',function(req,res) {
  res.render('index.html',{});
});

app.get('/signup',function(req,res){
  res.render('newUser.html',{});
});

app.get('/login',function(req,res){
  res.render('login.html',{})
});

app.post('/addUser',function(req,res){
  var userid = req.body.txtUsername;
  var password= req.body.txtPassword;
  var name= req.body.txtName;
  client.hexists('users',userid,function(err,obj){
    if(obj==1)
      res.send('Username taken');
    else{
      client.hlen('users',function(err,obj){
        var len = obj;
        if(typeof(obj)!='undefined'){
          client.hset('users',userid,obj,function(err,obj){
            if(err){
              console.log("err : "+err);
              res.send(err);
            }
            else{
              client.hset(userid+":"+len,"name",name,function(err,obj){
                if(err)
                  res.send(err);
              });
              //gen hash
              bcrypt.genSalt(10,function(err,salt){
                bcrypt.hash(password,salt,function(err,hash){
                  client.hset(userid+":"+len,"password",hash,function(err,obj){
                    if(err){
                      console.log("error while saving password");
                      res.send("error while saving password");
                    }
                  });
                  client.hset(userid+":"+len,"Name",name,function(err,obj){
                    if(err){
                      console.log("error while saving name");
                      res.send("error while saving name");
                    }
                    else
                      res.send("Successful");
                  });
              });
            });
            }
          });
        }
      });
    }
  });
});

app.post('/verifyUser',function(req,res){
  var username = req.body.txtUsername;
  var password= req.body.txtPassword;

  client.hget('users',username,function(err,obj){
    if(err){
      console.log("error while fetching username");
      res.send("error while fetching username");
    }
    else{
      var id = obj;
      client.hget(username+":"+id,"password",function(err,obj){
        if(err){
          console.log("error while fetching password");
          res.send(err);
        }
        else{
          var org_password = obj;
          bcrypt.compare(password,org_password,function(err,isMatch){
            if(isMatch){
              req.session.user_id = username;
              var sid = generateSID(username);
              client.hset('session',sid,username+":"+id,function(err,result){
                if(err){
                  res.send("error while saving the session");
                  console.log("error while saving the session");
                }
                else{
                  req.session.sid = sid;
                  req.session.user_id = username+":"+id;
                  res.cookie('sid',sid,{maxAge:900000, httpOnly:true});
                  res.send("Logged in!SID = "+sid);
                }
              });
            }
            else
              res.send("Invalid username or password!")
          });
        }
      });
    }
  });
});

app.get('/checkUser',function(req,res){
  var sid = req.cookies.sid;
  client.hexists('session',sid,function(err,obj){
    if(obj)
      res.send("Logged in");
    else
      res.send("Invalid");
  });
});

app.get('/logout',function(req,res){
  var sid = req.cookies.sid;
  console.log("sid : "+sid);
  if(sid){
    client.hdel('session',sid,function(err,obj){
      if(err){
        console.log("error while deleting the session");
        res.send("error while deleting the session");
      }
      else{
        res.clearCookie('sid');
        res.send("Logged out");
      }
    });
  }
  else
    res.redirect('/login');
});

app.get(/^\/add\/(.*)$/,function(req,res){
  var link = req.params[0];
  var sid = req.cookies.sid;
  if(!sid)
    res.redirect('/login');
  else{
    var qString;
    client.hget("session",sid,function(err,obj){
      if(err){
        console.log("error while resolving the sid into userid");
        res.send("error while resolving the sid into userid");
      }
      else{
        var userid = obj;
        client.rpush(obj+":links",link,function(err,obj){
          if(err){
            console.log("error while adding the link");
            //res.send("error while adding the link");
            res.send(err);
          }
          else{
            console.log(link+" added to the list");
            res.redirect("/list");
          }
        });
      }
    });
  }
});

app.get('/list',function(req,res){
  var sid = req.cookies.sid;
  var u_id= req.session.user_id;
  var ar_uid = u_id.split(":");
  var uname = ar_uid[0];
  var id= ar_uid[1];
  console.log('username: '+uname);
  var links = [];
  if(!sid)
    res.redirect('/login');
  else{
    client.hget("session",sid,function(err,obj){
      if(err){
        console.log("error while resolving the sid into userid");
        res.send("error while resolving the sid into userid");
      }
      else{
        var userid = obj;
        client.llen(obj+":"+"links",function(err,obj){
          if(err){
            console.log("error while fetching length");
            res.send("error while fetching length");
          }
          else{
            var len = obj;
            client.lrange(userid+":links",0,len,function(err,obj){
              if(err){
                console.log("error while fethching links");
                res.send("error while fetching links");
              }
              else{
                var lst = "";
                for(var i=0;i<obj.length;i++)
                  lst += "<a href=\""+obj[i]+"\">"+obj[i]+"</a><hr /><br />";
                //res.send(lst);
                res.render('list.html',{
                  username: uname,
                  links: obj,
                });
              }
            });
          }
        });
      }
    });
  }
  
});

function generateSID(username){
  var salt = Math.round(new Date().valueOf() * Math.random())+'';
  return crypto.createHmac('sha1',salt).update(username+Math.random()).digest('hex');
}

function checkUser(){
  var sid = req.cookies.sid;
  client.hexists('session',sid,function(err,obj){
    return obj;
  });
}
app.listen(3000);
