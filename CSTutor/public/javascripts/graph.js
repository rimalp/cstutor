var firstNode = false;
var width = 0;
var height = 0;
var r = false;
var miniR = false;
var miniRect = false;
var canvas = false;
var trashcan = false;
var overTrashcan = false;
var background = false;

var focusNode = false;
var currentGraph = false;
var renderer = false;
var centerX = 0;
var centerY = 0;
var uniqueID = 0;

var onload = function(){
	width = 5000;//document.getElementById("canvas").offsetWidth - 10;
    	height = 5000;//$(document).height();
	centerX = width/2;
	centerY = height/2;
	r = Raphael("canvas", width, height);
	background = r.rect(0, 0, width, height);
	background.attr({fill: "white", stroke: "black"});
	background.dblclick(function(){
			console.log(focusNode.data);
			focusNode.contract();
			focusNode = focusNode.owner;
			currentGraph = focusNode.graph;
		});
	
	var sideLength = document.getElementById("minimap").offsetHeight - 2*parseInt(getComputedStyle(document.getElementById("minimap"), null).getPropertyValue('padding-top'));
	document.getElementById("minimap").setAttribute("style", "padding-left:" + (document.getElementById("minimap").offsetWidth-sideLength)/2 + "px");
	document.getElementById("minimap").setAttribute("style", "padding-left:" + (document.getElementById("minimap").offsetWidth-sideLength)/2 + "px");
	
	miniR = Raphael("minimap", sideLength, sideLength);
	miniRect = r.rect(0, 0, document.getElementById("canvas").offsetWidth, document.getElementById("canvas").offsetHeight);
	canvas = document.getElementById("canvas");
	trashcan = r.image("../public/images/trashcan.png", document.getElementById("canvas").offsetWidth - 60, 0, 50, 50);
	trashcan.mouseover(function(){
		overTrashcan = true;
	});
	trashcan.mouseout(function(){
		overTrashcan = false;
	});
	
	var g = new Graph();
	currentGraph = g;

	$(canvas).on('scroll', function() {
		trashcan.attr({x: $(canvas).scrollLeft() + document.getElementById("canvas").offsetWidth - 60});
		trashcan.attr({y: $(canvas).scrollTop()});
		
		miniRect.attr({x: $(canvas).scrollLeft()});
		miniRect.attr({y: $(canvas).scrollTop()});
		updateMiniMap();
	});
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
		else if(element != trashcan)
			element.cloneToPaper(miniR);
	});
	miniR.setViewBox(0, 0, 5000, 5000, true);
};

var addNode = function(name, description){
	var node = new Node(name, description);
	node.setAppearence(centerX, centerY, 40, renderer);
	node.show();
	currentGraph.addNode(node);
	updateMiniMap();
}

var Node = function(d, description){
	this.data = d;
	this.description = description;
	this.id = uniqueID++;
	this.children = new Array();
	this.owner = focusNode;
	this.graph = false;
	this.subgraph = false;
	
	//GUI components
	this.color = Raphael.getColor();
	this.responsive = true;
	this.radius = 40;
	this.x = 0;
	this.y = 0;
	this.body = false;
	//this.top = false;
	this.bottom = false;
	this.text = false;
	this.edges = new Array();
	
};

Node.prototype = {
	addChild: function(node){
		this.children[this.children.length] = node;
		return this.addEdge(node);
	},
	remove: function(){
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
				firstNode.addChild(selfRef).show();
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
				if(!selfRef.subgraph){
					selfRef.subgraph = new Graph();
				}
				currentGraph = selfRef.subgraph;

				selfRef.expand();
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
		
		this.body.animate({r: 1000, "fill-opacity": .1}, 1000);
		this.bottom.remove();
		this.text.remove();
		
		//show new graph
		var selfRef = this;
		setTimeout(function(){
			background.attr({fill: selfRef.body.attr("fill"), stroke: selfRef.body.attr("stroke"), "fill-opacity": selfRef.body.attr("fill-opacity")});
			selfRef.body.remove();
			selfRef.subgraph.show();
			updateMiniMap();
		}, 1000);
	},
	contract: function(){
		//hide current graph
		for(var i=0; i<this.subgraph.nodes.length; i++){
			this.subgraph.nodes[i].body.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
			this.subgraph.nodes[i].text.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
			this.subgraph.nodes[i].bottom.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
		}
		for(var i=0; i<this.subgraph.edges.length; i++){
			this.subgraph.edges[i].path.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
			this.subgraph.edges[i].arrow.animate({"fill-opacity": 0, "stroke-opacity": 0}, 500);
		}
		
		//show new graph
		var selfRef = this;
		setTimeout(function(){
			selfRef.graph.show();
			if(!selfRef.owner)
				background.attr({fill: "white", stroke: "black"});
			else{
				background.attr({fill: selfRef.owner.color, stroke: selfRef.owner.color, "fill-opacity": .1});
			}
		}, 1000);
	},
	hide: function(){
		if(this.body)
			this.body.remove();
		if(this.top)
			this.top.remove();
		if(this.bottom)
			this.bottom.remove();
		if(this.text)
			this.text.remove();
	
		for(var i=0; i<this.edges.length; i++){
			this.edges[i].hide();
		}
	},
	show: function(){
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
};
Edge.prototype = {
	show: function(){
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
		this.path.remove();
		this.arrow.remove();
	}
};

var Graph = function(){
	this.nodes = new Array();
	this.edges = new Array();
	this.title = "";
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
		for(i in this.nodes)
			this.nodes[i].show();
		for(i in this.edges)
			this.edges[i].show();
	},
	hide: function(){
		for(i in this.nodes)
			this.nodes[i].hide();
		for(i in this.edges)
			this.edges[i].hide();
	},
	drawEdges: function(){
		for(i in this.edges){
			this.edges[i].show();
		}
	},
	getLink: function(){
		return "graph";
	}
};
