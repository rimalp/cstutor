var client = null;

// var models = require('./menu.js');

var Database = function(connection){
	client = connection;
	testDB();
}
module.exports.Database = Database;

Database.prototype = {
	//call this method with the appropriate callback function to give you the
	//result asynchronously when the pg module gets it
	rawQuery: function(querystring, callback){
		var query = client.query(querystring);
		query.on('error', function(error){
			console.log(error);
			return callback(error);
		});
		query.on('end', function(result){
			return callback(null, result);
		});
	},	
	// READ QUERIES-----------------------------------------------------------------
	//query to get the courses for a given student
	getCoursesForStudent: function(email, callback){
		var q = "SELECT course.name, course.id FROM course.id WHERE IN"+
		" (select course.id FROM course, student_course, student WHERE course.id=student_course.courseId"+
		" AND student_course.email='"+email+"')";
		rawQuery(q, function(err, result){
			var courses = new Array();
			for(var row in result){
				var c = new Course();
				c.id = row.id;
				c.description = row.description;
				courses.push(c);
			}
			return callback(err, courses);
		});
	},

	//query to get the courses for a given professor
	getCoursesForProfessor: function(email, callback){
		var q = "SELECT course.id, course.name FROM course.id WHERE IN"+ 
				" (select course.id FROM course, professor_course, professor WHERE course.id=processor_course.courseId"+
				" AND professor_course.email='"+email+"')";
		rawQuery(q, function(err, result){
			var courses = new Array();
			for(var row in result){
				var c = new Course();
				c.id = row.id;
				c.description = row.description;
				courses.push(c);
			}
			return callback(err, courses);
		});
	},	
	//get all projects for a course
	getLabsForCourse: function(courseId, callback){
		var q = "SELECT * from project WHERE courseId="+courseId+"";
		rawQuery(q, function(err, result){
			var labs = new Array();
			for(var row in result){
				var lab = new Project();
				lab.id = row.id;
				lab.description = row.description;
				lab.date = row.date;
				lab.courseId = row.courseId;
				labs.push(lab);
			}
			return callback(err, labs);
		});
	},

	//get all the students in a course
	getStudentsForCourse: function(courseId, callback){
		var q = "SELECT * from student, student_course WHERE student_course.email=student.email AND"+ 
				" student_course.courseId="+courseId+"";
		rawQuery(q, function(err, result){
			var students = new Array();
			for(var row in result){
				var s = new Course();
				s.email = row.email;
				s.firstName = row.firstName;
				s.lastName = row.lastName;
				s.password = row.password;
				s.frequency = row.frequency;
				students.push(s);
			}
			return callback(err, students);
		});
	},

	//select the top level for a given project for a given student
	getTopLevelGraphForLabForStudent: function(projectId, email, callback){
		var q = "SELECT * FROM graph, student_project WHERE student_project.projectId="+projectId+
		" AND student_project.email='"+email+"' AND student_project.graphId=graph.graphId AND topLevel=true"+
		" ORDER BY graph.version";
		rawQuery(q, function(err, result){
			if(err!=null){
				return callback(err);
			}else{
				var graphs = new Array();
				for(var row in result){
					//TODO: do this for each row (graph);
					var topGraph = new Graph();
					topGraph.id = row.id;
					topGraph.version = row.version;
					topGraph.topLevel = row.topLevel;
					topGraph.title = row.description;
					getNodesForGraph(topGraph.id, topGraph, function(err, nodes){
						topGraph.nodes = nodes;
						//now fetch the subgraphs for each node (if exists) in a separate method recursively
						for(var node in nodes){
							if(node.subgraphId == -1) continue;
							getSubGraphForNode(node, projectId, email, topGraph.version, function(err, resultSubGraph){
								if(err != null)
									console.log("error fetching subgraph for node. " + err);
								else{
									//assign the subgraph to the node
									node.subgraph = resultSubGraph;
									node.subgraphId = resultSubGraph.id;
								}
							});
						}
						graphs.push(topGraph);
						//finally call the callback function with the Graph Object as desired
						return callback(null, graphs);		
					});
				}
			}
		});
	},
	//get all the nodes for the given graph
	getNodesForGraph: function(graphId, ownerGraph, callback){
		var nodesQuery = "SELECT * from nodes where graphId="+graphId+"";
		rawQuery(nodesQuery, function(err, result){
			if(err != null){
				return callback(err);
			}else{
				var nodes = new Array();
				for(var row in result){
					var newNode = new Node();
					newNode.id = row.id;
					newNode.x = row.x;
					newNode.y = row.y;
					newNode.graph = ownerGraph;
					newNode.parentNodeId = row.parentNodeId;
					newNode.subgraphId = row.subGraphId;
					newNode.data = row.name;
					newNode.description = row.description;
					nodes.push(newNode);
				}
				//fetch the edges for this node this node to the list of nodes to be returned
				getEdgesForGraph(graphId, function(err, result){
					var src, dst;
					for(var row in rows){
						for(var node in nodes){
							if(row.src == node.id)
								src = node;
							if(row.dst == node.id)
								dst = node;
						}
						src.addChild(dst);
					}
				});
				//return the array of nodes
				callback(null, nodes)
			}
		});
	}, 

	getEdgesForGraph: function(graphId, callback){
		var q = "SELECT * FROM edge WHERE graphId="+graphId+"";
		rawQuery(q, function(err, result){
			if(err != null){
				return callback(err);
			}else{
				return callback(null, result);
			}
		});
	},

	getSubGraphForNode: function(node, projectId, email, version, callback){
		var q = "SELECT * FROM graph, student_project WHERE student_project.projectId="+projectId+
		" AND student_project.email='"+email+"' AND student_project.graphId=graph.graphId AND topLevel=false"+
		" AND graph.parentNodeId="+node.id+" AND graph.version="+version+"";

		rawQuery(q, function(err, result){
			if(err != null){
				callback(err);
			}else{
				var subGraph = new Graph();
				subGraph.id = row[0].id;
				subGraph.version = row[0].version;
				subGraph.topLevel = row[0].topLevel;
				subGraph.title = row[0].description;
				
				//now get all the nodes for the graph
				getNodesForGraph(subGraph.id, subGraph, function(err, nodes){
						topGraph.nodes = nodes;
						//now fetch the subgraphs for each node (if exists) recursively
						for(var node in nodes){
							if(node.subgraphId == -1) continue; //base case
							//recursive call
							getSubGraphForNode(node, projectId, email, topGraph.version, function(err, resultSubGraph){
								if(err != null)
									console.log("error fetching subgraph for node. " + err);
								else{
									//assign the subgraph to the node
									node.subgraph = subGraph;
									node.subgraphId = subGraph.id;
								}
							});
						}
						return callback(null, subGraph);
				});
			}
		});
	},

	
	//CREATE queries ------------------------------------------------------------------------
	createProfessor: function(prof, callback){
		client.query("INSERT INTO professor(email, firstName, lastName, password) VALUES($1,$2,$3,$4) RETURNING id",
			[prof.email, prof.firstName, prof.lastName, prof.password], function(err, result){
				if(err){
					callback(err);
				}else{
					prof.id = result.rows[0].id;
					callback(null, prof);
				}
			});
	},
	createStudent: function(student, callback){
		client.query("INSERT INTO student(email, firstName, lastName, password, frequency) VALUES($1,$2,$3,$4, $5) RETURNING id",
			[student.email, student.firstName, student.lastName, student.password, student.frequency], function(err, result){
				if(err){
					callback(err);
				}else{
					student.id = result.rows[0].id;
					callback(null, student);
				}
			});
	},

	createCourse: function(course, professor, callback){
		client.query ("INSERT INTO course  (name) VALUES ($1) RETURNING id", [course.name], function(err, result){
			if(err != null)
				callback(err)
			else{
				course.id = result.rows[0].id;
				//now update the professor_course table with the id
				client.query("INSERT INTO professor_course VALUES ($1, $2)", [professor.email, course.id], function(err){
					if(err==null){
						callback(null, course);
					}else{
						callback(err);
					}
				});
			}
		});
	},

	addStudentToCourse: function(studentEmail, courseId, callback){
		client.query("INSERT INTO student_course VALUES($1, $2)", [studentEmail, courseId], function(err){
			if(err){
				callback(err);
			}else{
				//assign all the labs in the course to the student
				var q = "SELECT project.id as projectId FROM project where courseId="+courseId+"";
				rawQuery(q, function(err, result){
					if(err){
						callback(err);
					}else{
						for(var i = 0; i<result.rows.rowCount; i++){
							//insert the lab id and student id into the student_project table, leaving the graphid entry empty,
							// update it later when you have the graph.
							client.query("INSERT INTO student_project VALUES ($1, $2, $3)", [result.rows[i].projectId, studentEmail, -1], function(err){
								if(err){
									callback(err);
								}else{
									if(i = (result.rows.rowCount - 1)){
										callback(null);
									}
								}
							});
						}
					}
				});
			}
		});
	},

	createLab: function(lab, courseId, callback){
		client.query("INSERT INTO project (description, dueDate, courseId) VALUES ($1, $2, $3) RETURNING id",
			[lab.description, lab.date, courseId], function(err, result){
				if(err){
					callback(err);
				}else{
					lab.id = result.rows[0].id;
					//also insert this lab/project into the student_project table
					getStudentsForCourse(courseId, function(err, students){
						if(!err){
							for(var i = 0; i<students.rowCount; i++){
								client.query("INSERT INTO student_project VALUES ($1, $2)", [students[i].email, courseId], function(err){
									if(err){
										callback(err);
									}else if(i==(students.rowCount-1)){
										//if all the student ids are successfull inserted, then return the new lab object
										callback(null, lab);
									}
								});
							}
							//callback with the lab object after insert 
						}else{
							callback(err);
						}
					});
				}

		});
	},

	createGraph: function(graph, projectId, studentEmail, callback){
		//id SERIAL, version integer, topLevel boolean, description text
		client.query("INSERT INTO graph (version, topLevel, description) VALUES ($1, $2, $3) RETURNING id", [graph.version, graph.topLevel, graph.title],
		function(err, id){
			if(err){
				callback(err);
			}else{
				graph.id = row[0].id;
				//now insert the nodes of the graph
				for(var i=0; i<graph.nodes.length; i++){
					createNode(graph.nodes[i], function(err){
						if(err){
							callback(err);
						}else if(node.subgraph != false){
							//node has a subgraph, recursively create it
							createGraph(node.subgraph, projectId, studentEmail, function(err){
								if(err){
									callback(err);
								}else{
									callback(null); //returning the recursive case ***
								}
							});
						}
						if(i==(graph.nodes.length-1)){
							callback(null) //base case return for createGraph function after all the nodes are created
						}
					});
				}
			}
		});
	}, 

	createNode: function(node, callback){
		client.query("INSERT INTO node (x, y, graphId, parentNodeId, subGraphId, name, description) VALUES "+
			"($1, $2, $3, $4, $5, $6, $7) RETURNING id", [node.x, node.y, node.graph.graphId, node.parentNodeId, node.subGraphId, node.name, node.description],
			function(err, result){
				if(err){
					callback(err);
				}else{
					node.id = result.rows[0].id;
					//now add edges to the node
					for(var i=0; i<node.children.length; i++){
						client.query("INSERT INTO edge VALUES ($1, $2, $3)", [node.graph.graphId, node.id, node.children[i].id], function(err){
							if(err){
								callback(err);
							}else if(i==(node.children.length-1)){
								callback(null, node);
							}
						});
					}
				}
			});
	},

	//UPDATE queries ------------------------------------------------------------------------
	updateStudent: function(student, callback){
		client.query("UPDATE student SET firstName=$1, lastName=$2, password=$3, frequency=$4 WHERE email=$5",
			[student.firstName, student.lastName, student.password, student.frequency, student.email],
			function(err){
				callback(err);
			});
	},

	updateProfessor: function(professor, callback){
		client.query("UPDATE professor SET firstName=$1, lastName=$2, password=$3 WHERE email=$4",
			[professor.firstName, professor.lastName, professor.password, professor.email],
			function(err){
				callback(err);
			});
	},

	updateCourse: function(course, callback){
		client.query("UPDATE course SET name=$1 WHERE id=$2", [course.name, course.id], function(err){
			callback(err);
		});
	},

	updateLab: function(lab, courseId, callback){
		client.query("UPDATE project SET description=$1, dueDate=$2, courseId=$3 WHERE id=$4",
			[lab.description, lab.dueDate, lab.courseId, lab.id], function(err){
				callback(err);
			});
	}, 
	updateNode: function(node, graphId, callback){
		if(node.id == -1){ //recently added node but not created yet in the existing graph
			createNode(node, function(err){
				callback(err);
			});
		}else{
			client.query("UPDATE node SET x=$1, y=$2, graphId=$3, parentNodeId=$4, subGraphId=$5, name=$6, description=$7 WHERE id=$8", 
				[node.x, node.y, node.graph.graphId, node.parentNodeId, node.subGraphId, node.name, node.description, node.id],
				function(err){
					if(err){
						callback(err);
					}else if(node.subgraph != false){
						//update the subgraph if any
						updateGraph(node.subgraph, function(err){
							if(err){
								callback(err);
							}else{
								//also update the edges *** some edges may alread exist for an existing node so delete all and 
								//create new edges again as "upsert" seems tricky in postgresql
								client.query("DELETE FROM edge WHERE graphId = $1 AND src=$2", [graphId, node.id], function(err){
									if(err){
										callback(err);
									}else{
										// create edges for this node again
										for(var i=0; i<node.children.length; i++){
											client.query("INSERT INTO edge VALUES ($1, $2, $3)", [node.graph.graphId, node.id, node.children[i].id], function(err){
												if(err){
													callback(err);
												}else if(i==(node.children.length-1)){
													callback(null);
												}
											});
										}
									}
								});
							}
						});
					}
			});
		}
	},

	updateGraph: function(graph, callback){
		client.query("UPDATE graph SET version=$1, topLevel=$2, description=$3 WHERE id=$4",
		[graph.version, graph.topLevel, graph.description, graph.id], function(err){
			if(err){
				callback(err);
			}else{
				for(var i=0; i<graph.nodes.length; i++){
					updateNode(graph.nodes[i], graph.graphId, function(err){
						if(err){
							callback(err);
						}else if(i==(graph.nodes.length-1)){
							callback(null);//done updading the graph recursively
						}
					});
				}
			}
		});
	},



	//DELETE queries ------------------------------------------------------------------------
	deleteStudentFromCourse: function(courseId, email, callback){
		client.query("DELETE FROM student_course WHERE courseId=$1 AND email=$2", [courseId, email], function(err){
			callback(err);
		});
	},



	deleteNode: function(node, callback){
		client.query("DELETE FROM node WHERE id=$1", [node.id], function(err){
			if(err){
				callback(err);
			}else{
				//also delete the edges from and to the node
				client.query("DELETE FROM edge where src=$1 OR dst=$2", [node.id, node.id], function(err){
					if(err){
						callback(err);
					}else{
						//also delete the subgraph if exists
						if(node.subgraph != false){
							deleteGraph(node.subgraph, function(err){
								if(err){
									callback(err);
								}else{
									callback(null);
								}
							});
						}
					}
				});
			}
		});
	},

	deleteGraph: function(graph, callback){
		client.query("DELETE FROM graph WHERE id=$1", [graph.id], function(err){
			if(err){
				callback(err);
			}else{
				//also delete all the nodes in the graph
				for(var i=0; i<graph.nodes.length; i++){
					deleteNode(graph.nodes[i], function(err){
						if(err){
							callback(err);
						}else if(i==(graph.nodes.length-1)){
							callback(null); //the last node has been processed
						}
					});
				}
			}
		});
	},

	deleteAllLabsInCourse: function(courseId, callback){
		client.query("DELETE FROM project WHERE courseId=$1 RETURNING id",[courseId], function(err, result){
			if(err){
				callback(err);
			}else{
				//now delete the entries in the 
				for(var i=0; i<result.rowCount; i++){
					client.query("DELETE FROM student_project WHERE projectId=$1 RETURNING graphId", [result.rows[i].id], function(err, res){
						if(err){
							callback(err);
						}else{
							//for each of the graph ids returned, delete the nodes, edges and graphs with those graphIds for that project being deleted
							for(var j=0; j<res.rowCount; j++){
								client.query("DELETE FROM edge WHERE graphId=$1", [res.rows[j]], function(err){
									if(err) {
										callback(err);
									}else{
										client.query("DELETE FROM node WHERE graphId=$1", [res.rows[j]], function(err){
											if(err){
												callback(err);
											}else{
												client.query("DELETE FROM graph WHERE id=$1", [res.rows[j]], function(err){
													if(err){
														callback(err);
													}else if(j==(res.rowCount-1)) {
														callback(null); //return no error when all done
													}
												});
											}
										});
									}
								});
							}
						}
					});
				}
			}
		});
	},

	deleteCourse: function(courseId, callback){
		client.query("DELETE FROM course where id=$1", [courseId], function(err){
			if(err){
				callback(err);
			}else{
				//delete the labs in the course
				deleteLab(courseId, function(err){
					if(err){
						callback(err);
					}else{
						//also delete the entries in the student_course and professor_course entry
						client.query("DELETE FROM student_course WHERE courseId=" + courseId +"", function(err){
							if(err){
								callback(err);
							}else{
								client.query("DELETE FROM professor_course WHERE courseId=" + courseId + "", function(err){
									if(err) callback(err);
									else{
										callback(null);
									}
								});
							}
						})
					}
				});
			}
		});
	}

};

var testDB = function(){

}
//OTHER DB Model Objects - course, student, professor, lab
// var Course = function(id, description){
// 	this.id = id;
// 	this.description = description;
// }
// module.exports.Course = Course;


// var Student = function(email, firstName, lastName, password, frequency){
// 	this.email = email;
// 	this.firstName = firstName;
// 	this.lastName = lastName;
// 	this.password = password;
// 	this.frequency = frequency;
// }
// module.exports.Student = Professor;


// var Professor = function(email, firstName, lastName, password){
// 	this.email = email;
// 	this.firstName = firstName;
// 	this.lastName = lastName;
// 	this.password = password;
// }
// module.exports.Professor = Professor;


// var Lab = function(id, description, date, courseid){
// 	this.id = id;
// 	this.description = description;
// 	this.date = date || new Date();
// 	this.courseId = courseid;
// }
// module.exports.Lab = Lab;

