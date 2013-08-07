var client = null;

Database = function(connection){
	client = connection;
	testDB();
};
exports.Database = Database;

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

	//new queries:

	//query to get the courses for a given student
	getCoursesForStudent: function(studentEmail, callback){
		var q = "SELECT * FROM course WHERE (name, year, semester) IN "+
				"(SELECT courseName, courseYear, courseSemester FROM student_course WHERE email='"+studentEmail+"')";
		client.query(q, function(err, result) {
			if(err){
				console.log("Database error: " + err);
				callback(err);	
			} else {
				callback(null, result);
			}
		});
	},


	//query to get the courses for a given professor
	getCoursesForProfessor: function(profEmail, callback){
		var q = "SELECT * FROM course WHERE (name, year, semester) IN "+
				"(SELECT courseName, courseYear, courseSemester FROM student_course WHERE email='"+profEmail+"')";
		rawQuery(q, function(err, result) {
			if(err){
				callback(err);	
			} else {
				callback(null, result);
			}
		});		
	},


	//get all projects for a course
	getProjectsForCourse: function(courseName, courseYear, courseSemester, callback){
		var q = "SELECT * FROM project WHERE courseName=$1 AND courseYear=$2 AND courseSemester=$3";
		client.query(q, [courseName, courseYear, courseSemester], function(err, result){
			if(err){
				callback(err);
			}else{
				callback(null, result);
			}
		});
	},

	//get all the students in a course
	getStudentsForCourse: function(courseName, courseYear, courseSemester, callback){
		client.query("SELECT student.email, student.firstName, student.lastName, student.password, student.frequency FROM "+
			"student, student_course WHERE student.email=student_course.email AND course.name=$1 AND course.year=$2 AND course.semester=$3",
			[courseName, courseYear, courseSemester], function(err, result){
				if(err){
					callback(err);
				}else{
					callback(null, result);
				}
			});
	},

	//get a list of top level graphs for a given project and student
	/*	This method returns a JSON string where it contains arrays of objects with three parameters - graphInfo, nodesInfo and edgesInfo
		for each top level graph fetched.
		- callback(err, graphResult, nodesResult, edgesResult) -
	*/
	getTopLevelGraphForLabForStudentForAllVersions: function(projectName, courseName, courseYear, courseSemester, studentEmail, callback){
		client.query("SElECT graph.* FROM graph, student_project WHERE graph.id=student_project.graphId AND "+ 
					"graph.parentNodeId=-1 ANDstudent_project.projectName=$1 AND student_project.courseName=$2 AND "+
					"student_project.courseYear=$3 AND student_project.courseSemester=$4 AND student_project.email=$5",
					[projectName, courseName, courseYear, courseSemester, studentEmail], function(err, result){
						if(err){
							callback(err);
						}else{
							var topGraphs = new Array();
							var graphCount = rewult.rows.length;
							for(var i=0; i<result.rows.length; i++){
								//get nodes for each graph
								var graph = {};
								graph.graphInfo = result.rows[0];
								var graphId = result.rows[i].id;
								client.query("SELECT * FROM node WHERE graphId=$1", graphId, function(err, result){
									if(err){
										callback(error);
									}else{
										graph.nodeInfo = result.rows;
										//once the nodes are fetched, also fetch the edges for that graph
										client.query("SELECT * FROM edge where graphId=$1",[graphId], function(err, result){
											if(err){
												callback(err);
											}else{
												graph.edgeInfo = result.rows;
												topGraphs[topGraphs.length] = graph;
												//if all the top level graphs fetched are processed, return the callback with json
												if(i==(graphCount-1)){
													callback(null, topGraphs);
												}
											}
										});
									}
								});
							}
						}
					});
	},


	//get sub-graphs for a node or a parent graph - works for both
	getSubGraphForNode: function(parentNodeId, callback){
		client.query("SELECT * from graph WHERE parentNodeId=$1", [parentNodeId], function(err, result){
			if(err){
				return(err);
			}else{
				var graph = {};
				graph.graphInfo = result.rows;
				//get the nodes for the graph
				client.query("SELECT * FROM node WHERE graphId=$1", [parentNodeId], function(err, result){
					if(err){
						callback(err);
					}else{
						graph.nodeInfo = result.rows;
						//also fetch all the edges
						client.query("SELECT * from edge WHERE graphId=$1", [parentNodeId], function(err, result){
							if(err){
								callback(err);
							}else{
								graph.edgeInfo = result.rows;
								callback(null, graph);
							}
						});
					}
				});

			}
		});
	},



	
	//CREATE-UPDATE queries ----- need to check first if exists then insert if need be -------
	//===============================================
	createProfessor: function(email, firstName, lastName, password, callback){
		//check if it exists
		client.query("SELECT email FROM professor WHERE email=$1 LIMIT 1", [email], function(err, result){
			if(err){
				callback(err);
			}else if(result.rows.rowCount == 0){
				//insert
				client.query("INSERT INTO professor(email, firstName, lastName, password) VALUES($1,$2,$3,$4)",
					[email, firstName, lastName, password], function(err, result){
					if(err){
						callback(err, null);
					}else{
						callback(null, result);
					}
				});

			}else{
				//update
				client.query("UPDATE professor SET firstName=$1, lastName=$2, password=$3 WHERE email=$4",
					[firstName, lastName, password, email],
					function(err){
						callback(err);
				});
			}
		});
	},

	createStudent: function(email, firstName, lastName, password, callback){
		//check if it exists
		client.query("SELECT email FROM student WHERE email=$1 LIMIT 1", [email], function(err, result){
			if(err){
				callback(err);
			}else if(result.rows.rowCount == 0){
				//insert
				client.query("INSERT INTO student(email, firstName, lastName, password) VALUES($1,$2,$3,$4)",
					[email, firstName, lastName, password], function(err, result){
					if(err){
						callback(err, null);
					}else{
						callback(null, result);
					}
				});

			}else{
				//update
				client.query("UPDATE student SET firstName=$1, lastName=$2, password=$3 WHERE email=$4",
					[firstName, lastName, password, email],
					function(err){
						callback(err);
				});
			}
		})
	},

	createCourse: function(name, year, semester, professorEmail, callback){
		client.query("SELECT year FROM course WHERE name=$1 AND year=$2 AND semester=$3",[name, year, semester], 
		function(err, result){
			if(err){
				callback(err);
			}else if(result.rows.rowCount ==0){
				//insert
				client.query("INSERT INTO course(name, year, semester) VALUES($1, $2, $3)", [name, year, semester],
				function(err, result){
					if(err){
						callback(err);
					}else{
						//insert into professor_course table
						client.query("INSERT INTO professor_course VALUES($1, $2, $3, $4)", [professorEmail, name, year, semester],
							function(err, callback){
								if(err){
									callback(err);
								}else{
									callback(null);
								}
							});
					}
				});
			}else{
				//update
				client.query("UPDATE course SET name=$1, year=$2, semester=#3  WHERE name=#1 AND year=$2 AND semester=$3",
				 [name, year, semester], function(err){
					if(err){
						callback(err);
					}else{
						client.query("UPDATE professor_course SET email=$1, courseName=$2, courseYear=$3, courseSemester=$4 WHERE "+
							          "email=$1, courseName=$2, courseYear=$3, courseSemester=$4", [professorEmail, name, year, semester],
							          function(req, res){
							          	if(err){
							          		callback(err);
							          	}else{
							          		callback(null);
							          	}
						});
					}
				});
			}
		});
	},

	createProject: function(project, courseName, courseYear, courseSemester, callback){
		client.query("SELECT year FROM project WHERE courseName=$1 AND courseYear=$2 AND courseSemester=$3 AND name=$4",
		[courseName, project.courseYear, project.courseSemester, project.name], function(err, result){ 
			if(err){
				callback(err);
			}else if(result.rows.rowCount ==0){
				//insert
				//name text, description text, dueDate DATE, courseName varchar, courseYear integer, courseSemester varchar, 
				//PRIMARY KEY(courseName, courseYear, courseSemester, name)
				client.query("INSERT INTO project VALUES ($1, $2, $3, $4, $5, $6)", [project.name, project.description, project.dueDate, courseName, courseYear, courseSemester],
					function(req, res){
						if(err){
							callback(err);
						}else{
							callback(null);
						}
					});
			}else{
				//update
				client.query("UPDATE project SET name=$1, description=$2, dueDate=$3, courseName=$4, courseYear=$5, courseSemester=$6 "+
					"WHERE courseName=$4 AND courseYear=$5 AND courseSemester=$6 AND name=$1",
					[project.name, project.description, project.dueDate, courseName, courseYear, courseSemester], function(err){
						if(err){
							callback(err);
						}else{
							callback(null);
						}
					});			}
		});
	},

	addStudentToCourse: function(email, courseName, courseYear, courseSemester, callback){
		//first check if the student is already in the studentcourse table
		client.query("SELECT email FROM student_course WHERE email=$1", [email], function(err, result){
			if(err){
				callback(err);
			}else if(result.rows.rowCount == 0){
				//insert, then assign all the labs to the student too
				client.query("INSERT INTO student_course VALUES($1,$2,$3,$4)", [email, courseName, courseYear, courseSemester], function(err){
					if(err){
						callback(err);
					}else{
						//assign the labs in the course to the student by adding rows to student_project table
						//NOT NECESSARY**
					}
				});
			}else{
				//update, then assign all the labs to the student too
				client.query("UPDATE student_course SET email=$1, courseName=$2, courseYear=$3, courseSemester=$4 WHERE "+
					"email=$1 AND courseName=$2 AND courseYear=$3 AND courseSemester=$4", [email, courseName, courseYear, courseSemester], 
					function(err){
						if(err){
							callback(err);
						}
					});
			}
		});
	},

	//new graphs have id of -ve, all nodes and edges in such a graph are new too
	//existing graph id > 0 
	//new node id = -ve id value, existing node id >1, deleted node.deleted = true;
	//for edges, if updating a graph, delete all first then enter them again since they dont have int ids
	createGraph: function(graphInfo, nodeInfo, edgeInfo, studentEmail, courseName, courseYear, courseSemester, projectName, callback){
		if(graphInfo.id = -1){
			//create graph 
			client.query("INSERT INTO graph values(parentNodeId, version, description) VALUES($1,$2,$3) RETURNING id", 
				[graphInfo.parentNodeId, graphInfo.version, graphInfo.description], function(err, result){
					var newGraphId = -1;
					if(err){
						callback(err);
					}else{
						newGraphId = result.rows[0].id;
						//add the nodes in the graph
						newNodeId = new Array();
						var node = false;
						for (var j = 0; j<nodeInfo.length; j++){
							node = nodeInfo[j];
							client.query("INSERT INTO node(id, x, y, graphId, name, description, color) VALUES($1,$2,$3,$4,$5,$6,$7)",
							[(-1)*node.id, node.x, node.y, newGraphId, node.name, node.description, node.color], function(err, result){
								if(err){
									callback(err);
								}else if(j==(nodeInfo.length-1)){
									//add the edges too
									var edge = false;
									for(var i=0; i<edgeInfo.length; i++){
										edge = edgeInfo[i];
										client.query("INSERT INTO edge VALUES($1, $2, $3)", [(-1)*edge.sourceId, (-1)*edge.destinationId, newGraphId], function(err){
											if(err){
												callback(err);
											}else if(i==(edgeInfo.length-1)){ 
												//insert the graph in the student_project join table 
												//projectName text, courseName varchar, courseYear integer, courseSemester varchar, email varchar, graphId integer, PRIMARY KEY(projectName, courseName, courseYear, courseSemester, email, graphId)
												client.query("INSERT INTO student_project VALUES($1,$2,$3,$4,$5,$6,$7)",
													[projectName, coursename, courseYear, CourseSemester, studentEmail, newGraphId], function(err){
														if(err){
															callback(err);
														}else{
															//get max node id
															client.query("SELECT max(id) AS maxNodeId FROM node", function(err, result){
																if(err) callback(err, null);
																else{
																	callback(null, result);

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
		}else if(graphInfo.id > 0){
			//update graph
			client.query("UPDATE graph SET parentNodeId=$1, version=$2, description=$3 WHERE id=$4",
				[graphInfo.parentNodeId, graphInfo.version, graphInfo.description, graphInfo.id], function(err, result){
					//update or delete the nodes depending on the 
					var graphId = graphInfo.id;
					var node = false;
					for(var i=0; i<nodeInfo.length; i++){
						node = nodeInfo[i];
						if(node.deleted == true){
							this.deleteNode(node.id, function(err){
								if(err){
									callback(err);
								}
							});
						}else{
							//update
							client.query("UPDATE node SET id=$1, x=$2, y=$3, graphId=$4, name=$5, description=$6, color=$7 "+
								"WHERE id=$1", [node.id, node.x, node.y, node.graphId, node.name, node.description, node.color], function (err){
									if(err){
										callback(err);
									}
								});
						}

						//also delete and add the edges after the last one of the nodes are done with
						if(i==(graphInfo.length-1)){
							client.query("DELETE FROM edge WHERE graphId=$1",[graphId], function(err){
								if(err){
									callback(err);
								}else{

									//reinsert all the edges
									for(var j=0; j<edgeInfo.length; j++){
										client.query("INSERT INTO edge VALUES($1,$2,$3)",
											[edgeInfo.sourceId, edgeInfo.destinationId, edgeInfo.graphId], function(err){
												if(err){
													callback(err);
												}
												if(j==(edgeInfo.length-1)){
													//done with update/delete
													//get max node id
													client.query("SELECT max(id) AS maxNodeId FROM node", function(err, result){
														if(err) callback(err, null);
														else{
															callback(null, result);
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
		}
	},

	deleteGraph: function(id, callback){
		client.query("DELETE FROM graph WHERE id=$1", [id], function(err){
			if(err){
				callback(err);
			}else{
				//also delete the nodes and edges in that graph
				client.query("DELETE FROM node WHERE graphId=$1 RETURNING sub");
			}
		});
	},
	deleteNode: function(id, callback){
		client.query("DELETE FROM node WHERE id=$1", [id], function(err){
			if(err){
				callback(err);
			}else{
				this.deleteGraphWithParentNode(id, function(err){
					if(err){
						callback(err);
					}else{
						callback(null);
					}
				});
			}
		});
	},

	deleteGraphWithParentNode: function(parentNodeId, callback){
		client.query("DELETE FROM graph WHERE parentNodeId=$1 returning id returning id",[parentNodeId], function(err, result){
			var graphId = -1;
			if(err){
				callback(err);
			}else if(result.rows.rowCount == 0){
				callback(null);
			}else{
				var graphId = result.rows[0].id;
				//get the ids of all the nodes in the deleted graph and delete them too, returning their ids
				client.query("DELTE FROM edge WHERE graphId=$1",[graphId], function(err){
					
					if(err){
						callback(err);
					}else{

						client.query("DELETE FROM node WHERE graphId=$1 RETURNING id",[graphId], function(err, result){
							if(err){
								callback(err);
							}else if(result.rows.rowCount == 0){
								//maybe its an empty graph, so return null
								callback(null);
							}else{
								//delete all the nodes returned which in turn delete the graphs within them if any
								for(var i=0; i<result.rows.rowCount; i++ ){
									deleteGraphWithParentNode(result.rows[i], function(err){
										if(err){
											callback(err);
										}
										//return if youre done with recursive call for all the nodes
										if(i==(result.rows.rowCount-1)){
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
	},

	getMaxNodeId: function(){
		client.query("SELECT MAX(id) as id FROM node", function(err, result){
			if(err){
				callback(err);
			}else{
				callback(null, result.rows[0].id);
			}
		});
	},

	getMaxGraphId: function(){
		client.query("SELECT MAX(id) as id FROM graph", function(err, result){
			if(err){
				callback(err);
			}else{
				callback(null, result.rows[0].id);
			}
		});
	},

	deleteStudent: function(studentEmail, callback){
		client.query("DELETE FROM student WHERE studentEmail=$1", [studentEmail], function(err, callback){
			if(err){
				callback(err);
			}else{
				
			}
		});
	},

	deleteProfessor: function(professorEmail, callback){
	
	},

	deleteCourse: function(courseName, courseYear, courseSemester, callback){
		//delete the course
		client.query("DELETE FROM course WHERE courseName=$1 AND courseYear=$2 AND courseSemester=$3", [courseName, courseYear, courseSemester], function(err){
			if(err){
				callback(err);
			}else{
				//delete the course association with the professor
				client.query("DELETE FROM professor_course WHERE courseName=$1 AND courseYear=$2 AND courseSemester=$3", [courseName, courseYear, courseSemester], function(err){
					if(err){
						callback(err);
					}else{
						//also delete the course association with student
						client.query("DELETE FROM student_course WHERE courseName=$1 AND courseYear=$2 AND courseSemester=$3", [courseName, courseYear, courseSemester], function(err){
							if(err){
								callback(err);
							}else{
								callback(null);
							}
						});
					}
				});
		});
	},
	
	
	deleteStudentFromCourse: function(courseName, courseYear, courseSemester, studentEmail, callback){
		client.query("DELETE FROM student_course WHERE courseName=$1 AND courseYear=$2 AND courseSemester=$3 AND email=$4", [courseName, courseYear, courseSemester, studentEmail], function(err){
			callback(err);
		});
	},

	deleteProject: function(projectName, courseName, courseYear, courseSemester, callback){
		client.query("DELETE FROM project WHERE name=$1 AND courseName=$2 AND courseYear=$3 AND courseSemseter=$4", [projectName, courseName, courseYear, courseSemester], function(err){
			if(err){
				callback(err);	
			}else{
				//delete the project association with the students (and subsequently delete the graphs associated with those projects if you uncomment the code block below)
				client.query("DELETE FROM student_project WHERE projectName=$1 AND courseName=$2 AND courseYear=$3 AND courseSemseter=$4 RETURNING graphId", [projectName, courseName, courseYear, courseSemester]",
				function(err, result){
					if(err) callback(err);
					else callback(null);
					/*
					for(var i=0; i<result.rowCount; i+=){
						this.deleteGraph(result.rows[i].graphId, function(err){
							if(err){
								callback(err);
							}
							//return when all the graphs are deleted 
							if(i==(result.rowCount-1)){
								callback(null);
							}
						});
					}
					*/
				});
			}
		});
	},



	//DELETE queries ------------------------------------------------------------------------


	deleteNode2: function(node, callback){
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

	deleteGraph2: function(graph, callback){
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

	deleteAllLabsInCourse2: function(courseId, callback){
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

	deleteCourse2: function(courseId, callback){
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

