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

function getTopLevelGraphsForStudentProject(course, project, student){
	$.post('/graphs_top',
		{projectName : project.title, courseName: course.title, courseYear: course.year, courseSemester: course.semester, studentEmail: student.title},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function getSubGraph(node, parentNode){
	$.post('/graph',
		{nodeId: node.id, parentNodeId: parentNodeId.id},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
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

function createGraph(graph){
	var nodeArray = new Array();
	for(var i=0; i<graph.nodes.length; i++){
		var node = graph.nodes[i];
		nodeArray[nodeArray.length] = {nodeId: node.id, x: node.x, y: node.y, name: node.data, description: node.description, color: node.color, deleted: false};
	}

	var edgeArray = new Array();
	for(var i=0; i<graph.edges.length; i++){
		var edge = graph.edges[i];
		edgeArray[edgeArray.length] = {sourceNode: edge.sourceNode.id, destNode: edge.destNode.id};
	}
	
	for(var i=0; i<graph.removedNodes.length; i++){
		var node = graph.removedNodes[i];
		if(node.id > 0)
			nodeArray[nodeArray.length] = {nodeId: node.id, x: node.x, y: node.y, name: node.data, description: node.description, color: node.color, deleted: true};
	}
	
	$.post('/create_graph',
		{graphInfo: {graphId: graph.id, parentNodeId: graph.parent.id, version: graph.version}, 
			studentEmail: graph.graphHistory.student.title, courseName: graph.graphHistory.project.course.title, 
			courseYear: graph.graphHistory.project.course.year, courseSemester: graph.graphHistory.project.course.semester, 
			projectName: graph.graphHistory.project.title, nodeInfo: nodeArray, edgeInfo: edgeArray},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}







