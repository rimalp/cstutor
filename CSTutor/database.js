var client = null;


var Database = function(connection){
	client = connection;
	testDB();
}
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




	// //select the top level for a given project for a given student
	// getTopLevelGraphForLabForStudent2: function(projectId, email, callback){
	// 	var q = "SELECT * FROM graph, student_project WHERE student_project.projectId="+projectId+
	// 	" AND student_project.email='"+email+"' AND student_project.graphId=graph.graphId AND topLevel=true"+
	// 	" ORDER BY graph.version";
	// 	rawQuery(q, function(err, result){
	// 		if(err!=null){
	// 			return callback(err);
	// 		}else{
	// 			var graphs = new Array();
	// 			for(var row in result){
	// 				//TODO: do this for each row (graph);
	// 				var topGraph = new Graph();
	// 				topGraph.id = row.id;
	// 				topGraph.version = row.version;
	// 				topGraph.topLevel = row.topLevel;
	// 				topGraph.title = row.description;
	// 				getNodesForGraph(topGraph.id, topGraph, function(err, nodes){
	// 					topGraph.nodes = nodes;
	// 					//now fetch the subgraphs for each node (if exists) in a separate method recursively
	// 					for(var node in nodes){
	// 						if(node.subgraphId == -1) continue;
	// 						getSubGraphForNode(node, projectId, email, topGraph.version, function(err, resultSubGraph){
	// 							if(err != null)
	// 								console.log("error fetching subgraph for node. " + err);
	// 							else{
	// 								//assign the subgraph to the node
	// 								node.subgraph = resultSubGraph;
	// 								node.subgraphId = resultSubGraph.id;
	// 							}
	// 						});
	// 					}
	// 					graphs.push(topGraph);
	// 					//finally call the callback function with the Graph Object as desired
	// 					return callback(null, graphs);		
	// 				});
	// 			}
	// 		}
	// 	});
	// },
	//get all the nodes for the given graph
	// getNodesForGraph: function(graphId, ownerGraph, callback){
	// 	var nodesQuery = "SELECT * from nodes where graphId="+graphId+"";
	// 	rawQuery(nodesQuery, function(err, result){
	// 		if(err != null){
	// 			return callback(err);
	// 		}else{
	// 			var nodes = new Array();
	// 			for(var row in result){
	// 				var newNode = new Node();
	// 				newNode.id = row.id;
	// 				newNode.x = row.x;
	// 				newNode.y = row.y;
	// 				newNode.graph = ownerGraph;
	// 				newNode.parentNodeId = row.parentNodeId;
	// 				newNode.subgraphId = row.subGraphId;
	// 				newNode.data = row.name;
	// 				newNode.description = row.description;
	// 				nodes.push(newNode);
	// 			}
	// 			//fetch the edges for this node this node to the list of nodes to be returned
	// 			getEdgesForGraph(graphId, function(err, rows){
	// 				var src, dst;
	// 				for(var row in rows){
	// 					for(var node in nodes){
	// 						if(row.src == node.id)
	// 							src = node;
	// 						if(row.dst == node.id)
	// 							dst = node;
	// 					}
	// 					src.addChild(dst);
	// 				}
	// 			});
	// 			//return the array of nodes
	// 			callback(null, nodes)
	// 		}
	// 	});
	// }, 

	// getEdgesForGraph: function(graphId, callback){
	// 	var q = "SELECT * FROM edge WHERE graphId="+graphId+"";
	// 	rawQuery(q, function(err, result){
	// 		if(err != null){
	// 			return callback(err);
	// 		}else{
	// 			return callback(null, result);
	// 		}
	// 	});
	// },

	// getSubGraphForNode: function(node, projectId, email, version, callback){
	// 	var q = "SELECT * FROM graph, student_project WHERE student_project.projectId="+projectId+
	// 	" AND student_project.email='"+email+"' AND student_project.graphId=graph.graphId AND topLevel=false"+
	// 	" AND graph.parentNodeId="+node.id+" AND graph.version="+version+"";

	// 	rawQuery(q, function(err, result){
	// 		if(err != null){
	// 			callback(err);
	// 		}else{
	// 			var subGraph = new Graph();
	// 			subGraph.id = row[0].id;
	// 			subGraph.version = row[0].version;
	// 			subGraph.topLevel = row[0].topLevel;
	// 			subGraph.title = row[0].description;
				
	// 			//now get all the nodes for the graph
	// 			getNodesForGraph(subGraph.id, subGraph, function(err, nodes){
	// 					topGraph.nodes = nodes;
	// 					//now fetch the subgraphs for each node (if exists) recursively
	// 					for(var node in nodes){
	// 						if(node.subgraphId == -1) continue; //base case
	// 						//recursive call
	// 						getSubGraphForNode(node, projectId, email, topGraph.version, function(err, resultSubGraph){
	// 							if(err != null)
	// 								console.log("error fetching subgraph for node. " + err);
	// 							else{
	// 								//assign the subgraph to the node
	// 								node.subgraph = subGraph;
	// 								node.subgraphId = subGraph.id;
	// 							}
	// 						});
	// 					}
	// 					return callback(null, subGraph);
	// 			});
	// 		}
	// 	});
	// },

	
	//CREATE-UPDATE queries ----- need to check first if exists then insert if need be -------
	//===============================================
	createProfessor: function(professor, callback){
		//check if it exists
		client.query("SELECT email FROM professor WHERE email=$1 LIMIT 1", [professor.email], function(err, result){
			if(err){
				callback(err);
			}else if(result.rows.rowCount == 0){
				//insert
				client.query("INSERT INTO professor(email, firstName, lastName, password) VALUES($1,$2,$3,$4)",
					[professor.email, professor.firstName, professor.lastName, professor.password], function(err, result){
					if(err){
						callback(err);
					}else{
						callback(null, result);
					}
				});

			}else{
				//update
				client.query("UPDATE professor SET firstName=$1, lastName=$2, password=$3 WHERE email=$4",
					[professor.firstName, professor.lastName, professor.password, professor.email],
					function(err){
						callback(err);
				});
			}
		});
	},

	createStudent: function(student, callback){
		//check if it exists
		client.query("SELECT email FROM student WHERE email=$1 LIMIT 1", [professor.email], function(err, result){
			if(err){
				callback(err);
			}else if(result.rows.rowCount == 0){
				//insert
				client.query("INSERT INTO student(email, firstName, lastName, password) VALUES($1,$2,$3,$4)",
					[student.email, student.firstName, student.lastName, student.password], function(err, result){
					if(err){
						callback(err);
					}else{
						callback(null, result);
					}
				});

			}else{
				//update
				client.query("UPDATE student SET firstName=$1, lastName=$2, password=$3 WHERE email=$4",
					[student.firstName, student.lastName, student.password, student.email],
					function(err){
						callback(err);
				});
			}
		})
	},

	createCourse: function(course, professorEmail, callback){
		client.query("SELECT year FROM course WHERE name=$1 AND year=$2 AND semester=$3",[course.name, course.year, course.semester], 
		function(err, result){
			if(err){
				callback(err);
			}else if(result.rows.rowCount ==0){
				//insert
				client.query("INSERT INTO course(name, year, semester) VALUES($1, $2, $3)", [course.name, course.year, course.semester],
				function(err, result){
					if(err){
						callback(err);
					}else{
						//insert into professor_course table
						client.query("INSERT INTO professor_course VALUES($1, $2, $3, $4)", [professorEmail, course.name, course.year, course,semester],
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
				 [course.name, course.year, course.semester], function(err){
					if(err){
						callback(err);
					}else{
						client.query("UPDATE professor_course SET email=$1, courseName=$2, courseYear=$3, courseSemester=$4 WHERE "+
							          "email=$1, courseName=$2, courseYear=$3, courseSemester=$4", [professorEmail, course.name, course.year, course.semester],
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
		[project.courseName, project.courseYear, project.courseSemester, project.name], function(err, result){ 
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
															callback(null, newGraphId);
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
									for(var j=0; var<edgeInfo.length; j++){
										client.query("INSERT INTO edge VALUES($1,$2,$3)",
											[edgeInfo.sourceId, edgeInfo.destinationId, edgeInfo.graphId], function(err){
												if(err){
													callback(err);
												}
												if(j==(edgeInfo.length-1)){
													//done with update/delete
													callback(null);
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

	},

	deleteProfessor: function(professorEmail, callback){

	},

	deleteCourse: function(courseName, courseYear, courseSemester, callback){

	},

	deleteProject: function(projectName, courseName, courseYear, courseSemester, callback){

	},








	createProfessor2: function(prof, callback){
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
	createStudent2: function(student, callback){
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

	createCourse2: function(course, professor, callback){
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

	addStudentToCourse2: function(studentEmail, courseId, callback){
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

	createLab2: function(lab, courseId, callback){
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

	createGraph2: function(graph, projectId, studentEmail, callback){
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

	createNode2: function(node, callback){
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
	updateStudent2: function(student, callback){
		client.query("UPDATE student SET firstName=$1, lastName=$2, password=$3, frequency=$4 WHERE email=$5",
			[student.firstName, student.lastName, student.password, student.frequency, student.email],
			function(err){
				callback(err);
			});
	},

	updateProfessor2: function(professor, callback){
		client.query("UPDATE professor SET firstName=$1, lastName=$2, password=$3 WHERE email=$4",
			[professor.firstName, professor.lastName, professor.password, professor.email],
			function(err){
				callback(err);
			});
	},

	updateCourse2: function(course, callback){
		client.query("UPDATE course SET name=$1 WHERE id=$2", [course.name, course.id], function(err){
			callback(err);
		});
	},

	updateLab2: function(lab, courseId, callback){
		client.query("UPDATE project SET description=$1, dueDate=$2, courseId=$3 WHERE id=$4",
			[lab.description, lab.dueDate, lab.courseId, lab.id], function(err){
				callback(err);
			});
	}, 
	updateNode2: function(node, graphId, callback){
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

	updateGraph2: function(graph, callback){
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

