"use strict";
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var xmlparser = require('express-xml-bodyparser');
var mongoose = require('mongoose');
var session = require('client-sessions');
const csp = require('helmet-csp');
var xssFilters = require('xss-filters');
var passwordValidator = require('password-validator');
var pSchema = new passwordValidator();
//parsers
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.json());
app.use(express.urlencoded());
app.use(xmlparser());
xmlparser.regexp = /^text\/xml$/i;

//password schema
pSchema
.is().min(11)                                    // Minimum length 11
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()  				// Must have lowercase digits
.has().symbols()				// Must have symbols
//database

mongoose.connect('mongodb://localhost/banking', function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to database: ' + err);
  } else {
    console.log ('Connected to database.');
  }
});


var userSchema = new  mongoose.Schema({
	username: String,
	password: String,
	address1: String,
	address2: String
});
var User = mongoose.model('User', userSchema);

var accountSchema = new  mongoose.Schema({
	username: String,
	accname: String,
	balance: Number
});
var Account = mongoose.model('Account', accountSchema);

/////////////////////////////////////////database


app.get("/login.js", function(req,resp){
	
		resp.sendFile(__dirname + "/login.js");	
	
});
app.get("/signup.js", function(req,resp){
	
		resp.sendFile(__dirname + "/signup.js");	
	
});
app.get("/profile.js", function(req,resp){
	
		resp.sendFile(__dirname + "/profile.js");	
	
});
app.get("/purify.min.js", function(req,resp){
	
		resp.sendFile(__dirname + "/purify.min.js");	
	
});
app.get("/", function(req,resp){
	
		resp.sendFile(__dirname + "/index.html");	
	
});
app.get("/styles.css", function(req,resp){
	
		resp.sendFile(__dirname + "/styles.css");	
	
});
	
app.use(session({
  cookieName: 'session',
  secret: 'egieo1gF29*g2814y1JHG@63{}+Ijsli;;to8',
  duration: 30 * 60 * 1000,
  activeDuration: 3 * 60 * 1000,
  httpOnly: true,
  ephemeral: true
}));

app.use(csp({
   directives: {
    defaultSrc: ["'self'","localhost"],
    styleSrc: ["'self'","localhost"],
    scriptSrc: ["'self'", "localhost"]
  }}))
	
function requireLogin (req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');

  } else {

    next();
  }
};



app.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

app.get("/signup", function(req,resp){
	
		resp.sendFile(__dirname + "/signup.html");	
	

});
app.get("/login", function(req,resp){
	
		resp.sendFile(__dirname + "/login.html");	
	

});



app.post("/login", function(req, resp) {

	var logAtt = req.body.user;
		logAtt.username[0]=xssFilters.inHTMLData(logAtt.username[0]);
		User.find({username:logAtt.username[0], password:logAtt.password[0]},function(err,data){
				if(data.length == 1){
									
					req.session.user=data;
					resp.redirect('/profile');

				}else{
					resp.set('Content-Type', 'text/xml');
					resp.send("<success>Invalid username or password</success>");
					
				}

			});

});


app.post('/signup', function(req, resp) {
	
	var newUser = req.body.user;
	console.log(newUser);
	console.log(newUser.username[0]);
	console.log(pSchema.validate(newUser.password[0]));
	
	resp.set('Content-Type', 'text/xml');
	if(!newUser.username[0] || !newUser.password[0] || !newUser.address1[0] || !newUser.address2[0]){
		resp.send("<success>Missing field in the form. Please try again</success>");
	} else if (!(pSchema.validate(newUser.password[0]))) {
		resp.send("<success>Invalid Password.</success>");		
	} else {
			newUser.username[0] = xssFilters.inHTMLData(newUser.username[0]);
			newUser.address1[0] = xssFilters.inHTMLData(newUser.address1[0]);
			newUser.address1[0] = xssFilters.inHTMLData(newUser.address2[0]);
			User.findOne({username:newUser.username[0]},function(err,data){
				if(!data){
					

						
						var newCust = new User({
							
							username: newUser.username[0],
							password: newUser.password[0],
							address1: newUser.address1[0],
							address2: newUser.address2[0]
						});

						newCust.save(function(err, Accountx){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});


					resp.send("<success>You are registered,You can login now.</success>");


				}else{
					
					resp.send("<success>Username is already used.</success>");
					
				}

			});
		
	}


});

app.get("/profile", requireLogin, function(req, resp) {
			resp.sendFile(__dirname + "/profile.html");

});


app.post("/profile", requireLogin, function(req, resp) {

			var user = req.session.user[0];
			
	
			var xmlMsg= '<?xml version="1.0" encoding="UTF-8"?><account><username>'+ user.username +'</username>';
			
			Account.find({username: user.username}, function(err, data){

			if (data){
					
				for( var i=0 ; data.length >i; i++){
					xmlMsg += '<accname>'+ data[i].accname +'</accname><balance>'+ data[i].balance +'</balance>'; 
								
				};		
				xmlMsg += '</account>';
				resp.set('Content-Type', 'text/xml');
				resp.send(xmlMsg);
						
			}else{
				xmlMsg += '</account>';
				resp.set('Content-Type', 'text/xml');
				resp.send(xmlMsg);
				};
			});
				

});





app.post('/addaccount',requireLogin,  function(req, resp) {
	
	var newAcc = req.body.account;
	newAcc.accname[0] = xssFilters.inHTMLData(newAcc.accname[0]);
	newAcc.balance[0] = parseInt(xssFilters.inHTMLData(newAcc.balance[0]));
	
	resp.set('Content-Type', 'text/xml');	
	if(!newAcc.accname[0] || !newAcc.balance[0]) {
		resp.send("<success>Error in balance value.</success>");
	
	} else if (newAcc.balance[0] <= 0) { 
		resp.send("<success>Negetive balance Not accepted.</success>");
	} else {		
			Account.findOne({accname:newAcc.accname[0],username:req.session.user[0].username},function(err,data){
				if(!data){
						var addingAcc = new Account({
						username: req.session.user[0].username,
						accname: newAcc.accname[0],
						balance: newAcc.balance[0]
						});

						addingAcc.save(function(err, Account){
							if(err)
								console.log(err);
							else
								console.log('Account Added');
						});


					
					resp.send("<success>Account Added</success>");


				}else{
					
					resp.send("<success>Account already excist</success>");
									}

			});
		
	}


});



app.post('/deposit',requireLogin,  function(req, resp) {
	
	var dep = req.body.deposit;
	resp.set('Content-Type', 'text/xml');
	if(!dep.accname[0] || !dep.balance[0] ){
		resp.send("<success>Error</success>");

	} else  if (isNaN(parseInt(dep.balance[0])) || parseInt(dep.balance[0]) < 0){
		resp.send("<success>Please enter a valid amount.</success>");
	} else {
			dep.accname[0] =  xssFilters.inHTMLData(dep.accname[0]);
			dep.balance[0] = parseInt(xssFilters.inHTMLData(dep.balance[0]));
			Account.findOne({accname:dep.accname[0],username:req.session.user[0].username},function(err,data){
				if(data){
					var newValue = dep.balance[0]+ parseInt(data.balance);
					Account.findOneAndUpdate({accname:dep.accname[0],username:req.session.user[0].username}, {balance:newValue},function(err,data){
						
						resp.send("<success>Deposit successfull</success>");

					});
			

				}else{
					
					resp.send("<success>Error</success>");
					
				};
			});

	};
	
	


});



app.post('/withdraw',requireLogin,  function(req, resp) {
	
	var wit = req.body.withdraw;
	
	if(!wit.accname[0] || !wit.balance[0] ){
		res.send();

	} else {
			wit.accname[0] = xssFilters.inHTMLData(wit.accname[0]);
			wit.balance[0] = parseInt(xssFilters.inHTMLData(wit.balance[0]));
			Account.findOne({accname:wit.accname[0],username:req.session.user[0].username},function(err,data){
				if((data) && (parseInt(data.balance) >= parseInt(wit.balance[0]))){
					
					var newValue =parseInt(data.balance) - wit.balance[0];
					Account.findOneAndUpdate({accname:wit.accname[0],username:req.session.user[0].username}, {balance:newValue},function(err,data){
						
					resp.set('Content-Type', 'text/xml');
					resp.send("<success>Withdraw successfull</success>");
					});
				}else{
					resp.set('Content-Type', 'text/xml');
					resp.send("<success>Error</success>");
					console.log('y2');
				};
			});

	};
	
	


});


app.post('/transfer',requireLogin,  function(req, resp) {
	
	var tr = req.body.transfer;
	
	if(!tr.accname1[0] || !tr.accname2[0] ||!tr.balance[0] ){
		res.send();

	} else {
		tr.accname1[0] = xssFilters.inHTMLData(tr.accname1[0]);
		tr.accname2[0] = xssFilters.inHTMLData(tr.accname2[0]);
		tr.balance[0] = parseInt(xssFilters.inHTMLData(tr.balance[0]));
		 Account.findOne({accname:tr.accname1[0],username:req.session.user[0].username},function(err,data){
				if((data) && (parseInt(data.balance) >= tr.balance[0])){
						var newValue1= parseInt(data.balance) - tr.balance[0];
						Account.findOne({accname:tr.accname2[0],username:req.session.user[0].username},function(err,data1){
						if(data){ 
							var newValue2=parseInt(data1.balance) + tr.balance[0];	
							Account.findOneAndUpdate({accname:tr.accname1[0],username:req.session.user[0].username}, {balance:newValue1},function(err,data){
								 Account.findOneAndUpdate({accname:tr.accname2[0],username:req.session.user[0].username}, {balance:newValue2},function(err,data){

					
					resp.set('Content-Type', 'text/xml');
					resp.send("<success>Transfer successfull</success>");
					
	
									}); //4th
								}); // 3rd
							}else{
								resp.set('Content-Type', 'text/xml');
								resp.send("<success>Error</success>");
								}; //if

					}); // 2nd
				
				}else{
					resp.set('Content-Type', 'text/xml');
					resp.send("<success>Error</success>");
					console.log('y2');
				}; //if else
			}); // 1st

	}; //if else
	
	


});





app.listen(3000);
