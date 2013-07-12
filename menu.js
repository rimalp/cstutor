var table;
var menu;
var mode = "admin";
var userId = "Alice";

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
	
	this.graphs = new Array();
};
Student.prototype = new Base();
Student.prototype.getLink = function(){
	return this.graphs;
}
Student.prototype.getLinkType = function(){
	return "Graphs";
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
			if(userId == student.title)
				return student.graphs;
		}
	}
}
Project.prototype.getLinkType = function(){
	return "Students";
}
Project.prototype.constructor = Project;

var courses = new Array();
var cs150 = new Course("CS 150");

var alice = new Student("Alice", cs150);
var bob = new Student("Bob", cs150);
var jeff = new Student("Jeff", cs150);
var tom = new Student("Tom", cs150);
alice.graphs = cs150.students;
bob.graphs = cs150.students;
jeff.graphs = cs150.students;
tom.graphs = cs150.students;

var lab1 = new Project("Lab 1", cs150);
var lab2 = new Project("Lab 2", cs150);

var cs205 = new Course("CS 205");

courses[0] = cs150;
courses[1] = cs205;

function init(){
	menu = document.getElementById("menu");
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
		newLi.onclick = getOnClickFunction(newLi, array[i].getLink());
		ul.appendChild(newLi);
	}
	
	li.appendChild(ul);
}

function getOnClickFunction(li, array){
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
			li.className = "active";
			addSubMenu(li, array);
		}
	};
}








