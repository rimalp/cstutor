var firstNode = false;
var width = 0;
var height = 0;
var r = false;
var miniR = false;
var miniRect = false;
var canvas = false;
var trashcan = false;
var overTrashcan = false;

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
	miniR = Raphael("minimap", document.getElementById("minimap").offsetWidth, document.getElementById("minimap").offsetHeight);
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
			newElement.drag(	function(dx, dy){
						newElement.attr({x: this.originalX+dx*(5000/210), y: this.originalY+dy*(5000/210)});
						canvas.scrollTop = this.originalY+dy*(5000/210);
						canvas.scrollLeft = this.originalX+dx*(5000/210);
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
		var thisX = this.body.attr('cx');
		var thisY = this.body.attr('cy');
		
		this.body.attr({cx: x, cy: y});
		//this.top.attr({cx: x, cy: y - this.radius*.9});
		this.bottom.attr({cx: x, cy: y + this.radius*.9});
		this.text.attr({x: x, y: y});
		
		if(this.subgraph){
			for(i in this.subgraph.nodes){
				var currentNode = this.subgraph.nodes[i];
				var currentNodeX = currentNode.body.attr('cx');
				var currentNodeY = currentNode.body.attr('cy');
				currentNode.setPosition(currentNodeX - (thisX - x), currentNodeY - (thisY - y));
			}
		}
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

				selfRef.expand(time, growth*2, 0);
			}
			else if(focusNode.id == selfRef.id){
				focusNode = selfRef.owner;
				currentGraph = selfRef.graph;
				centerX = selfRef.owner ? selfRef.owner.body.attr('cx') : width/2;
				centerY = selfRef.owner ? selfRef.owner.body.attr('cy') : height/2;

				selfRef.contract(time, growth*2, 0);
			}
		};
	},
	expand: function(time, amount, direction){
		var i = 0;
		var selfRef = this;
		var interval = setInterval(function(){
			selfRef.graph.drawEdges();
			i+=10;
			if(i == time+500)
				clearInterval(interval);
		}, 10);
		
		var growth = this.body.attr('r') + amount;
		for(i in this.graph.nodes){
			var currentNode = this.graph.nodes[i];
			if(currentNode != this){
				currentNode.responsive = false;
				var angle = Math.atan2(currentNode.body.attr('cy')-this.body.attr('cy'), currentNode.body.attr('cx')-this.body.attr('cx'));
				currentNode.body.animate({cx: currentNode.body.attr('cx') + growth*Math.cos(angle), cy: currentNode.body.attr('cy') + growth*Math.sin(angle)}, time);
				//currentNode.top.animate({cx: currentNode.top.attr('cx') + growth*Math.cos(angle), cy: currentNode.top.attr('cy') + growth*Math.sin(angle)}, time);
				currentNode.bottom.animate({cx: currentNode.bottom.attr('cx') + growth*Math.cos(angle), cy: currentNode.bottom.attr('cy') + growth*Math.sin(angle)}, time);
				currentNode.text.animate({x: currentNode.text.attr('x') + growth*Math.cos(angle), y: currentNode.text.attr('y') + growth*Math.sin(angle)}, time);
			}
		}
		if(direction == 0)
			this.text.animate({x: width/2, y: 20}, time);
		else
			this.text.animate({x: width/2, y: -100}, time);
		this.body.animate({r: growth, "fill-opacity": .1}, time);
		//this.top.animate({cy: this.body.attr('cy') - .9*growth, r: growth/10, "fill-opacity": .1}, time);
		this.bottom.animate({cy: this.body.attr('cy') + .9*growth, r: growth/10, "fill-opacity": .1}, time);
		
		this.responsive = false;
		this.subgraph.show();
		if(this.owner)
			this.owner.expand(time, amount, direction+1);
	},
	contract: function(time, amount, direction){
		var i = 0;
		var selfRef = this;
		var interval = setInterval(function(){
			selfRef.graph.drawEdges();
			i+=10;
			if(i == time+500)
				clearInterval(interval);
		}, 10);		
		
		var growth = this.body.attr('r') - amount;
		for(i in this.graph.nodes){
			var currentNode = this.graph.nodes[i];
			if(currentNode != this){
				if(direction <= 0)
					currentNode.responsive = true;
				var angle = Math.atan2(currentNode.body.attr('cy')-this.body.attr('cy'), currentNode.body.attr('cx')-this.body.attr('cx'));
				currentNode.body.animate({cx: currentNode.body.attr('cx') - amount*Math.cos(angle), cy: currentNode.body.attr('cy') - amount*Math.sin(angle)}, time);
				//currentNode.top.animate({cx: currentNode.top.attr('cx') - amount*Math.cos(angle), cy: currentNode.top.attr('cy') - amount*Math.sin(angle)}, time);
				currentNode.bottom.animate({cx: currentNode.bottom.attr('cx') - amount*Math.cos(angle), cy: currentNode.bottom.attr('cy') - amount*Math.sin(angle)}, time);
				currentNode.text.animate({x: currentNode.text.attr('x') - amount*Math.cos(angle), y: currentNode.text.attr('y') - amount*Math.sin(angle)}, time);
			}
		}
		if(direction == 0){
			this.text.animate({x: this.body.attr('cx'), y: this.body.attr('cy')}, time);
			
			this.body.animate({"fill-opacity": .8}, time);
			//this.top.animate({"fill-opacity": .8}, time);
			this.bottom.animate({"fill-opacity": .8}, time);
		}
		else if(direction == 1){
			this.text.animate({x: width/2, y: 20}, time);
		}
		this.body.animate({r: growth}, time);
		//this.top.animate({cy: this.body.attr('cy') - .9*growth, r: growth/10}, time);
		this.bottom.animate({cy: this.body.attr('cy') + .9*growth, r: growth/10}, time);
		
		this.responsive = true;
		if(direction <= 0){
			this.subgraph.hide();
		}	
		if(direction >= 0){
			if(this.owner)
				this.owner.contract(time, amount, direction+1);
		}
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
		var color = Raphael.getColor();
		this.body = r.circle(this.x, this.y, this.radius).attr({fill: color, "fill-opacity": .8, stroke: color});
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

var Graph = function(title){
	this.nodes = new Array();
	this.edges = new Array();
	this.title = title;
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
