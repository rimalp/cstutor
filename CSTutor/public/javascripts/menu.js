var table;
var menu;
var detail_view, detail_view_container, center_header;
var mode = "admin";
var userId = "Jack";
var currentProject = false;
var currentStudent = false;

var Base = function(title){
	this.title = title;
};
Base.prototype = {
	getLink : function(){
		return this.title;	//extend this method
	},
	getLinkType : function(){
		return "nothing";
	}
};

var Course = function(title){
	Base.call(this, title);
	this.year = 2013;
	this.semester = "Fall";
	this.projects = new Array();
	this.students = new Array();
};
Course.prototype = new Base();
Course.prototype.getLink = function(){
	return this.projects;
};
Course.prototype.getLinkType = function(){
	return "Projects";
};
Course.prototype.addStudent = function(student){
	this.students[this.students.length] = student;
};
Course.prototype.getJSON = function(){
	return {courseName: this.title, courseYear: this.year, couresSemester: this.semester};
};
Course.prototype.constructor = Course;

var Student = function(title){
	Base.call(this, title);
	this.firstName = "";
	this.lastName = "";
	this.password = "";
	this.isAdmin = false;//use this
	
	this.graphHistories = new Array();
};
Student.prototype = new Base();
Student.prototype.getLink = function(){
	var retVal = this.getGraphHistoryOf(currentFocus);
	if(!retVal)
		return false;
	
	return retVal.graphs;
}
Student.prototype.getLinkType = function(){
	return "Graphs";
}
Student.prototype.getGraphHistoryOf = function(project){
	//console.log(this.title + " " + project.title);
	for(i in this.graphHistories){
		if(this.graphHistories[i].project == project){
			return this.graphHistories[i];
		}
	}
	return false;
}
Student.prototype.getJSON = function(){
	return {email: this.title, firstName: this.firstName, lastName: this.lastName, password: this.password, admin: this.isAdmin};
};
Student.prototype.constructor = Student;

var Project = function(title, course){
	Base.call(this, title);
	this.course = course;
	course.projects[course.projects.length] = this;
	this.prompts = new Array();
}
Project.prototype = new Base();
Project.prototype.getLink = function(){
	if(mode == "admin"){
		return this.course.students;
	}
	else if(mode = "student"){
		for(var i=0; i<this.course.students.length; i++){
			var student = this.course.students[i];
			if(userId == student.title){
				var graphHistory = student.getGraphHistoryOf(this);
				return graphHistory.graphs;
			}
		}
	}
}
Project.prototype.executeNewVersionPrompts = function(student){
	for(var i=0; i<this.prompts.length; i++){
		var current = this.prompts[i];
		if(current.eventType == "version"){
			student.getGraphHistoryOf(this).addResponse(current.execute());
		}
	}
};
Project.prototype.executeNodeFrequencyPrompts = function(student, nodeCount){
	for(var i=0; i<this.prompts.length; i++){
		var current = this.prompts[i];
		if(current.eventType == "frequency" && currentGraph.nodes.length%current.frequency == 0){
			student.getGraphHistoryOf(this).addResponse(current.execute());
		}
	}
};
Project.prototype.getJSON = function(){
	return {name: this.title, course_name: this.course.title, course_year: this.course.year, course_semester: this.course.semester};
};
Project.prototype.getLinkType = function(){
	return "Students";
}
Project.prototype.constructor = Project;

var GraphHistory = function(student, project){
	this.graphs = new Array();
	this.responses = new Array();
	this.student = student;
	this.project = project;
};
GraphHistory.prototype.addGraph = function(graph){
	if(this.graphs.length > 0){
		var previous = this.graphs[this.graphs.length-1];
		previous.title = previous.title.substring(0, previous.title.length-9);
	}
	graph.version = this.graphs.length+1;
	graph.title = "Graph Ver. " + (this.graphs.length+1) + "(Current)";
	this.graphs[this.graphs.length] = graph;
	graph.graphHistory = this;
};
GraphHistory.prototype.addResponse = function(response){
	this.responses[this.responses.length] = response;
};

var Prompt = function(text, requiresInput, eventType, frequency/*optional*/){
	this.text = text;
	this.requiresInput = requiresInput;
	this.eventType = eventType;	//version, save, frequency
	this.frequency = frequency;
};
Prompt.prototype = {
	execute: function(){
		var response = new Response(this);
		response.versionWhenAnswered = currentGraph.version;
		
		if(this.requiresInput)
			response.text = prompt(this.text);
		else
			alert(this.text);
		
		return response;
	}
};

var Response = function(prompt){
	this.prompt = prompt;
	this.text = "";
	this.versionWhenAnswered = 0;	//what version of the graph the student was working on when the prompt was answered
}

var courses = new Array();
getCoursesForStudent({title: 'kellerj@lafayette.edu'}, 
function(data, status){
	var response = eval(data);
	for(var i=0; i<response.length; i++){
		var course = new Course(response[i].name);
		course.year = response[i].year;
		course.semester = response[i].semester;
		courses[i] = course;
	}
});
/*
var cs150 = new Course("CS 150");

var jack = new Student("Jack");
var bob = new Student("Bob");
var jeff = new Student("Jeff");
var tom = new Student("Tom");
cs150.addStudent(jack);
cs150.addStudent(bob);
cs150.addStudent(jeff);
cs150.addStudent(tom);

var lab1 = new Project("Lab 1", cs150);
var lab2 = new Project("Lab 2", cs150);

var graph1 = new Graph();
var node1 = new Node("node1", "description");
var node2 = new Node("node2", "description");
var node3 = new Node("node3", "description");
var node4 = new Node("node4", "description");
graph1.addNode(node1);
graph1.addNode(node2);
graph1.addNode(node3);
graph1.addNode(node4);

var graph2 = new Graph();
var node5 = new Node("node5", "description");
var node6 = new Node("node6", "description");
var node7 = new Node("node7", "description");
var node8 = new Node("node8", "description");
graph2.addNode(node5);
graph2.addNode(node6);
graph2.addNode(node7);
graph2.addNode(node8);

jack.graphHistories[0] = new GraphHistory(jack, lab1);
jack.graphHistories[0].addGraph(graph1);
jack.graphHistories[0].addGraph(graph2);


var cs205 = new Course("CS 205");

courses[0] = cs150;
courses[1] = cs205;
*/
function init(){
	/*menu = document.getElementById("menu");
	var listTitle = document.createElement('li');
	listTitle.className = "nav-header";
	listTitle.innerHTML = userId;
	menu.appendChild(listTitle);
	addSubMenu(menu, courses);*/
	onload();
	detail_view = document.getElementById("detail_view");
	detail_view_container = document.getElementById("detail_view_container");
	center_header = document.getElementById("center_header");
	if(mode == "admin"){
		showDetailView();
	}
	else {
		showCanvas();
	}
}

function addSubMenu(li, array){
	var ul = document.createElement('ul');
	ul.className = "nav nav-list";
	
	for(var i=0; i<array.length; i++){
		var newLi = document.createElement('li');
		newLi.innerHTML = "<a href='#'>" + array[i].title + "</a>";
		var link = array[i].getLink();
		if(link != "graph")
			newLi.onclick = getSubMenuOnClickFunction(newLi, ul, array[i]);
		else
			newLi.onclick = getGraphOnClickFunction(newLi, ul, array[i]);
		ul.appendChild(newLi);
		
		if(mode == "student" && link == "graph" && i==array.length-1){
			var newVersionLi = document.createElement('li');
			newVersionLi.innerHTML = "<a href='#'>Create New Version</a>";
			newVersionLi.onclick = function(e){
				e.stopPropagation();
				var graph = array[array.length-1];
				graph.graphHistory.addGraph(graph.clone(false));
				while(li.firstChild.nextSibling)
					li.removeChild(li.firstChild.nextSibling);
				addSubMenu(li, graph.graphHistory.graphs);
				
			};
			ul.appendChild(newVersionLi);
		}
	}
	
	li.appendChild(ul);
}

function getGraphOnClickFunction(li, ul, graph){
	return function(e){
		e.stopPropagation();
		if(li.className == "active"){
			li.className = "";
			contractAll();
			graph.hide();
		}
		else{
			var child = ul.firstChild;
			while(child){
				child.className = "";
				child = child.nextSibling;
			}
			li.className = "active";
			contractAll();
			currentGraph.hide();
			graph.show();
			currentGraph = graph;
		}
	};
}

var currentFocus = false;
function getSubMenuOnClickFunction(li, ul, item){
	//console.log(item.title + " " + item.getLink() + " " + currentFocus.title);
	var link = item.getLink();
	return function(e){
		e.stopPropagation();
		if(false && li.className == "active"){
			li.className = "";
			var firstChild = li.firstChild;
			while(li.firstChild){
				li.removeChild(li.firstChild);
			}
			li.appendChild(firstChild);
		}
		else{
			var child = ul.firstChild;
			while(child){
				child.className = "";
				while(child.firstChild.nextSibling)
					child.removeChild(child.firstChild.nextSibling);
				child = child.nextSibling;
			}
			li.className = "active";
			currentFocus = item;
			addSubMenu(li, link);
		}
	};
}

function displayNewProject(course, project, back){
	clearDetailView();
	showDetailView();
	
	if(!back)
		backButtonStack.push(getButtonDiv("New Project for " + course.title, function(){backButtonStack.pop(); displayNewProject(course, project, true);}));
	setTitle("New Project for " + course.title, backButtonStack[backButtonStack.length-2]);
	
	//Prompts
	var promptArray = (!project)? new Array() : project.prompts;
	
	var titleDiv = document.createElement("div");
	var titleLabel = document.createElement("p");
	titleLabel.innerHTML = "Title:";
	titleLabel.style = "display: inline;";
	titleDiv.appendChild(titleLabel);
	
	var titleInput = document.createElement("input");
	titleInput.value = (!project)? "": project.title;
	titleDiv.appendChild(titleInput);
	
	var promptDiv = document.createElement("div");
	var newQuestion = document.createElement("a");
	newQuestion.innerHTML = "New Prompt/Question...";
	newQuestion.onclick = function(){promptArray[promptArray.length] = new Prompt("", false, "version"); addNewPrompt(promptArray, promptArray.length-1, promptDiv)};
	promptDiv.appendChild(newQuestion);
	
	for(var i=0; i<promptArray.length; i++){
		addNewPrompt(promptArray, i, promptDiv);
	}
	
	var confirmDiv = document.createElement("div");
	var doneButton = document.createElement("button");
	doneButton.innerHTML = "Done";
	doneButton.onclick = function(){
					if(!project){
						project = new Project(titleInput.value, course);
						project.prompts = promptArray;
					}
					else{
						project.title = titleInput.value;
					}
					backButtonStack[backButtonStack.length-2].firstChild.onclick();//simulate back button click
				};
	confirmDiv.appendChild(doneButton);
	
	/*var cancelButton = document.createElement("button");
	cancelButton.innerHTML = "Cancel";
	cancelButton.onclick = function(){
					backButtonStack[backButtonStack.length-2].firstChild.onclick();//simulate back button click
				};
	confirmDiv.appendChild(cancelButton);*/
	
	detail_view.appendChild(titleDiv);
	detail_view.appendChild(promptDiv);
	detail_view.appendChild(confirmDiv);
}

function addNewPrompt(promptArray, index, parent){
	var prompt = promptArray[index];
	var last = parent.removeChild(parent.lastChild);
	
	var div = document.createElement("div");
	
	// Prompt or Question
	var actionDropdown = document.createElement("select");
	actionDropdown.id = "dropdown";
	var promptOption = document.createElement("option");
	promptOption.value = "prompt";
	promptOption.innerHTML = "Prompt";
	promptOption.onclick = function(){prompt.requiresInput = false;};
	actionDropdown.appendChild(promptOption);
	
	var questionOption = document.createElement("option");
	questionOption.value = "question";
	questionOption.innerHTML = "Question";
	questionOption.onclick = function(){prompt.requiresInput = true;};
	actionDropdown.appendChild(questionOption);
	div.appendChild(actionDropdown);
	
	if(prompt.requiresInput)
		actionDropdown.selectedIndex = 1;
	
	var text1 = document.createElement("p");
	text1.style = "display: inline;";
	text1.innerHTML = " the student when ";
	div.appendChild(text1);
	
	// When to trigger prompt/question
	var eventDropdown = document.createElement("select");
	
	var frequencyInput = document.createElement("input");
	
	var versionOption = document.createElement("option");
	versionOption.value = "version";
	versionOption.innerHTML = "a new version is created";
	versionOption.onclick = function(){
					prompt.eventType = "version";
					frequencyInput.style.visibility = "hidden";
					frequencyInput.style.width = "0px";
				};
	eventDropdown.appendChild(versionOption);
	
	var saveOption = document.createElement("option");
	saveOption.value = "save";
	saveOption.innerHTML = "a version is saved";
	saveOption.onclick = function(){
				prompt.eventType = "save";
				frequencyInput.style.visibility = "hidden";
				frequencyInput.style.width = "0px";
			};
	eventDropdown.appendChild(saveOption);
	
	var frequencyOption = document.createElement("option");
	frequencyOption.value = "frequency";
	frequencyOption.innerHTML = "the number of nodes is a multiple of";
	frequencyOption.onclick = function(){
					prompt.eventType = "frequency";
					frequencyInput.style.visibility = "visible";
					frequencyInput.style.width = "30px";
				};
	eventDropdown.appendChild(frequencyOption);
	div.appendChild(eventDropdown);
	
	frequencyInput.style = "visibility: hidden; width: 0px;";
	frequencyInput.oninput = function(){
					prompt.frequency = parseInt(frequencyInput.value);
				};
	div.appendChild(frequencyInput);
	
	if(prompt.eventType == "save")
		eventDropdown.selectedIndex = 1;
	else if(prompt.eventType == "frequency")
		eventDropdown.selectedIndex = 2;
	
	// Remaining text and cancel button
	var text2 = document.createElement("p");
	text2.style = "display: inline;";
	text2.innerHTML = "with this text:";
	div.appendChild(text2);
	
	var textarea = document.createElement("textarea");
	textarea.style.verticalAlign = "top";
	textarea.value = prompt.text;
	textarea.oninput = function(){
				prompt.text = textarea.value;
			};
	div.appendChild(textarea);
	
	var deleteButton = document.createElement("button");
	deleteButton.value = "delete";
	deleteButton.innerHTML = "delete";
	deleteButton.style = "float: right;";
	deleteButton.onclick = function(){
					parent.removeChild(div);
					promptArray.splice(promptArray.indexOf(prompt), 1);
				};
	div.appendChild(deleteButton);
	
	parent.appendChild(div);
	parent.appendChild(last);
}

var backButtonStack = new Array();

function displayDetail(courses){
	clearDetailView();
	showDetailView();
	
	setTitle("Courses");
	backButtonStack.push(getButtonDiv("Courses", function(){backButtonStack.pop(); displayDetail(courses);}));
	var courseDiv = document.createElement("div");
	getInfoBoxes("", courses, courseDiv, coursesToCourseOnClickMaker, function(){return "";});
	
	detail_view.appendChild(courseDiv);
}

function displayDetailCourse(course, back){
	clearDetailView();
	showDetailView();
	
	if(!back)
		backButtonStack.push(getButtonDiv(course.title, function(){backButtonStack.pop(); displayDetailCourse(course, true);}));
	setTitle(course.title, backButtonStack[backButtonStack.length-2]);
	
	var projectDiv = document.createElement("div");
	getInfoBoxes("Projects", course.projects, projectDiv, courseToProjectOnClickMaker, function(){return "";}, function(){displayNewProject(course);});
	var studentDiv = document.createElement("div");
	getInfoBoxes("Students", course.students, studentDiv, getCourseToStudentOnClickMaker(course), function(){return "";});
	
	detail_view.appendChild(projectDiv);
	detail_view.appendChild(studentDiv);
}

function displayDetailProject(project, back){
	clearDetailView();
	showDetailView();
	
	if(!back)
		backButtonStack.push(getButtonDiv(project.title, function(){backButtonStack.pop(); displayDetailProject(project, true);}));
	setTitle(project.title, backButtonStack[backButtonStack.length-2]);
	
	var studentDiv = document.createElement("div");
	getInfoBoxes("Students", project.course.students, studentDiv, getProjectToStudentOnClickMaker(project), function(){return "";});
	
	var promptDiv = document.createElement("div");
	promptDiv.innerHTML = "<header class='header' id='detail_header'><h1 id='detail_title'>Prompts/Questions</h1></header>";
	for(var i=0; i<project.prompts.length; i++){
		var current = project.prompts[i];
		promptDiv.innerHTML += (current.requiresInput ? "Question " : "Prompt ") + "the student when " + (current.eventType == "version" ? "a vew version is created " : (current.eventType == "save" ? "a version is saved " : "the number of nodes is a multiple of " + current.frequency + " ")) + "with this text: " + current.text + "<br>";
		
	}
	
	
	var editButton = document.createElement("button");
	editButton.innerHTML = "Edit Lab";
	editButton.style = "float: right;";
	editButton.onclick = function(){displayNewProject(project.course, project);};
	
	detail_view.appendChild(studentDiv);
	detail_view.appendChild(promptDiv);
	detail_view.appendChild(editButton);
}

function displayDetailStudent(student, course, back){
	clearDetailView();
	showDetailView();
	
	if(!back)
		backButtonStack.push(getButtonDiv(student.title, function(){backButtonStack.pop(); displayDetailStudent(student, course, true);}));
	setTitle(student.title, backButtonStack[backButtonStack.length-2]);
	
	var projectDiv = document.createElement("div");
	getInfoBoxes("Projects", course.projects, projectDiv, getStudentToProjectOnClickMaker(student), function(){return "";});
	
	detail_view.appendChild(projectDiv);
}

function displayDetailStudentProject(student, project, back){
	clearDetailView();
	showDetailView();
	
	if(!back)
		backButtonStack.push(getButtonDiv(student.title + "'s " + project.title, function(){backButtonStack.pop(); displayDetailStudentProject(student, project, true);}));
	setTitle(student.title + "'s " + project.title, backButtonStack[backButtonStack.length-2]);
	
	var graphDiv = document.createElement("div");
	getInfoBoxes("Graphs", student.getGraphHistoryOf(project).graphs, graphDiv, studentProjectToGraphOnClickMaker, function(){return "";}, newGraphFunction);
	currentProject = project;
	currentStudent = student;
	
	var promptDiv = document.createElement("div");
	promptDiv.innerHTML = "<header class='header' id='detail_header'><h1 id='detail_title'>Prompts/Questions</h1></header>";
	var graphHistory = student.getGraphHistoryOf(project);
	for(var i=0; i<graphHistory.responses.length; i++){
		var response = graphHistory.responses[i];
		var prompt = response.prompt;
		var text = document.createElement("p");
		if(prompt.requiresInput){
			text.innerHTML += "<br>Asked " + student.title + ": \"" + prompt.text + "\" when " + ((prompt.eventType == "version") ? "a new version was created " : ((prompt.eventType == "frequency") ? "the number of nodes was a multiple of " : "a version was saved ")) + ". ";
			text.innerHTML += student.title + " answered:\"" + response.text + "\"";
		}
		else{
			text.innerHTML += "<br>Prompted " + student.title + " when " + ((prompt.eventType == "version") ? "a new version was created " : ((prompt.eventType == "frequency") ? "the number of nodes was a multiple of " : "a version was saved ")) + "with: \"" + prompt.text + "\"";
		}
		promptDiv.appendChild(text);
	}
	
	detail_view.appendChild(graphDiv);
	detail_view.appendChild(promptDiv);
}

function newGraphFunction(){
	var currentGraphHistory = currentStudent.getGraphHistoryOf(currentProject);
	var newGraph = currentGraphHistory.graphs[currentGraphHistory.graphs.length-1].clone();
	currentGraphHistory.addGraph(newGraph);
	showGraph(newGraph);
	currentProject.executeNewVersionPrompts(currentStudent);
}

function showGraph(graph, back){
	if(!back)
		backButtonStack.push(getButtonDiv(graph.title, function(){backButtonStack.pop(); showGraph(graph, true);}));
	setTitle(graph.title, backButtonStack[backButtonStack.length-2]);
	
	showCanvas();
	currentGraph.hide();
	graph.show();
	currentGraph = graph;
};

function setTitle(title, leftDiv, rightDiv){
	var h1 = document.createElement("h1");
	
	leftDiv = leftDiv || document.createElement("div");
	leftDiv.style = "float: left";
	h1.appendChild(leftDiv);
	
	rightDiv = rightDiv || document.createElement("div");
	rightDiv.style = "float: right";
	h1.appendChild(rightDiv);
	
	var titleText = document.createElement("div");
	titleText.style = "margin: 0 auto;";
	titleText.innerHTML = title;
	h1.appendChild(titleText);
	
	center_header.innerHTML = "";
	center_header.appendChild(h1);
}

function getButtonDiv(title, onclick){
	var div = document.createElement("div");
	var button = document.createElement("button");
	button.innerHTML = title;
	button.onclick = onclick;
	div.appendChild(button);
	return div;
}

//------------ On Click Makers -----------------

function coursesToCourseOnClickMaker(course){
	return function(){
		displayDetailCourse(course);	
	};
}

function courseToProjectOnClickMaker(project){
	return function(){
		displayDetailProject(project);
	};
}

function getCourseToStudentOnClickMaker(course){
	return function(student){
		return function(){
			displayDetailStudent(student, course);
		}
	}
}

function getProjectToStudentOnClickMaker(project){
	return function projectToStudentOnClickMaker(student){
		return function(){
			console.log(student.title + " " + project.title);
			displayDetailStudentProject(student, project);
		};
	}
}

function getStudentToProjectOnClickMaker(student){
	return function studentToProjectOnClickMaker(project){
		return function(){
			displayDetailStudentProject(student, project);
		};
	}
}

function studentProjectToGraphOnClickMaker(graph){
	return function(){
		showGraph(graph);
	};
}
//-----------------------------------------------

//--------------- Picture Getters ---------------

//-----------------------------------------------

function getInfoBoxes(title, array, parent, onClickMaker, getImagePath, newFunction){
	parent.innerHTML = "<header class='header' id='detail_header'><h1 id='detail_title'>" + title + "</h1></header>";
	
	for(var i=0; i<array.length; i++){
		var current = array[i];
		var div = document.createElement("div");
		div.id = current.title;
		div.className = "info_block";
		div.innerHTML = "<img class='info_content' width='50' height='50' src='" + getImagePath() + "'>";
		var link = document.createElement("a");
		link.className = "info_content";
		link.onclick = onClickMaker(current);
		link.innerHTML = current.title;
		div.appendChild(link);
		
		parent.appendChild(div);
	}
	
	if(newFunction){
		var div = document.createElement("div");
		div.className = "info_block";
		div.innerHTML = "<img class='info_content' width='50' height='50' src=''>";
		var link = document.createElement("a");
		link.className = "info_content";
		link.onclick = newFunction;
		link.innerHTML = "New...";
		div.appendChild(link);
		parent.appendChild(div);
	}
	
}

function showDetailView(){
	detail_view_container.className = "center_container";
	canvas.className = "hidden";
}

function showCanvas(){
	canvas.className = "center_container";
	detail_view_container.className = "hidden";
}

function clearDetailView(){
	detail_view.innerHTML = "";
}


