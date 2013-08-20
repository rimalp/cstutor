var table;
var menu;
var detail_view, detail_view_container, center_header;
var mode = "admin";
var userId = "Jack";
var currentProject = false;
var currentStudent = false;
var currentCourse = false;

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
	student.courses[student.courses.length] = this;
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
	this.courses = new Array();
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
	//look for graph history
	for(i in this.graphHistories){
		if(this.graphHistories[i].project == project){
			return this.graphHistories[i];
		}
	}
	
	//if its not there, create one if there should be one
	for(var i=0; i<this.courses.length; i++){
		var course = this.courses[i];
		var index = course.projects.indexOf(project);
		if(index >= 0){
			var newGraphHistory = new GraphHistory(this, project);
			this.graphHistories[this.graphHistories.length] = newGraphHistory;
			return newGraphHistory;
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
		if(current.eventType == "frequency" && nodeCount%current.frequency == 0){
			student.getGraphHistoryOf(this).addResponse(current.execute());
		}
	}
};
Project.prototype.getPromptWithId = function(id){
	for(var i=0; i<this.prompts.length; i++){
		var prompt = this.prompts[i];
		if(prompt.id == id)
			return prompt;
	}
	return false;
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
	this.id = -1;
	this.text = text;
	this.requiresInput = requiresInput;
	this.eventType = eventType;	//version, save, frequency
	this.frequency = frequency || 0;
};
Prompt.prototype = {
	execute: function(){
		var response = new Response(this);
		response.graph = currentGraph;
		
		if(this.requiresInput)
			response.text = prompt(this.text);
		else
			alert(this.text);
		createResponse(response);
		
		return response;
	}
};

var Response = function(prompt){
	this.id = -1;
	this.prompt = prompt;
	this.text = "";
	this.graph = false;
}

var courses = new Array();

function fetchData(){

	if($.cookie("mode") == "student"){
		getCoursesForStudent({title: $.cookie("email")},
		function(data, status){
			var response = eval(data);
			for(var i=0; i<response.length; i++){
				var course = new Course(response[i].name);
				course.year = response[i].year;
				course.semester = response[i].semester;
				courses[i] = course;
			
				//get projects
				getProjectsForCourse(course, getProjectsForCourseCallback(course));
			
				//get students
				getStudentsForCourse(course, getStudentsForCourseCallback(course));
			}
		});
	}else{
		getCoursesForProfessor({title: $.cookie("email")}, function(data, status){
			var response = JSON.parse(data);
			for(var i=0; i<response.length; i++){
				var course = new Course(response[i].name);
				course.year = response[i].year;
				course.semester = response[i].semester;
				courses[i] = course;

				//get projects
				getProjectsForCourse(course, getProjectsForCourseCallback(course));
			
				//get students
				getStudentsForCourse(course, getStudentsForCourseCallback(course));
			}
		});	
	}

}



function getProjectsForCourseCallback(course/*, last*/){
	return function(data, status){
			var response = eval(data);
			for(var i=0; i<response.length; i++){
				var project = new Project(response[i].name, course);
				getPromptsForProject(project);
			}
		};
}

function getStudentsForCourseCallback(course){
	return function(data, status){
			var response = eval(data);
			for(var i=0; i<response.length; i++){
				var student = new Student(response[i].email);
				student.firstName = response[i].firstname;
				student.lastName = response[i].lastname;
				student.password = response[i].password;
				course.addStudent(student);
			}
		};
}


function init(){
	onload();
	detail_view = document.getElementById("detail_view");
	detail_view_container = document.getElementById("detail_view_container");
	center_header = document.getElementById("center_header");
	
	fetchData();

	if(mode == "admin"){
		showDetailView();
	}
	else {
		showCanvas();
	}
	mode = $.cookie("mode");
	console.log("mode set to: " + mode);
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
		backButtonStack.push(getButtonDiv("" + course.title, function(){backButtonStack.pop(); displayNewProject(course, project, true);}));
	else{
		backButtonStack.push(getButtonDiv("" + course.title, function(){ displayNewProject(course, project, true);}));		
	}
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
	newQuestion.onclick = function(){
		var newPrompt = new Prompt("", false, "version");
		promptArray[promptArray.length] = newPrompt;
		addNewPrompt(promptArray, promptArray.length-1, promptDiv);
	};
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
						//create the project
						createProject(project, currentCourse, function(response){
							if(response[0].exists){
								alert("the project already exists");
							}else{
								displayDetailCourse(currentCourse, true);
							}
						});
						project.prompts = promptArray;
					}
					else{
						for(var i=0; i<project.prompts.length; i++){
							var currentPrompt = project.prompts[i];
							if(currentPrompt.id <= 0){
								createPrompt(currentPrompt, project);
							}
							else{
								updatePrompt(currentPrompt, project);
							}
						}
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

//added by rimalp
function displayNewCourse(courses, back){
	
	clearDetailView();
	showDetailView();


	if(!back){
		backButtonStack.push(getButtonDiv("Courses", function(){backButtonStack.pop(); displayNewCourse(courses, true);}));
	}else{
		backButtonStack.push(getButtonDiv("Courses", function(){ displayNewCourse(courses, true);}));
	}
	setTitle("New Course for " + $.cookie("email"), backButtonStack[backButtonStack.length-2]);


	//load the simple form	
	$('#detail_view').load("/views/new_course.html");
	$('#add_student_header').text("test");
	
	
}

function displayNewStudent(course, back) {	
	clearDetailView();
	showDetailView();

	//load the form
	$('#detail_view').load("views/new_student.html");

	if(!back){
		backButtonStack.push(getButtonDiv("New Project for " + course.title, function(){backButtonStack.pop(); displayNewstudent(course, true);}));
	}else{
		console.log("back button stack there");
	}
	setTitle("New Student for " + course.title, backButtonStack[backButtonStack.length-2]);

	//setTitle(project.title, backButtonStack[backButtonStack.length-2]);
	

	
}

function createNewCourse(){
	
	if(mode == "student") return; //only professors create a new project
	

	var professor = {title: $.cookie("email")};
	var newCourse = {}
	newCourse.title = $('#course_name').val();
	newCourse.year = $('#course_year').val();
	newCourse.semester = $('#course_semester').val();
	console.log("values: " + newCourse.title + "  " + newCourse.year + "  " + newCourse.semester);

	if(newCourse.title == "" ) return;
	createCourse(newCourse, professor, function(response){
		  if(response[0].exists){
			alert("Duplicate course in Database!");
		  }else{
			//load the detail page again after new courses were fetched
			//first fetch the necessary data
			var c = new Course(newCourse.title);
			c.year = newCourse.year;
			c.semester = newCourse.semester;
			courses[courses.length] = c;
			displayDetail(courses);
			
		  }
	});
}

function createNewProject(){

}
function addNewStudent(emails){
	console.log(JSON.stringify(emails));
	for(var i=0; i<emails.length; i++){
		addStudents(currentCourse, emails[i]);
		//todo update the students array to show them in display
	}	
}


function addNewPrompt(promptArray, index, parent){
	var prompt = promptArray[index];
	var last = parent.removeChild(parent.lastChild);
	
	var div = document.createElement("div");
	
	// Prompt or Question
	var actionDropdown = document.createElement("select");
	actionDropdown.onchange = function(){
		if(actionDropdown.selectedIndex == 0)
			prompt.requiresInput = false;
		else if(actionDropdown.selectedIndex == 1)
			prompt.requiresInput = true;
	}

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
	eventDropdown.onchange = function(){
		console.log("ONCHANGE " + eventDropdown.selectedIndex);
		if(eventDropdown.selectedIndex == 0){
			prompt.eventType = "version";
		}
		else if(eventDropdown.selectedIndex == 1){
			prompt.eventType = "save";
		}
		else if(eventDropdown.selectedIndex == 2){
			prompt.eventType  = "frequency";
		}
	};
	
	var frequencyInput = document.createElement("input");
	
	var versionOption = document.createElement("option");
	versionOption.value = "version";
	versionOption.innerHTML = "a new version is created";
	versionOption.onclick = function(){console.log("ONCLICK");	
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
					var deletedPrompt = promptArray.splice(promptArray.indexOf(prompt), 1)[0];
					deletePrompt(deletedPrompt);
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
	getInfoBoxes("", courses, courseDiv, coursesToCourseOnClickMaker, function(){return "";}, function(){displayNewCourse(courses, true);});
	
	detail_view.appendChild(courseDiv);
	
}

function displayProfileInformation(){
	console.log("clicked");
	clearDetailView();
	showDetailView();
	$('#detail_view').load("/views/profile_settings.html");
}

function displayDetailCourse(course, back){
	clearDetailView();
	showDetailView();
	
	currentCourse = course;
	
	if(!back)
		backButtonStack.push(getButtonDiv(course.title, function(){backButtonStack.pop(); displayDetailCourse(course, true);}));
	setTitle(course.title, backButtonStack[backButtonStack.length-2]);
	
	var projectDiv = document.createElement("div");
	getInfoBoxes("Projects", course.projects, projectDiv, courseToProjectOnClickMaker, function(){return "";}, function(){displayNewProject(course);});
	var studentDiv = document.createElement("div");
	getInfoBoxes("Students", course.students, studentDiv, getCourseToStudentOnClickMaker(course), function(){return "";}, function(){displayNewStudent(course);});
	
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
	promptDiv.innerHTML = "<header class='header' id='detail_header'><h3 id='detail_title'>Prompts/Questions</h3></header>";
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
		backButtonStack.push(getButtonDiv(/*student.title + "'s " + project.title*/"Done", function(){backButtonStack.pop(); contractAll(); displayDetailStudentProject(student, project, true);}));
	setTitle(student.title + "'s " + project.title, backButtonStack[backButtonStack.length-2]);
	
	var displayFunction = function(){
		var graphDiv = document.createElement("div");
		getInfoBoxes("Graphs", student.getGraphHistoryOf(project).graphs, graphDiv, studentProjectToGraphOnClickMaker, function(){return "";}, newGraphFunction);
		currentProject = project;
		currentStudent = student;

		var promptDiv = document.createElement("div");
		promptDiv.innerHTML = "<header class='header' id='detail_header'><h3 id='detail_title'>Prompts/Questions</h3></header>";
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
	};
	
	if(student.getGraphHistoryOf(project).graphs.length == 0){
		getTopLevelGraphsForStudentProject(project.course, project, student, displayFunction);
	}
	else{
		displayFunction();
	}
}

function newGraphFunction(){
	clearDetailView();
	showDetailView();
	var div = document.createElement("div");
	div.style = "text-align: center;";
	var spacer = document.createElement("div");
	spacer.style = "height: 40%;";
	div.appendChild(spacer);
	var h3 = document.createElement("h3");
	h3.innerHTML = "Loading...";
	div.appendChild(h3);
	detail_view.appendChild(div);
	
	
	var currentGraphHistory = currentStudent.getGraphHistoryOf(currentProject);
	var newGraph = false;
	if(currentGraphHistory.graphs.length > 0){
		newGraph = currentGraphHistory.graphs[currentGraphHistory.graphs.length-1].clone(false);
	}
	else{
		newGraph = new Graph();
		currentGraphHistory.addGraph(newGraph);
		createGraph(newGraph, function(){showGraph(newGraph); currentProject.executeNewVersionPrompts(currentStudent);});
	}
	
	//showGraph(newGraph);
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
	var h3 = document.createElement("h4");
	h3.class = "row";
	
	leftDiv = leftDiv || document.createElement("div");
	leftDiv.style = "float: left";
	h3.appendChild(leftDiv);
	
	rightDiv = rightDiv || document.createElement("div");
	rightDiv.style = "float: right";
	h3.appendChild(rightDiv);
	
	var titleText = document.createElement("div");
	titleText.style = "margin: 0 auto;";
	titleText.innerHTML = title;
	h3.appendChild(titleText);
	
	center_header.innerHTML = "";
	center_header.appendChild(h3);
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
	parent.innerHTML = "<header class='header' id='detail_header'><h3 id='detail_title'>" + title + "</h3></header>";
	
	for(var i=0; i<array.length; i++){
		var current = array[i];
		var div = document.createElement("div");
		div.id = current.title;
		div.className = "info_block";
		div.innerHTML = "<img class='info_content' width='100' height='100' src='" + getImagePath() + "'>";
		var link = document.createElement("a");
		link.className = "info_content";
		link.onclick = onClickMaker(current);
		link.innerHTML = current.title;
		div.appendChild(link);
		
		parent.appendChild(div);
	}
	
	if(newFunction	){
		var div = document.createElement("div");
		div.className = "info_block";
		div.innerHTML = "<img class='info_content' width='100' height='100' src=''>";
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


