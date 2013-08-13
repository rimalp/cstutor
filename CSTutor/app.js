
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

console.log(path.join(__dirname));
app.configure(function(){
	// all environments
	app.set('port', process.env.PORT || 3018);
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


app.get('/', function(req, res){res.render("graph.html");}); //home page

app.get('/login', function(req, res){res.render("login.html");});//login page



http.createServer(app).listen(app.get('port'), function(err){
  if(err)
	throw err;
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
	var create_Student = "CREATE TABLE student(email varchar PRIMARY KEY, firstName varchar, lastName varchar, password varchar, frequency integer)";
	var create_Prof = "CREATE TABLE professor(email varchar PRIMARY KEY, firstName varchar, lastName varchar, password varchar)";
	var create_Course = "CREATE TABLE course(name varchar, year integer, semester varchar, PRIMARY KEY(name, year, semester))";
	var create_ProfCourse = "CREATE TABLE  professor_course(email varchar, courseName varchar, courseYear integer, courseSemester varchar, PRIMARY KEY(email, courseName, courseYear, courseSemester))";
	var create_StudentCourse = "CREATE TABLE  student_course(email varchar, courseName varchar, courseYear integer, courseSemester varchar, PRIMARY KEY(email, courseName, courseYear, courseSemester))";
	var create_Project = "CREATE TABLE  project(name text, description text, dueDate DATE, courseName varchar, courseYear integer, courseSemester varchar, PRIMARY KEY(courseName, courseYear, courseSemester, name))";
	var create_StudentProject = "CREATE TABLE  student_project(projectName text, courseName varchar, courseYear integer, courseSemester varchar, email varchar, graphId integer, PRIMARY KEY(projectName, courseName, courseYear, courseSemester, email, graphId))";
	var create_Node = "CREATE TABLE  node(id SERIAL, x integer, y integer, graphId integer, parentNodeId integer, name varchar, description varchar, color varchar, PRIMARY KEY(id))";
	var create_Edge = "CREATE TABLE  edge (src integer, dst integer, graphId integer, PRIMARY KEY(src, dst))";
	var create_Graph = "CREATE TABLE  graph(id SERIAL, parentNodeId integer, version integer, description text, PRIMARY KEY(id))";

	var create_Question = "CREATE TABLE  question(id SERIAL, projectId integer, question varchar)";
	var create_Answer = "CREATE TABLE  answer(id SERIAL, questionId integer, graphId integer, answer varchar)";

  client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running a query.', err);
    }
    console.log(result.rows[0]);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
  });

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

var database = new db.Database(client);



console.log("database object created");



//==============  GET requests for database queries ===============================
var sendPostResponse = function(req, res, err, result){
	if(err){
		console.log(err);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end("Error reading the database");
	}else{
		console.log("SendPostResponse: " + JSON.stringify(result));
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end(JSON.stringify(result.rows));
	}
}
//get all the courses for a student. request body params:  studentEmail
app.post('/courses_student', function(req, res){
	console.log("get students request: " + req.body.email);
	database.getCoursesForStudent(req.body.email, function(err, result){
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

app.post('/query', function(req, res){
		client.query(res.body.query, function(err, result){
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(JSON.stringify(result));
		});
});


//get top level graphs for a course>lab>student. 
//request body params: projectName, courseName, courseYear, courseSemester, studentEmail
app.post('/graphs_top', function(req, res){
	database.getTopLevelGraphForLabForStudentForAllVersions(req.body.projectName, req.body.courseName, req.body.courseYear,
		req.body.courseSemester, req.body.studentEmail, function(err, result){
			//sendPostResponse(req, res, err, result);
			if(err){
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end("Error reading the database");
			}else{
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end(JSON.stringify(result));
			}
		});
});
//get sub-level graphs. request body params: nodeId (graph's parentNodeId if zooming out and simply nodeId if zooming in)
app.post('/graph', function(req, res){
	database.getSubGraphForNode(req.body.parentNodeId, function(err, result){
		//sendPostResponse(req, res, err, result);
		if(err){
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end("Error reading the database");
		}else{
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(JSON.stringify(result));
		}
	});
});

//params:{}
app.post('/allStudents', function(req, res){
	client.query("SELECT * FROM student", function(err, result){
		sendPostResponse(req, res, err, result);		
	});
});
//params: {email, password}
app.post('/validate_login', function(req, res){
	database.validateLogin(req.body.username, req.body.password, function(err, result){
		if(err){
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end("Error reading the database");
		}else{
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(JSON.stringify(result));
		}
	});
});

//params: {email, password, firstName, lastName}
app.post('/register', function(req, res){
	database.registerUser(req.body.email, req.body.password, req.body.firstName, req.body.lastName, req.body.isAdmin, function(err, result){
		if(err){
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end("Error reading the database");
		}else{
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(JSON.stringify(result));
		}
	});
});


//for testing purposes
/*
app.post('/login', function(req, res){
	var name = req.body.name;
	console.log("Name received:" + name);
	//received form data, get the data from req.body.(param)
	var test = {param: "This is from the server."};
	console.log("Request received.");
	//res.writeHead(200, { 'Content-Type': 'text/plain' });
	//res.end(JSON.stringify(test));
	res.render("login.html");
});
*/


//===================================== PUT requests (CREATE/UPDATE of information) ================================

var sendPutRequest = function(req, res, err, result){
	if(err){
		console.log("Database Error: " + err);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end("Error reading the database");
	}else{
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		if(result){
			res.end(JSON.stringify(result.rows));
		}else{
			res.end("Successfully updated the database.");
		}
	}
}

//params: professor{email, lastName, firstName, password}
app.post('/create_professor', function(req, res){
	database.createProfessor(req.body.email, req.body.firstName, req.body.lastName, req.body.password, function(err, result){
		sendPutRequest(req, res, err, result);
	});
});
//params: student{email, lastName, firstName, password}
app.post('/create_student', function(req, res){
	database.createStudent(req.body.email, req.body.firstName, req.body.lastName, req.body.password, function(err, result){
		sendPutRequest(req, res, err, result);
	});
});

//params: {course{name, year, semester}, professorEmail}
app.post('/create_course', function(req, res){
	database.createCourse(req.body.courseName, req.body.courseYear, req.body.courseSemester, req.body.professorEmail, function(err, result){
		sendPutRequest(req, res, err, result);
	});
});

//params: {course{name, year, semester}, studentEmail}
app.post('/add_students', function(req, res){
	database.addStudentToCourse(req.body.studentEmail, req.body.courseName, req.body.courseYear, req.body.courseSemester, function(err, result){
		sendPutRequest(req, res, err, result);
	});
});

//params: project{name, description, courseName, courseYear, description}
app.put('/create_project', function(req, res){
	database.createProject(req.body.projectName, req, body.projectDescription, req.body.courseName, req.body.courseYear, req.body.courseSemester,
		function(err, result){
			sendPutRequest(req, res, err, result);
		});
});

//params: graph { graphInfo{...}, nodeInfo{[x, y, ...., deleted(boolean), ...] }, edgeInfo{ array of edges ...}, studentEmail, courseName, courseYear, courseSemester, projectName}
app.post('/create_graph', function(req, res){
	console.log("req.body.edgeInfo: " + JSON.stringify(eval(req.body.edgeInfo)));
	database.createGraph(req.body.graphInfo, eval(req.body.nodeInfo), eval(req.body.edgeInfo), req.body.studentEmail, req.body.courseName, req.body.courseYear, req.body.courseSemester, 
	 req.body.projectName, function(err, result){
		sendPutRequest(req, res, err, result);
	});
});

//================================= DELETE requests ======================================
//delete queries but uses POST verb because ajax(used in front end) cannot do DEL request

var sendDeleteRequest = function(req, res, err, result){
	if(err){
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end("Error reading the database");
	}else{
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		if(result){
			res.end(JSON.stringify(result.rows));
		}else{
			res.end("Successfully performed the deletion.");
		}
	}
}
//params: {studentEmail}
app.post('/delete_student', function(req, res){
	database.deleteStudent(req.body.studentEmail, function(err, result){
		sendDeleteRequest(req, res, err, result);
	});
});


//params: {courseName, courseYear, courseSemester, professorEmail}
app.post('/delete_course', function(req, res){
	database.deleteCourse(req.body.courseName, req.body.courseYear, req.body.courseSemester, req.body.professorEmail, function(err, result){
		sendDeleteRequest(req, res, err, result);
	});
});

//params: {studentEmail, courseName, courseYear, courseSemester}
app.post('/remove_student_course', function(req, res){
	database.deleteStudentFromCourse(req.body.courseName, req.body.courseYear, req.body.courseSemester, req.body.studentEmail, function(err, result){
		sendDeleteRequest(req, res, err, result);
	});
});

//params: {projectName, courseName, courseYear, courseSemester}
app.post('/delete_project', function(req, res){
	database.deleteProject(req.body.projectName, req.body.courseName, req.body.courseYear, req.body.courseSemester, function(err, result){
		sendDeleteRequest(req, res, err, result);
	});
});

//params: {graphid}
app.post('/delete_graph', function(req, res){
	database.deleteGraph(req.body.graphId, function(err, result){
		sendDeleteRequest(req, res, err, result);
	});
});

console.log("database object created");
