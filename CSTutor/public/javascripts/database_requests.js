
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
