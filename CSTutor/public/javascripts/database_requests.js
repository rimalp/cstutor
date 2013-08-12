//---------------------- GET ------------------------------
function getCoursesForStudent(student, callback){
	$.post('/courses_student',
		{email: student.title},
		callback);
}

function getProjectsForCourse(course, callback){
	$.post('/projects',
		{courseName: course.title, courseYear: course.year, courseSemester: course.semester},
		callback);
}

function getStudentsForCourse(course, callback){
	$.post('/students',
		{courseName: course.title, courseYear: course.year, courseSemester: course.semester},
		callback);
}

function getTopLevelGraphsForStudentProject(course, project, student, callback){
	$.post('/graphs_top',
		{projectName : project.title, courseName: course.title, courseYear: course.year, courseSemester: course.semester, studentEmail: student.title},
		callback);
}

function getSubGraph(parentNode, callback){
	$.post('/graph',
		{parentNodeId: parentNode.id},
		callback);
}


//----------------------- CREATE/UPDATE --------------------------
function createProfessor(professor){
	$.post('/create_professor',
		{email: professor.title, lastName: professor.lastName, firstName: professor.firstName, password: professor.password},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function createStudent(student){
	$.post('/create_professor',
		{email: student.title, lastName: student.lastName, firstName: student.firstName, password: student.password},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function createCourse(course, professor){
	$.post('/create_course',
		{courseName: course.title, courseYear: course.year, courseSemester: course.semester, professorEmail: professer.title},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function addStudents(course, student){
	$.post('/add_students',
		{courseName: course.title, courseYear: course.year, courseSemester: course.semester, studentEmail: student.email},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function createProject(project, course){
	$.post('/create_project',
		{projectName: project.title, projectDescription: "", courseName: course.title, courseYear: course.year, courseSemester: course.semester},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function runQuery(q){
	$.post('/query',
		{query: q},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function updateGraph(graph){
	var nodeArray = new Array();
	for(var i=0; i<graph.nodes.length; i++){
		var node = graph.nodes[i];
		nodeArray[nodeArray.length] = {id: node.id, x: Math.round(node.x), y: Math.round(node.y), graphId: node.graph.id, name: node.data, description: node.description, color: node.color, deleted: false};
	}

	var edgeArray = new Array();
	for(var i=0; i<graph.edges.length; i++){
		var edge = graph.edges[i];
		edgeArray[edgeArray.length] = {sourceNode: edge.sourceNode.id, destNode: edge.destNode.id};
	}
	console.log(JSON.stringify(edgeArray));
	for(var i=0; i<graph.removedNodes.length; i++){
		var node = graph.removedNodes[i];
		if(node.id > 0)
			nodeArray[nodeArray.length] = {id: node.id, x: Math.round(node.x), y: Math.round(node.y), graphId: node.graph.id, name: node.data, description: node.description, color: node.color, deleted: true};
	}
	var reqData = {};
	reqData.graphInfo = {id: graph.id, parentNodeId: graph.parent ? graph.parent.id : -1, version: graph.version, description: "No description"};
	
	//get top level graph
	var currentGraph = graph;
	while(currentGraph.parent){
		currentGraph = currentGraph.parent.graph;
	}
	var topLevelGraphHistory = currentGraph.graphHistory;
	
	reqData.studentEmail = topLevelGraphHistory.student.title;
	reqData.courseName = topLevelGraphHistory.project.course.title;
	reqData.courseYear = topLevelGraphHistory.project.course.year;
	reqData.courseSemester = topLevelGraphHistory.project.course.semester;
	reqData.projectName = topLevelGraphHistory.project.title;
	reqData.edgeInfo = JSON.stringify(edgeArray);
	reqData.nodeInfo = JSON.stringify(nodeArray);
	$.post('/create_graph',
		reqData,
		function(data, status) {
			console.log("data: " + data);
			var maxId = eval(data)[0].maxnodeid;
			graph.id = eval(data)[0].newGraphId;
			console.log("maxId: "  + maxId + " " + graph.id);
			for(var i=0; i<graph.nodes.length; i++){
				var node = graph.nodes[i];
				if(node.id < 0){
					node.id *= -1;
					node.id += maxId;
				}
			}
			uniqueID = -1;
		});
}







