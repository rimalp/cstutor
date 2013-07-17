var table;
var menu;
var mode = "student";
var userId = "Jack";

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
	this.projects = new Array();
	this.students = new Array();
};
Course.prototype = new Base();
Course.prototype.getLink = function(){
	return this.projects;
}
Course.prototype.getLinkType = function(){
	return "Projects";
}
Course.prototype.constructor = Course;

var Student = function(title, course){
	Base.call(this, title);
	this.course = course;
	course.students[course.students.length] = this;
	
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
	for(i in this.graphHistories){
		if(this.graphHistories[i].project == project){
			return this.graphHistories[i];
		}
	}
	return false;
}
Student.prototype.constructor = Student;

var Project = function(title, course){
	Base.call(this, title);
	this.course = course;
	course.projects[course.projects.length] = this;
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
Project.prototype.getLinkType = function(){
	return "Students";
}
Project.prototype.constructor = Project;

var GraphHistory = function(student, project){
	this.graphs = new Array();
	this.student = student;
	this.project = project;
};
GraphHistory.prototype.addGraph = function(graph){
	this.graphs[this.graphs.length] = graph;
}

var courses = new Array();
var cs150 = new Course("CS 150");

var jack = new Student("Jack", cs150);
var bob = new Student("Bob", cs150);
var jeff = new Student("Jeff", cs150);
var tom = new Student("Tom", cs150);

var lab1 = new Project("Lab 1", cs150);
var lab2 = new Project("Lab 2", cs150);

var graph1 = new Graph("Graph 1");
var node1 = new Node("node1", "description");
var node2 = new Node("node2", "description");
var node3 = new Node("node3", "description");
var node4 = new Node("node4", "description");
graph1.addNode(node1);
graph1.addNode(node2);
graph1.addNode(node3);
graph1.addNode(node4);

var graph2 = new Graph("Graph 2");
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

bob.graphHistories[0] = new GraphHistory(bob, lab1);
bob.graphHistories[0].addGraph(graph1);
bob.graphHistories[0].addGraph(graph2);

jeff.graphHistories[0] = new GraphHistory(jeff, lab1);
jeff.graphHistories[0].addGraph(graph1);
jeff.graphHistories[0].addGraph(graph2);

tom.graphHistories[0] = new GraphHistory(tom, lab1);
tom.graphHistories[0].addGraph(graph1);
tom.graphHistories[0].addGraph(graph2);

jack.graphHistories[1] = new GraphHistory(jack, lab2);
jack.graphHistories[1].addGraph(graph1);
jack.graphHistories[1].addGraph(graph2);

bob.graphHistories[1] = new GraphHistory(bob, lab2);
bob.graphHistories[1].addGraph(graph1);
bob.graphHistories[1].addGraph(graph2);

jeff.graphHistories[1] = new GraphHistory(jeff, lab2);
jeff.graphHistories[1].addGraph(graph1);
jeff.graphHistories[1].addGraph(graph2);

tom.graphHistories[1] = new GraphHistory(tom, lab2);
tom.graphHistories[1].addGraph(graph1);
tom.graphHistories[1].addGraph(graph2);

var cs205 = new Course("CS 205");

courses[0] = cs150;
courses[1] = cs205;

function init(){
	menu = document.getElementById("menu");
	var listTitle = document.createElement('li');
	listTitle.className = "nav-header";
	listTitle.innerHTML = userId;
	menu.appendChild(listTitle);
	addSubMenu(menu, courses);
	onload();
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
	}
	
	li.appendChild(ul);
}

function getGraphOnClickFunction(li, ul, graph){
	return function(e){
		e.stopPropagation();
		if(li.className == "active"){
			li.className = "";
			graph.remove();
		}
		else{
			var child = ul.firstChild;
			while(child){
				child.className = "";
				child = child.nextSibling;
			}
			li.className = "active";
			currentGraph.remove();
			graph.display();
			currentGraph = graph;
		}
	};
}

var currentFocus = false;
function getSubMenuOnClickFunction(li, ul, item){
	return function(e){
		e.stopPropagation();
		if(li.className == "active"){
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
			addSubMenu(li, item.getLink());
			currentFocus = item;
		}
	};
}








