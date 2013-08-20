var firstNode = false;
var width = 0;
var height = 0;
var r = false;
var miniR = false;
var miniRect = false;
var canvas = false;
var trashcan = false;
var scissors = false;
var edgeClippers = false;
var overTrashcan = false;
var background = false;

var focusNode = false;
var currentGraph = false;
var renderer = false;
var centerX = 0;
var centerY = 0;
var uniqueID = -1;

var onload = function(){
	width = 5000;//document.getElementById("canvas").offsetWidth - 10;
    	height = 5000;//$(document).height();
	centerX = width/2;
	centerY = height/2;
	r = Raphael("canvas", width, height);
	background = r.rect(0, 0, width, height);
	background.attr({fill: "white", stroke: "black"});
	background.dblclick(function(){
			if(focusNode){
				//updateGraph(currentGraph);
				
				focusNode.contract();
				currentGraph = focusNode.graph;
				focusNode = focusNode.owner;
			}
		});
	background.drag(function(dx, dy, x, y){
				if(edgeClippers){
					var curX = x - canvas.offsetLeft + canvas.scrollLeft;
					var curY = y - canvas.offsetTop + canvas.scrollTop;
					this.pathString += " L " + curX + " " + curY;
				
					if(this.path)
						this.path.remove();
					this.path = r.path(this.pathString);
					this.path.attr({"stroke-dasharray": "--", stroke: "red"});
				
					for(var i=0; i<currentGraph.edges.length; i++){
						var currentPath = currentGraph.edges[i].path;
						var a1 = curY - this.prevY;
						var b1 = this.prevX - curX;
						var c1 = a1*this.prevX + b1*this.prevY;;
						var x1 = currentPath.attr('path')[0][1];
						var y1 = currentPath.attr('path')[0][2];
						var x2 = currentPath.attr('path')[1][1];
						var y2 = currentPath.attr('path')[1][2];
						var a2 = y2 - y1;
						var b2 = x1 - x2;
						var c2 = a2*x1 + b2*y1;
						var det = a1*b2 - a2*b1;
						//console.log("(" + this.prevX + ", " + this.prevY + ") (" + curX + ", " + curY + ")___(" + x1 + ", " + y1 + ") (" + x2 + ", " + y2 + ")");
						if(det != 0){
							var x = (b2*c1 - b1*c2)/det;
							var y = (a1*c2 - a2*c1)/det;
							//console.log("(" + x + ", " + y + ")");
							if(x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2) && 
							   x >= Math.min(this.prevX, curX) && x <= Math.max(this.prevX, curX) && y >= Math.min(this.prevY, curY) && y <= Math.max(this.prevY, curY)){
								currentPath.attr({stroke: "red"});
								currentGraph.edges[i].arrow.attr({stroke: "red"});
								this.edgesToRemove[this.edgesToRemove.length] = currentGraph.edges[i];
							}
						}
					}
					this.prevX = curX;
					this.prevY = curY;
				}
			},
			function(x, y){
				if(edgeClippers){
					this.startX = x - canvas.offsetLeft + canvas.scrollLeft;
					this.startY = y - canvas.offsetTop + canvas.scrollTop;
					this.pathString = "M " + this.startX + " " + this.startY;
					this.prevX = this.startX;
					this.prevY = this.startY;
					this.edgesToRemove = new Array();
				}
			},
			function(){
				if(edgeClippers){
					this.path.remove();
					for(var i=0; i<this.edgesToRemove.length; i++){
						this.edgesToRemove[i].sourceNode.removeChild(this.edgesToRemove[i].destNode);
					}
					updateMiniMap();
				}
			});
	
	var sideLength = document.getElementById("minimap").offsetHeight - 2*parseInt(getComputedStyle(document.getElementById("minimap"), null).getPropertyValue('padding-top'));
	document.getElementById("minimap").setAttribute("style", "padding-left:" + (document.getElementById("minimap").offsetWidth-sideLength)/2 + "px");
	document.getElementById("minimap").setAttribute("style", "padding-left:" + (document.getElementById("minimap").offsetWidth-sideLength)/2 + "px");
	
	miniR = Raphael("minimap", sideLength, sideLength);
	miniRect = r.rect(0, 0, document.getElementById("canvas").offsetWidth, document.getElementById("canvas").offsetHeight);
	canvas = document.getElementById("canvas");
	//if($.cookie("mode") == "student"){
		trashcan = r.image("../public/images/trashcan.png", document.getElementById("canvas").offsetWidth - 70, 0, 50, 50);
		trashcan.attr({opacity: .2});
		scissors = r.image("../public/images/scissors.png", document.getElementById("canvas").offsetWidth - 70, document.getElementById("canvas").offsetHeight - 70, 50, 50);
		scissors.attr({opacity: .2});
		scissors.mousedown(function(){
					edgeClippers = !edgeClippers;
				scissors.attr({opacity: edgeClippers ? 1 : .2});
			});
	//}
	
	
	var g = new Graph();
	currentGraph = g;
	
	$(canvas).on('scroll', function() {
		trashcan.attr({x: $(canvas).scrollLeft() + document.getElementById("canvas").offsetWidth - 70});
		trashcan.attr({y: $(canvas).scrollTop()});
		
		scissors.attr({x: $(canvas).scrollLeft() + document.getElementById("canvas").offsetWidth - 70});
		scissors.attr({y: $(canvas).scrollTop() + document.getElementById("canvas").offsetHeight - 70});
		
		miniRect.attr({x: $(canvas).scrollLeft()});
		miniRect.attr({y: $(canvas).scrollTop()});
		updateMiniMap();
	});
	updateMiniMap();
};

//contract all graphs
var contractAll = function(){
	while(focusNode != false){
		focusNode.contract(0);
		currentGraph = focusNode.graph;
		focusNode = focusNode.owner;
	}
};

(function (R) {
    var cloneSet; // to cache set cloning function for optimisation
    
    /**
     * Clones Raphael element from one paper to another
     *     
     * @param {Paper} targetPaper is the paper to which this element 
     * has to be cloned
     *
     * @return RaphaelElement
     */
    R.el.cloneToPaper = function (targetPaper) {
        return (!this.removed &&
            targetPaper[this.type]().attr(this.attr()));
    };
    
    /**
     * Clones Raphael Set from one paper to another
     *     
     * @param {Paper} targetPaper is the paper to which this element 
     * has to be cloned
     *
     * @return RaphaelSet
     */
    R.st.cloneToPaper = function (targetPaper) {
        targetPaper.setStart();
        this.forEach(cloneSet || (cloneSet = function (el) {
            el.cloneToPaper(targetPaper);
        }));
        return targetPaper.setFinish();
    };
}(Raphael));

var updateMiniMap = function(){
	miniR.clear();
	r.forEach(function(element){
		if(element == miniRect){
			var newElement = element.cloneToPaper(miniR);
			newElement.attr({fill: "gray", stroke: "black", "fill-opacity": .1});
			newElement.drag(function(dx, dy){
						newElement.attr({x: this.originalX+dx*(5000/miniR.width), y: this.originalY+dy*(5000/miniR.height)});
						canvas.scrollTop = this.originalY+dy*(5000/miniR.height);
						canvas.scrollLeft = this.originalX+dx*(5000/miniR.width);
					},
					function(){
						this.originalX = this.attr('x');
						this.originalY = this.attr('y');
					},
					function(){
						
					});
		}
		else if(element != trashcan && element != scissors)
			element.cloneToPaper(miniR);
	});
	miniR.setViewBox(0, 0, 5000, 5000, true);
};

var addNode = function(name, description){
	var node = new Node(name, description);
	node.setAppearence(canvas.scrollLeft + canvas.offsetWidth/2, canvas.scrollTop + canvas.offsetHeight/2, 40, renderer);
	node.show();
	currentGraph.addNode(node);
	createNode(node);
	updateMiniMap();
	
	//for frequency prompts
	currentProject.executeNodeFrequencyPrompts(currentStudent, currentGraph.nodes.length);
}

var Node = function(d, description){
	this.data = d;
	this.description = description;
	this.id = uniqueID--;
	this.children = new Array(); //children node array
	this.owner = focusNode;//parent node
	this.graph = false;
	this.subgraph = false;
	this.subgraphId = -1;
	
	//GUI components
	this.color = Raphael.getColor();
	this.responsive = true;
	this.radius = 40;
	this.x = 0;
	this.y = 0;
	this.hidden = true;
	this.body = false;
	//this.top = false;
	this.bottom = false;
	this.text = false;
	this.edges = new Array();
	
};

Node.prototype = {
	getJSON: function(){
		return {id: this.id, description: this.description, x: this.x, y: this.y, color: this.color};
	},
	addChild: function(node){
		this.children[this.children.length] = node;
		return this.addEdge(node);
	},
	removeChild: function(node){
		this.children.splice(this.children.indexOf(node), 1);
		for(var i=0; i<this.edges.length; i++){
			var current = this.edges[i];
			if(current.sourceNode == this && current.destNode == node){
				current.hide();
				this.edges.splice(this.edges.indexOf(current), 1);
				node.edges.splice(node.edges.indexOf(current), 1);
				this.graph.edges.splice(this.graph.edges.indexOf(current), 1);
				deleteEdge(current);
			}
		}
	},
	remove: function(){//BUG: doesn't remove from it's parent's children array
		for(var i=0; i<this.edges.length; i++){
			var edge = this.edges[i];
			if(edge.sourceNode == this){
				edge.destNode.edges.splice(edge.destNode.edges.indexOf(edge), 1)[0].hide();
				
			}
			else if(edge.destNode == this){
				edge.sourceNode.edges.splice(edge.destNode.edges.indexOf(edge), 1)[0].hide();
			}
			this.graph.edges.splice(this.graph.edges.indexOf(edge), 1)[0].hide();
		}
		this.graph.nodes.splice(this.graph.nodes.indexOf(this), 1)[0].hide();
		if(this.id > 0)
			this.graph.removedNodes[this.graph.removedNodes.length] = this;
		
		deleteNode(this);
		updateMiniMap();
	},
	
	//GUI Functions
	setAppearence: function(x, y, rad){
		this.x = x;
		this.y = y;
		this.radius = rad;
		
		//this.display();
	},
	setPosition: function(x, y){
		//var thisX = this.body.attr('cx');
		//var thisY = this.body.attr('cy');
		
		this.body.attr({cx: x, cy: y});
		//this.top.attr({cx: x, cy: y - this.radius*.9});
		this.bottom.attr({cx: x, cy: y + this.radius*.9});
		this.text.attr({x: x, y: y});
		
		/*if(this.subgraph){
			for(i in this.subgraph.nodes){
				var currentNode = this.subgraph.nodes[i];
				var currentNodeX = currentNode.body.attr('cx');
				var currentNodeY = currentNode.body.attr('cy');
				currentNode.setPosition(currentNodeX - (thisX - x), currentNodeY - (thisY - y));
			}
		}*/
	},
	getOnMoveFunction: function(){
		var selfRef = this;
		return function(dx, dy){
			if(selfRef.responsive){
				selfRef.x = this.originalX + dx;
				selfRef.y = this.originalY + dy;
				selfRef.setPosition(this.originalX + dx, this.originalY + dy);
				selfRef.drawEdges();
				if(Raphael.isBBoxIntersect(trashcan.getBBox(), this.getBBox()))
					trashcan.attr({opacity: 1});
				else if(trashcan.attr("opacity") != .2)
					trashcan.attr({opacity: .2});
			}
		};
	},
	getOnStartFunction: function(){
		var selfRef = this;
		return function(){
			this.originalX = this.attr('cx');
			this.originalY = this.attr('cy');
			if(this.responsive)
				this.animate({"fill-opacity": .3}, 500);
		
			setInfo(selfRef.data, selfRef.description);
		};
	},
	getOnEndFunction: function(){
		var selfRef = this;
		return function(){
			if(this.responsive)
				this.animate({"fill-opacity": .8}, 500);
			
			if(Raphael.isBBoxIntersect(trashcan.getBBox(), this.getBBox())){
				selfRef.remove();
			}
			
			updateNode(selfRef);
			updateMiniMap();
		}
	},
	addEdge: function(node){
		var edge = new Edge(this, node);//this.r.connection(this.bottom, node.top, {directed: true});
		this.edges[this.edges.length] = edge;
		node.edges[node.edges.length] = edge;
		this.graph.edges[this.graph.edges.length] = edge;
		return edge;
	},
	drawEdges: function(){
		for(i in this.edges){
			this.edges[i].show();
		}
	},
	getTopClickFunction: function(){
		var selfRef = this;
		return function(e){
			if(firstNode && selfRef.responsive){
				var edge = firstNode.addChild(selfRef);
				edge.show();
				createEdge(edge);
				updateMiniMap();
				firstNode.bottom.animate({fill: "black", stroke: "black"}, 250);
				firstNode = false;
			}
		};
	},
	getBottomClickFunction: function(){
		var selfRef = this;
		return function(e){
			if(selfRef.responsive){
				firstNode = selfRef;
				this.animate({fill: "red", stroke: "red"}, 250);
			}
		};
		
	},
	getToggleFocusFunction: function(){
		var selfRef = this;
		var growth = 200;
		var time = 2000;
		
		return function(e){
			if(!focusNode.subgraph ||focusNode.subgraph.contains(selfRef.id)){
				focusNode = selfRef;
				centerX = selfRef.body.attr('cx');	
				centerY = selfRef.body.attr('cy');
				uniqueID = -1;
				
				if(!selfRef.subgraph){
					selfRef.subgraph = new Graph();
					selfRef.subgraph.title = selfRef.data + "'s subgraph";
					selfRef.subgraph.topLevel = false;
					selfRef.subgraph.parent = selfRef;
					createGraph(selfRef.subgraph);
				}
				currentGraph = selfRef.subgraph;
				selfRef.expand();
				/*getSubGraph(selfRef, currentProject, currentStudent, function(data, status){
					console.log("data: " + data);
			
					if(!selfRef.subgraph){
						selfRef.subgraph = new Graph();
						selfRef.subgraph.title = selfRef.data + "'s subgraph";
						selfRef.subgraph.topLevel = false;
						selfRef.subgraph.parent = selfRef;
					}
					currentGraph = selfRef.subgraph;

					selfRef.expand();
				});*/
			}
		};
	},
	expand: function(){
		//hide current graph
		for(var i=0; i<this.graph.nodes.length; i++){
			if(this.graph.nodes[i] != this){
				this.graph.nodes[i].body.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
				this.graph.nodes[i].text.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
				this.graph.nodes[i].bottom.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
			}
		}
		for(var i=0; i<this.graph.edges.length; i++){
			this.graph.edges[i].path.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
			this.graph.edges[i].arrow.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
		}
		
		var tempCircle = r.circle(this.x, this.y, this.radius).attr({fill: this.color, "fill-opacity": .8, stroke: this.color});
		tempCircle.animate({r: 1000, "fill-opacity": .1}, 1000);
		this.body.remove();//animate({r: 1000, "fill-opacity": .1}, 1000);
		this.bottom.remove();
		this.text.remove();
		
		//show new graph
		var selfRef = this;
		setTimeout(function(){
			background.attr({fill: tempCircle.attr("fill"), stroke: tempCircle.attr("stroke"), "fill-opacity": tempCircle.attr("fill-opacity")});
			tempCircle.remove();
			selfRef.body.remove();
			selfRef.graph.hide();
			selfRef.subgraph.show();
			updateMiniMap();
		}, 1000);
	},
	contract: function(time){
		if(arguments.length == 0)
			time = 1000;
		
		/*this.show();
		this.bottom.hide();
		this.text.hide();
		this.body.attr({r: 1000, "fill-opacity": .1});
		this.body.animate({r: this.radius, "fill-opacity": .8}, time);*/
		var tempCircle = r.circle(this.x, this.y, 1000).attr({fill: this.color, "fill-opacity": .1, stroke: this.color});
		tempCircle.animate({r: this.radius, "fill-opacity": .8}, time);
		setTimeout(updateMiniMap, time+100);
		
		
		//hide current graph
		for(var i=0; i<this.subgraph.nodes.length; i++){
			if(!this.subgraph.nodes[i].hidden){
				this.subgraph.nodes[i].body.animate({"fill-opacity": 0, "stroke-opacity": 0}, time/2);
				this.subgraph.nodes[i].text.animate({"fill-opacity": 0, "stroke-opacity": 0}, time/2);
				this.subgraph.nodes[i].bottom.animate({"fill-opacity": 0, "stroke-opacity": 0}, time/2);
			}
		}
		for(var i=0; i<this.subgraph.edges.length; i++){
			if(!this.subgraph.edges[i].hidden){
				this.subgraph.edges[i].path.animate({"fill-opacity": 0, "stroke-opacity": 0}, time/2);
				this.subgraph.edges[i].arrow.animate({"fill-opacity": 0, "stroke-opacity": 0}, time/2);
			}
		}
		
		//show new graph
		var selfRef = this;
		var func = function(){
				selfRef.subgraph.hide();
				selfRef.graph.show();
				tempCircle.remove();
				if(!selfRef.owner)
					background.attr({fill: "white", stroke: "black"});
				else{
					background.attr({fill: selfRef.owner.color, stroke: selfRef.owner.color, "fill-opacity": .1});
				}
			   };
		if(time == 0)
			func();
		else
			setTimeout(func, time);
	},
	hide: function(){
		this.hidden = true;
		if(this.body)
			this.body.remove();
		if(this.bottom)
			this.bottom.remove();
		if(this.text)
			this.text.remove();
	
		for(var i=0; i<this.edges.length; i++){
			this.edges[i].hide();
		}
	},
	show: function(){
		this.hidden = false;
		this.body = r.circle(this.x, this.y, this.radius).attr({fill: this.color, "fill-opacity": .8, stroke: this.color});
		//this.top = r.circle(this.x, this.y - this.radius*.9, this.radius*.1).attr({fill: "black", stroke: "black", "fill-opacity": .8});
		this.bottom = r.circle(this.x, this.y + this.radius*.9, this.radius*.1).attr({fill: "black", stroke: "black", "fill-opacity": .8});
		this.text = r.text(this.x, this.y, this.data);
		
		this.body.drag(this.getOnMoveFunction(), this.getOnStartFunction(), this.getOnEndFunction());
		this.body.dblclick(this.getToggleFocusFunction());
		this.body.click(this.getTopClickFunction());
		this.bottom.click(this.getBottomClickFunction());
	}
	
};

var Edge = function(sourceNode, destNode){
	this.sourceNode = sourceNode;
	this.destNode = destNode;
	this.path = false;
	this.arrow = false;
	this.hidden = true;
};
Edge.prototype = {
	getJSON: function(){
		return {sourceId: this.sourceNode.id, destinationId: this.destNode.id};
	},
	show: function(){
		this.hidden = false;
		if(this.path)
			this.path.remove();
		if(this.arrow)
			this.arrow.remove();
		var angle = Math.atan2(this.sourceNode.body.attr('cy') - this.destNode.body.attr('cy'), this.sourceNode.body.attr('cx') - this.destNode.body.attr('cx'));
		var x1 = this.sourceNode.body.attr('cx') - this.sourceNode.body.attr('r')*Math.cos(angle);
		var y1 = this.sourceNode.body.attr('cy') - this.sourceNode.body.attr('r')*Math.sin(angle);
		var x2 = this.destNode.body.attr('cx') + this.destNode.body.attr('r')*Math.cos(angle);
		var y2 = this.destNode.body.attr('cy') + this.destNode.body.attr('r')*Math.sin(angle);
		
		var ang = angle + Math.PI;
		var p = "M " + x2 + " " + y2 + " L " + (x2 + 10*Math.cos(angle+Math.PI/4)) + " " + (y2 + 10*Math.sin(angle+Math.PI/4)) + " M " + x2 + " " + y2 + " L " + (x2 + 10*Math.cos(angle-Math.PI/4)) + " " + (y2 + 10*Math.sin(angle-Math.PI/4));
		
		this.path = r.path("M " + x1 + " " + y1 + " L " + x2 + " " + y2);
		this.arrow = r.path(p);
	},
	hide: function(){
		this.hidden = true;
		this.path.remove();
		this.arrow.remove();
	}
};

var Graph = function(){
	this.id = -1;
	this.version = 1;
	this.nodes = new Array();
	this.edges = new Array();
	this.title = "";
	this.graphHistory = false;
	this.parent = false;
	this.removedNodes = new Array();
};

Graph.prototype = {
	addNode: function(node){
		this.nodes[this.nodes.length] = node;
		node.graph = this;
	},
	contains: function(id){
		for(i in this.nodes)
			if(this.nodes[i].id == id)
				return true;
		return false;
	},
	
	//GUI Functions
	show: function(){
		for(var i=0; i<this.nodes.length; i++)
			this.nodes[i].show();
		for(var i=0; i<this.edges.length; i++)
			this.edges[i].show();
	},
	hide: function(){
		for(var i=0; i<this.nodes.length; i++)
			this.nodes[i].hide();
		for(var i=0; i<this.edges.length; i++)
			this.edges[i].hide();
	},
	drawEdges: function(){
		for(i in this.edges){
			this.edges[i].show();
		}
	},
	getLink: function(){
		return "graph";
	},
	getLinkType: function(){
		return "graph";
	},
	getIndexOfNode: function(node){
		for(var i=0; i<this.nodes.length; i++){
			var current = this.nodes[i];
			if(current == node)
				return i;
		}
	},
	clone: function(owner, version, deepestSubgraph, topLevel){
		var cloneGraph = new Graph();
		cloneGraph.id = -1;
		if(!owner){
			this.graphHistory.addGraph(cloneGraph);
			
			deepestSubgraph = this.getDeepestSubgraph();
			topLevel = cloneGraph;
		}
		cloneGraph.version = version || this.version+1;
		cloneGraph.parent = owner;
		
		var showFunction = function(){
			showGraph(topLevel);
			currentProject.executeNewVersionPrompts(currentStudent);
		};
		
		if(this == deepestSubgraph && this.nodes.length == 0)
			createGraph(cloneGraph, showFunction);
		else
			createGraph(cloneGraph);
		
		for(var i=0; i<this.nodes.length; i++){
			var current = this.nodes[i];
			var cloneNode = new Node(current.data, current.description);
			cloneNode.id = -1;
			cloneNode.setAppearence(current.x, current.y, current.radius);
			cloneNode.color = current.color;
			cloneNode.owner = owner;
			cloneGraph.addNode(cloneNode);
			if(this == deepestSubgraph && i==this.nodes.length-1 && this.edges.length == 0)
				createNode(cloneNode, showFunction);
			else
				createNode(cloneNode);
			
			if(current.subgraph != false){
				cloneNode.subgraph = current.subgraph.clone(cloneNode, cloneGraph.version, deepestSubgraph, topLevel);
			}
		}
		
		for(var i=0; i<this.nodes.length; i++){
			var current = this.nodes[i];
			var currentClone = cloneGraph.nodes[i];
			for(var j=0; j<current.children.length; j++){
				var currentChild = current.children[j];
				//console.log("source: " + currentClone.id + " " + cloneGraph.nodes[this.getIndexOfNode(currentChild)].id);
				currentClone.addChild(cloneGraph.nodes[this.getIndexOfNode(currentChild)]);
			}
		}
		
		for(var i=0; i<cloneGraph.edges.length; i++){			//THERE IS A PROBLEM SOMEWHERE WITH createEdge being called more than once
			if(this == deepestSubgraph && i==this.edges.length-1)
				createEdge(cloneGraph.edges[i], showFunction);
			else
				createEdge(cloneGraph.edges[i]);
		}
		
		return cloneGraph;
	},
	getDeepestSubgraph: function(){//if there is a tie for deepest, the node with the highest index will be chosen
		var worklist = new Array();
		var deepest = 0;
		var subgraph = this;
		
		for(var i=this.nodes.length-1; i>=0; i--){
			worklist.push({node: this.nodes[i], depth: 0});
		}
		
		while(worklist.length != 0){
			var element = worklist.pop();
			if(element.node.subgraph){
				for(var i=element.node.subgraph.nodes.length-1; i>=0; i--){
					var currentDepth = element.depth + 1;
					worklist.push({node: element.node.subgraph.nodes[i], depth: currentDepth});
					if(currentDepth >= deepest){
						deepest = currentDepth;
						subgraph = element.node.subgraph;
					}
				}
			}
		}
		
		return subgraph;
	},
	getNodeWithId: function(id){
		for(var i=0; i<this.nodes.length; i++){
			if(this.nodes[i].id == id)
				return this.nodes[i];
		}
		return false;
	}
};







