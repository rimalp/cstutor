//---------------------- GET ------------------------------
function getCoursesForStudent(student, callback){
	$.post('/courses_student',
		{email: student.title},
		callback);
}
function getCoursesForProfessor(professor, callback){
	$.post('/courses_professor',
		{email: professor.title},
		function(data, status){
			callback(data, status);
		});
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
			var response = eval(data);
			prompt.id = response[0].id;
		});
}

function updatePrompt(prompt, project){
	$.post('/update_prompt',
		{id: prompt.id, projectName: project.title, courseName: project.course.title, courseYear: project.course.year, courseSemester: project.course.semester, text: prompt.text, requiresInput: prompt.requiresInput?1:0, eventType: prompt.eventType, frequency: prompt.frequency},
		function(data, status){
		});
}

function deletePrompt(prompt, project){
	$.post('/delete_prompt',
		{id: prompt.id},
		function(data, status){
		});
}

function getResponsesForGraph(graph, graphHistory, displayFunction){
	$.post('/responses',
		{graphId: graph.id},
		function(data, status){
			var message = eval(data);
			for(var i=0; i<message.length; i++){
				var prompt = graphHistory.project.getPromptWithId(message[i].promptid);
				var response = new Response(prompt);
				response.id = message[i].id;
				response.graph = graph;
				response.text = message[i].text;
				graphHistory.addResponse(response);
			}
			if(displayFunction){
				displayFunction();
			}
		});
}

function createResponse(response){
	$.post('/create_response',
		{id: response.id, promptId: response.prompt.id, graphId: response.graph.id, text: response.text},
		function(data, status){
		});
}

function getTopLevelGraphsForStudentProject(course, project, student, displayFunction){
	$.post('/graph_full',
		{projectName : project.title, courseName: course.title, courseYear: course.year, courseSemester: course.semester, studentEmail: student.title},
		function(data, status){
			var response = eval(data);
			
			var graphs = new Array();
			var nodes = new Array();
			for(var i=0; i<response.length; i++){
				var graphInfo = response[i].graphInfo;
				var nodeInfo = response[i].nodeInfo;
				var edgeInfo = response[i].edgeInfo;
				
				var graph = new Graph();
				graph.id = graphInfo.id;
				if(graphInfo.parentnodeid<=0){
					graph.parent = false;
					student.getGraphHistoryOf(project).addGraph(graph);
				}
				else{
					graph.parent = graphInfo.parentnodeid;
				}
				graph.version = graphInfo.version;
				
				for(var j=0; nodeInfo && j<nodeInfo.length; j++){
					var node = new Node(nodeInfo[j].name, nodeInfo[j].description);
					node.id = nodeInfo[j].id;
					node.id = nodeInfo[j].id;
					node.x = nodeInfo[j].x;
					node.y = nodeInfo[j].y;
					node.owner = graph.parent;
					node.color = nodeInfo[j].color;
					graph.addNode(node);
					nodes.push(node);
				}
				
				for(var j=0; edgeInfo && j<edgeInfo.length; j++){
					var source = graph.getNodeWithId(edgeInfo[j].src);
					var destination = graph.getNodeWithId(edgeInfo[j].dst);
					if(source && destination)
						source.addChild(destination);
				}
				graphs.push(graph);
			}
			
			for(var i=0; i<graphs.length; i++){
				var graph = graphs[i];
				if(graph.parent > 0){
					for(var j=0; j<nodes.length; j++){
						var node = nodes[j];
						if(graph.parent == node.id){
							graph.parent = node;
							node.subgraph = graph;
						}
					}
				}
			}
			
			for(var i=0; i<nodes.length; i++){
				var node = nodes[i];
				if(node.owner > 0){
					for(j=0; j<nodes.length; j++){
						var node2 = nodes[j];
						if(node.owner == node2.id){
							node.owner = node2;
						}
					}
				}
			}
			
			//get responses
			var graphHistory = student.getGraphHistoryOf(project);
			for(var i=0; i<graphHistory.graphs.length; i++){
				var graph = graphHistory.graphs[i];
				getResponsesForGraph(graph, graphHistory, (i==graphHistory.graphs.length-1) ? displayFunction : false);
			}
			
			if(graphHistory.graphs.length == 0)
				displayFunction();
		});
}
/*
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
			
			//get responses
			var graphHistory = student.getGraphHistoryOf(project);
			for(var i=0; i<graphHistory.graphs.length; i++){
				var graph = graphHistory.graphs[i];
				getResponsesForGraph(graph, graphHistory, (i==graphHistory.graphs.length-1) ? displayFunction : false);
			}
			
			if(graphHistory.graphs.length == 0)
				displayFunction();
		});
}
*/
function getSubGraph(parentNode, project, student, displayFunction){
	$.post('/graph',
		{parentNodeId: parentNode.id},
		function(data, status){
			var response = eval("[" + data + "]"); //got invalid label error if data wasn't an array
			for(var j=0; j<response.length; j++){
				var graphInfo = response[j].graphInfo;
				//console.log(JSON.stringify(graphInfo));
				var nodeInfo = response[j].nodeInfo;
				var edgeInfo = response[j].edgeInfo;
			
				var graph = new Graph();
				graph.id = (graphInfo) ? (graphInfo.id || -1) : -1;
				graph.parent = parentNode;
				graph.version = parentNode.graph.version;
			
				for(var i=0; nodeInfo && i<nodeInfo.length; i++){
					var node = new Node(nodeInfo[i].name, nodeInfo[i].description);
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
		});
}

function createStudent(student){
	$.post('/create_professor',
		{email: student.title, lastName: student.lastName, firstName: student.firstName, password: student.password},
		function(data, status) {
		});
}

function createCourse(course, professor, callback){
	$.post('/create_course',
		{courseName: course.title, courseYear: course.year, courseSemester: course.semester, professorEmail: professor.title},
		function(data, status) {
		  var response = eval(data);
		  callback(response); //calls the callback function inside menu.js createNewCourse() method		  
		});
}

function addStudents(course, student){
	$.post('/add_students',
		{courseName: course.title, courseYear: course.year, courseSemester: course.semester, studentEmail: student.email},
		function(data, status) {
		});
}

function createProject(project, course){
	$.post('/create_project',
		{projectName: project.title, projectDescription: "", courseName: course.title, courseYear: course.year, courseSemester: course.semester},
		function(data, status) {
		});
}

function createNode(node, showFunction){
	var postNode = function(){
		var nodeInfo = {x: Math.round(node.x), y: Math.round(node.y), graphId: node.graph.id, name: node.data, description: node.description, color: node.color};
		$.post('/create_node',
			{"nodeInfo": nodeInfo},
			function(data, status) {
				var response = eval(data);
				node.id = response[0].id;
				if(showFunction)
					showFunction();
		});
	}
	
	
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
		});
	}
	
	if(node.id > 0 && node.graph.id > 0){
		postUpdateNode();
	}
	else{
		var interval = setInterval(500, function(){
			if(node.id > 0 && node.graph.id > 0){
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
			
	});
}

function createEdge(edge, showFunction){
	var postEdge = function(){
		var edgeInfo = {sourceNode: edge.sourceNode.id, destNode: edge.destNode.id, graphId: edge.sourceNode.graph.id};
		$.post('/create_edge',
			{"edgeInfo": edgeInfo},
			function(data, status) {
				if(showFunction)
					showFunction();
		});
	}
	
	if(edge.sourceNode.id > 0 && edge.destNode.id > 0){
		postEdge();
	}
	else{
		var interval = setInterval(function(){
			if(edge.sourceNode.id > 0 && edge.destNode.id > 0){
				clearInterval(interval);
				postEdge();
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

function createGraph(graph, showFunction){
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
				var response = eval(data);
				graph.id = response[0].id;
				if(showFunction)
					showFunction();
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
			var maxId = eval(data)[0].maxnodeid;
			graph.id = eval(data)[0].newGraphId;
			
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







