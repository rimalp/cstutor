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

function getPromptsForProject(project){
	$.post('/prompts',
		{projectName: project.title, courseName: project.course.title, courseYear: project.course.year, courseSemester: project.course.semester},
		function(data, status){
			console.log("data: " + data);
			var response = eval(data);
			for(var i=0; i<response.length; i++){
				var prompt = new Prompt(response[i].text, response[i].requiresinput==0?false:true, response[i].eventtype, response[i].frequency);
				prompt.id = response[i].id;
				project.prompts[project.prompts.length] = prompt;
			}
		});
}

function createPrompt(prompt, project){
	$.post('/create_prompt',
		{projectName: project.title, courseName: project.course.title, courseYear: project.course.year, courseSemester: project.course.semester, text: prompt.text, requiresInput: prompt.requiresInput?1:0, eventType: prompt.eventType, frequency: prompt.frequency},
		function(data, status){
			console.log("data: " + data);
			var response = eval(data);
			prompt.id = response[0].id;
		});
}

function getTopLevelGraphsForStudentProject(course, project, student, displayFunction){
	$.post('/graphs_top',
		{projectName : project.title, courseName: course.title, courseYear: course.year, courseSemester: course.semester, studentEmail: student.title},
		function(data, status){
			console.log("Data: " + data);
			var response = eval(data);
			for(var j=0; j<response.length; j++){
				var graphInfo = response[j].graphInfo;
				var nodeInfo = response[j].nodeInfo;
				var edgeInfo = response[j].edgeInfo;
			
				var graph = new Graph();
				graph.id = graphInfo.id;
				graph.parent = false;
				graph.version = graphInfo.version;
			
				for(var i=0; nodeInfo && i<nodeInfo.length; i++){
					var node = new Node(nodeInfo[i].name, nodeInfo[i].description);
					console.log("nodeinfo: " + JSON.stringify(nodeInfo[i]));
					node.id = nodeInfo[i].id;
					node.x = nodeInfo[i].x;
					node.y = nodeInfo[i].y;
					node.color = nodeInfo[i].color;
					graph.addNode(node);
				}
			
				for(var i=0; edgeInfo && i<edgeInfo.length; i++){
					var source = graph.getNodeWithId(edgeInfo[i].src);
					var destination = graph.getNodeWithId(edgeInfo[i].dst);
					if(source && destination)
						source.addChild(destination);
				}
				student.getGraphHistoryOf(project).addGraph(graph);
			}
			uniqueID = -1;
			displayFunction();
		});
}

function getSubGraph(parentNode, project, student, displayFunction){
	console.log("getSubGraph called");
	$.post('/graph',
		{parentNodeId: parentNode.id},
		function(data, status){
			console.log("subgraph Data: " + data);
			var response = eval("[" + data + "]"); //got invalid label error if data wasn't an array
			console.log(response.length);
			for(var j=0; j<response.length; j++){
				var graphInfo = response[j].graphInfo;
				//console.log(JSON.stringify(graphInfo));
				var nodeInfo = response[j].nodeInfo;
				var edgeInfo = response[j].edgeInfo;
			
				var graph = new Graph();
				graph.id = (graphInfo) ? (graphInfo.id || -1) : -1;
				console.log("Graph id: " + graph.id);
				graph.parent = parentNode;
				graph.version = parentNode.graph.version;
			
				for(var i=0; nodeInfo && i<nodeInfo.length; i++){
					var node = new Node(nodeInfo[i].name, nodeInfo[i].description);
					console.log("nodeinfo: " + JSON.stringify(nodeInfo[i]));
					node.id = nodeInfo[i].id;
					node.x = nodeInfo[i].x;
					node.y = nodeInfo[i].y;
					node.color = nodeInfo[i].color;
					graph.addNode(node);
				}
			
				for(var i=0; edgeInfo && i<edgeInfo.length; i++){
					var source = graph.getNodeWithId(edgeInfo[i].src);
					var destination = graph.getNodeWithId(edgeInfo[i].dst);
					if(source && destination)
						source.addChild(destination);
				}
				parentNode.subgraph = graph;
				if(graph.id < 0)
					createGraph(graph);
				displayFunction();
			}
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

function createNode(node){
	var postNode = function(){
		var nodeInfo = {x: Math.round(node.x), y: Math.round(node.y), graphId: node.graph.id, name: node.data, description: node.description, color: node.color};
		$.post('/create_node',
			{"nodeInfo": nodeInfo},
			function(data, status) {
				var response = eval(data);
				node.id = response[0].id;
				console.log("data: " + data);
		});
	}
	
	
	console.log("graphid: " + node.graph.id);
	if(node.graph.id > 0){
		postNode();
	}
	else{
		var interval = setInterval(function(){
			if(node.graph.id > 0){
				postNode();
				clearInterval(interval);
			}
		}, 500);
	}
}

function updateNode(node){
	var postUpdateNode = function(){
		var nodeInfo = {id: node.id, x: Math.round(node.x), y: Math.round(node.y), graphId: node.graph.id, name: node.data, description: node.description, color: node.color};
		$.post('/update_node',
			{"nodeInfo": nodeInfo},
			function(data, status) {
				console.log("data: " + data);
		});
	}
	
	if(node.id > 0 && node.graph.id > 0){
		console.log("update");
		postUpdateNode();
	}
	else{
		var interval = setInterval(500, function(){
			if(node.id > 0 && node.graph.id > 0){
				console.log("update in interval");
				postUpdateNode();
				clearInterval(interval);
			}
		});
	}
}

function deleteNode(node){
	var nodeInfo = {id: node.id};
	$.post('/delete_node',
		{"nodeInfo": nodeInfo},
		function(data, status) {
			console.log("data: " + data);
	});
}

function createEdge(edge){
	var postEdge = function(){
		var edgeInfo = {sourceNode: edge.sourceNode.id, destNode: edge.destNode.id, graphId: edge.sourceNode.graph.id};
		$.post('/create_edge',
			{"edgeInfo": edgeInfo},
			function(data, status) {
				console.log("data: " + data);
		});
	}
	
	if(edge.sourceNode.id > 0 && edge.destNode.id > 0){
		postEdge();
	}
	else{
		var interval = setInterval(function(){
			if(edge.sourceNode.id > 0 && edge.destNode.id > 0){
				postEdge();
				clearInterval(interval);
			}
		}, 500);
	}
}

function deleteEdge(edge){
	var postRemoveEdge = function(){
		var edgeInfo = {sourceNode: edge.sourceNode.id, destNode: edge.destNode.id, graphId: edge.sourceNode.graph.id};
		$.post('/delete_edge',
			{"edgeInfo": edgeInfo},
			function(data, status) {
				console.log("data: " + data);
		});
	}
	
	if(edge.sourceNode.id > 0 && edge.destNode.id > 0){
		postRemoveEdge();
	}
	else{
		var interval = setInterval(function(){
			if(edge.sourceNode.id > 0 && edge.destNode.id > 0){
				postRemoveEdge();
				clearInterval(interval);
			}
		}, 500);
	}
}

function createGraph(graph){
	//get top level graph
	var currentGraph = graph;
	
	var postGraph = function(){
		while(currentGraph.parent){
			currentGraph = currentGraph.parent.graph;
		}
		var topLevelGraphHistory = currentGraph.graphHistory;
	
		var reqData = {};
		reqData.studentEmail = topLevelGraphHistory.student.title;
		reqData.courseName = topLevelGraphHistory.project.course.title;
		reqData.courseYear = topLevelGraphHistory.project.course.year;
		reqData.courseSemester = topLevelGraphHistory.project.course.semester;
		reqData.projectName = topLevelGraphHistory.project.title;
		reqData.graphInfo = {id: graph.id, parentNodeId: graph.parent ? graph.parent.id : -1, version: graph.version, description: "No description"};
	
		$.post('/create_graph',
			reqData,
			function(data, status) {
				console.log("data: " + data);
				var response = eval(data);
				graph.id = response[0].id;
				console.log("GRAPH ID SET");
		});
	}
	if(!currentGraph.parent){
		postGraph();
	}
	else{
		if(currentGraph.parent.id > 0){
			postGraph();
		}
		else{
			var interval = setInterval(function(){
				console.log("parent id not set");
				if(currentGraph.parent.id > 0){
					postGraph();
					clearInterval(interval);
				}
			}, 500);
		}
	}
}

function updateGraph(graph, delayedCallback){
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
			if(delayedCallback)
				delayedCallback();
		});
}







