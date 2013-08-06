//---------------------- GET ------------------------------
function getCoursesForStudent(student){
	$.post('/courses_student',
		{email: student.title},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function getProjectsForCourse(course){
	$.post('/projects',
		course.getJSON(),
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}

function getStudentsForCourse(course){
	$.post('/students',
		{courseName: course.title, courseYear: course.year, couresSemester: course.semester},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
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
		nodeArray[nodeArray.length] = {nodeId: node.id, x: node.x, y: node.y, name: node.data, description: node.description, color: node.color};
	}

	var edgeArray = new Array();
	for(var i=0; i<graph.edges.length; i++){
		var edge = graph.edges[i];
		edgeArray[edgeArray.length] = {sourceNode: edge.sourceNode.id, destNode: edge.destNode.id};
	}
	
	var removedNodeArray = new Array();
	for(var i=0; i<graph.removedNodes.length; i++){
		var node = graph.removedNodes[i];
		removedNodeArray[removedNodeArray.length] = {nodeId: node.id};
	}
	
	$.post('/create_graph',
		{graphId: graph.id, parentNodeId: graph.parent.id, version: graph.version, 
			student: graph.graphHistory.student.title, course_name: graph.graphHistory.project.course.title, 
			course_year: graph.graphHistory.project.course.year, course_semester: graph.graphHistory.project.course.semester, 
			description: "", nodes: nodeArray, edges: edgeArray, removedNodes: removedNodeArray},
		function(data, status) {
		  console.log("Data: " + data + "\nStatus: " + status);
		});
}







