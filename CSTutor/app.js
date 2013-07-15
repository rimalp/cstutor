
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
	// all environments
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views'); //__dirname is the curent dir
	// app.set('view engine', 'html'); //default rendering is jade
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	//can set case sensitive routes, strict routing(forward slash trailing) both disabled by default

	//middlewares - functions that runs before route function gets client request
	// these middleware come from Connect framework used by express
	// www.senchalabs.org/connect
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(require('less-middleware')({ src: __dirname + '/public' }));
	app.use(app.router); //calls the routes before the one below is called. ex: track what files are downloaded how often
	app.use(express.static(path.join(__dirname))); //specifies the resource folder
});



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index); //call index.js file in routes direcotory
app.get('/users', user.list);
app.get('/login', function(req, res){
	res.send("<h1> Login Page </h1>");
});
app.get('/home/:userId', function(req, res){

});
//process the login request
app.post('/login', function(req, res){
	//received form data, see below on how to get that data 
});



// more about routes
	//getting simple requests
	// app.get("/", function(req, res) {
	// 	res.send("Hello, Express!"); //can directly type html here
	// });

	//getting get requests with params
	// app.get("/users/:userId", function(req, res){
	// 	res.send("<h1> Hello, user " + req.params.userId + " ! </h1>");
	// });

	//getting post requests
	// app.post("/users", function(req, res){
	// 	res.send("Creating a new user with name: " + req.body.username); //username is a param in the form
	// });

	//same with put
	// app.put("/users/:userId", function(){})
	// app.delete("/users/:userId. function(){}");

	//can also use regex in routes

		// app.get(/\/users\/(\d*)\/?(edit)?/, function(req, res){
		// 	// /users/10 (number)
		// 	// /users/10/
		// 	// /users/10/edit

		// 	var message = "user #" + req.params[0] + "'s profile.";
		// 	if(req.params[1] == 'edit') {
		// 		message = "Editing " + message;
		// 	} else {
		// 		message = "Viewing " + message;
		// 	}

		// 	res.send(message);
		// });


//rendering views
	app.get("/", function(req, res){
		res.render("abc.jade")
	});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
