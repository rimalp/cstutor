
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , pg = require('pg')
  , db = require('./database')
  , index = require('./routes/index');

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
	app.use(require('less-middleware')({ src: __dirname }));
	app.use(app.router); //calls the routes before the one below is called. ex: track what files are downloaded how often
	app.use(express.static(path.join(__dirname))); //specifies the resource folder
});



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', routes.index); //home page

//==============  GET requests for database queries
var sendPostResponse = function(req, res, err, result){
	if(err){
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end("Error reading the database");
		}else{
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(JSON.stringify(test));
		}
}
//get all the courses for a student. request body params:  studentEmail
app.post('/courses_student', function(req, res){
	database.getCoursesForStudent(req.body.studentEmail, function(err, result){
		sendPostResponse(req, res, err, result);
	});
});
//get all the courses for a student. request body params:  professorEmail
app.post('/courses_professor', function(req, res){
	database.getCoursesForProfessor(req.body.studentEmail, function(err, result){
		sendPostResponse(req, res, err, result);
	});
});
//get projects for a course. request body params: courseName, courseYear, courseSemester
app.post('/projects', function(req, res){
	database.getProjectsForCourse(req.body.courseName, req.body.courseYear, req.body.courseSemester, function(err, result){
		sendPostResponse(req, res, err, result);
	});
});
//get all the students request body params - courseName, courseYear, courseSemester
app.post('/students', function(req, res){
	database.getStudentsForCourse(req.body.courseName, req.body.courseYear, req.body.courseSemester, function(err, result){
		sendPostResponse(req, res, err, result);
	});
});
//get top level graphs for a course>lab>student. 
//request body params: projectName, courseName, courseYear, courseSemester, studentEmail
app.post('/graphs_top', function(req, res){
	database.getTopLevelGraphForLabForStudentForAllVersions(req.body.projectName, req.body.courseName, req.body.courseYear,
		req.body.courseSemester, req.body.studentEmail, function(err, result){
			sendPostResponse(req, res, err, result);
		});
});
//get sub-level graphs. request body params: nodeId (graph's parentNodeId if zooming out and simply nodeId if zooming in)
app.post('/graph', function(req, res){
	database.getSubGraphForNode(req.body.parentNodeId, function(err, result){
		sendPostResponse(req, res, err, result);
	});
		sendPostResponse(req, res, err, result);
});

//for testing purposes
app.post('/login', function(req, res){
	var name = req.body.name;
	console.log("Name received:" + name);
	//received form data, see below on how to get that data 
	var test = {param: "This is from the server."};
	console.log("Request received.");
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end(JSON.stringify(test));
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


// //rendering views
// 	app.get("/", function(req, res){
// 		res.render("abc.jade")
// 	});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



//Database connection
// var client = new pg.Client(conString);
console.log("before");
var client = new pg.Client({user: 'rimalp', password: 'rimalp', database: 'gfb', host: 'localhost', port: 5432 });
console.log("after");
client.connect(function(err) {
	console.log("connect called");
  	if(err) {
   		return console.error('could not connect to postgres: ', err);
  	}
	console.log("connected");
  	//create all the tables here if not exist
	var create_Student = "CREATE TABLE IF NOT EXISTS student(email varchar PRIMARY KEY, firstName varchar, lastName varchar, password varchar, int frequency)";
	var create_Prof = "CREATE TABLE IF NOT EXISTS professor(email varchar PRIMARY KEY, firstName varchar, lastName varchar, password varchar)";
	var create_Course = "CREATE TABLE IF NOT EXISTS course(name varchar, year integer, semester varchar, PRIMARY KEY(name, year, semester))";
	var create_ProfCourse = "CREATE TABLE IF NOT EXISTS professor_course(email varchar, courseId integer, PRIMARY KEY(email, courseId))";
	var create_StudentCourse = "CREATE TABLE IF NOT EXISTS student_course(email varchar, courseName varchar, courseYear integer, courseSemester varchar, PRIMARY KEY(email, courseName, courseYear, semester))";
	var create_Project = "CREATE TABLE IF NOT EXISTS project(name text, description text, dueDate DATE, courseName varchar, courseYear integer, courseSemester varchar, PRIMARY KEY(courseName, courseYear, courseSemester, name))";
	var create_StudentProject = "CREATE TABLE IF NOT EXISTS student_project(projectName text, courseName varchar, courseYear integer, courseSemester varchar, email varchar, graphId integer, PRIMARY KEY(projectName, courseName, courseYear, courseSemester, email, graphId))";
	var create_Node = "CREATE TABLE IF NOT EXISTS node(id SERIAL, x integer, y integer, graphId integer, parentNodeId integer, name integer, description integer, color varchar)";
	var create_Edge = "CREATE TABLE IF NOT EXISTS edge (src integer, dst integer, graphId integer, PRIMARY KEY(src, dst))";
	var create_Graph = "CREATE TABLE IF NOT EXISTS graph(id SERIAL, parentNodeId integer UNIQUE, version integer, description text)";

	var create_Question = "CREATE TABLE IF NOT EXISTS question(id SERIAL, projectId integer, question varchar)";
	var create_Answer = "CREATE TABLE IF NOT EXISTS answer(id SERIAL, questionId integer, graphId integer, answer varchar)";

  client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running a query.', err);
    }
    console.log(result.rows[0].theTime);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
  });

    //create table queries execution
    client.query(create_Student, function(err, result) {
	    if(err) {
	      return console.error('error running a create student query.', err);
	    }
  	});

    client.query(create_Prof, function(err, result) {
	    if(err) {
	      return console.error('error running a CREATE PROFESSOR query.', err);
	    }
  	});

    client.query(create_Course, function(err, result) {
	    if(err) {
	      return console.error('error running a create COURSE query.', err);
	    }
  	});
    client.query(create_ProfCourse, function(err, result) {
	    if(err) {
	      return console.error('error running a query.', err);
	    }
  	});
    client.query(create_StudentCourse, function(err, result) {
	    if(err) {
	      return console.error('error running a create STUDENT_COURSE query.', err);
	    }
  	});
    client.query(create_Project, function(err, result) {
	    if(err) {
	      return console.error('error running a create PROJECT query.', err);
	    }
  	});
    client.query(create_StudentProject, function(err, result) {
	    if(err) {
	      return console.error('error running a create STUDENT_PROJECT query.', err);
	    }
  	});
    client.query(create_Node, function(err, result) {
	    if(err) {
	      return console.error('error running a create NODE query.', err);
	    }
  	});
    client.query(create_Edge, function(err, result) {
	    if(err) {
	      return console.error('error running a create EDGE query.', err);
	    }
  	});
    client.query(create_Graph, function(err, result) {
	    if(err) {
	      return console.error('error running a create GRAPH query.', err);
	    }
  	});

    client.on('drain', function(){
    	console.log("FINISHED TABLE CREATION.");
    });
});

exports.database = db.Database(client);


console.log("database object created");
