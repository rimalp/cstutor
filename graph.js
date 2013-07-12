var firstNode = false;
var width = 0;
var height = 0;

var focusNode = false;
var currentGraph = false;
var renderer = false;
var centerX = 0;
var centerY = 0;
var uniqueID = 0;

var onload = function(){
	width = document.getElementById("canvas").offsetWidth - 10;
    	height = $(document).height() - 130;
	centerX = width/2;
	centerY = height/2;
	var r = Raphael("canvas", width, height);
	renderer = r;
	
	var g = new Graph();
	currentGraph = g;
};

var addNode = function(name, description){
	var node = new Node(name, description);
	node.setAppearence(centerX, centerY, 40, renderer);
	currentGraph.addNode(node);
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
	this.r = false;
	this.radius = 10;
	this.body = false;
	this.top = false;
	this.bottom = false;
	this.text = false;
	this.connections = new Array();
	
};

Node.prototype = {
	addChild: function(node){
		this.children[this.children.length] = node;
		this.addConnection(node);
	},
	
	//GUI Functions
	
	setAppearence: function(x, y, rad, r){
		this.radius = rad;
		this.r = r;
		var color = Raphael.getColor();
		this.body = r.circle(x, y, rad).attr({fill: color, "fill-opacity": .8, stroke: color});
		this.top = r.circle(x, y - rad*.9, rad*.1).attr({fill: "black", stroke: "black", "fill-opacity": .8});
		this.bottom = r.circle(x, y + rad*.9, rad*.1).attr({fill: "black", stroke: "black", "fill-opacity": .8});
		this.text = r.text(x, y, this.data);
		
		this.body.drag(this.getOnMoveFunction(), this.getOnStartFunction(), this.onEnd);
		this.body.dblclick(this.getToggleFocusFunction());
		this.top.click(this.getTopClickFunction());
		this.bottom.click(this.getBottomClickFunction());
	},
	setPosition: function(x, y){
		var thisX = this.body.attr('cx');
		var thisY = this.body.attr('cy');
		
		this.body.attr({cx: x, cy: y});
		this.top.attr({cx: x, cy: y - this.radius*.9});
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
				selfRef.setPosition(this.originalX + dx, this.originalY + dy);
				selfRef.drawConnections();
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
	onEnd: function(){
		if(this.responsive)
		this.animate({"fill-opacity": .8}, 500);
	},
	addConnection: function(node){
		var connection = this.r.connection(this.bottom, node.top, {directed: true});
		this.connections[this.connections.length] = connection;
		node.connections[node.connections.length] = connection;
		this.graph.connections[this.graph.connections.length] = connection;
	},
	drawConnections: function(){
		for(i in this.connections){
			this.connections[i].draw();
		}
	},
	getTopClickFunction: function(){
		var selfRef = this;
		return function(e){
			if(firstNode && selfRef.responsive){
				firstNode.addChild(selfRef);
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

				selfRef.expand(time, growth, 0);
			}
			else if(focusNode.id == selfRef.id){
				focusNode = selfRef.owner;
				currentGraph = selfRef.graph;
				centerX = selfRef.owner ? selfRef.owner.body.attr('cx') : width/2;
				centerY = selfRef.owner ? selfRef.owner.body.attr('cy') : height/2;

				selfRef.contract(time, growth, 0);
			}
		};
	},
	expand: function(time, amount, direction){
		var i = 0;
		var selfRef = this;
		var interval = setInterval(function(){
			selfRef.graph.drawConnections();
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
				currentNode.top.animate({cx: currentNode.top.attr('cx') + growth*Math.cos(angle), cy: currentNode.top.attr('cy') + growth*Math.sin(angle)}, time);
				currentNode.bottom.animate({cx: currentNode.bottom.attr('cx') + growth*Math.cos(angle), cy: currentNode.bottom.attr('cy') + growth*Math.sin(angle)}, time);
				currentNode.text.animate({x: currentNode.text.attr('x') + growth*Math.cos(angle), y: currentNode.text.attr('y') + growth*Math.sin(angle)}, time);
			}
		}
		if(direction == 0)
			this.text.animate({x: width/2, y: 20}, time);
		else
			this.text.animate({x: width/2, y: -100}, time);
		this.body.animate({r: growth, "fill-opacity": .1}, time);
		this.top.animate({cy: this.body.attr('cy') - .9*growth, r: growth/10, "fill-opacity": .1}, time);
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
			selfRef.graph.drawConnections();
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
				currentNode.top.animate({cx: currentNode.top.attr('cx') - amount*Math.cos(angle), cy: currentNode.top.attr('cy') - amount*Math.sin(angle)}, time);
				currentNode.bottom.animate({cx: currentNode.bottom.attr('cx') - amount*Math.cos(angle), cy: currentNode.bottom.attr('cy') - amount*Math.sin(angle)}, time);
				currentNode.text.animate({x: currentNode.text.attr('x') - amount*Math.cos(angle), y: currentNode.text.attr('y') - amount*Math.sin(angle)}, time);
			}
		}
		if(direction == 0){
			this.text.animate({x: this.body.attr('cx'), y: this.body.attr('cy')}, time);
			
			this.body.animate({"fill-opacity": .8}, time);
			this.top.animate({"fill-opacity": .8}, time);
			this.bottom.animate({"fill-opacity": .8}, time);
		}
		else if(direction == 1){
			this.text.animate({x: width/2, y: 20}, time);
		}
		this.body.animate({r: growth}, time);
		this.top.animate({cy: this.body.attr('cy') - .9*growth, r: growth/10}, time);
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
		this.body.hide();
		this.top.hide();
		this.bottom.hide();
		this.text.hide();
	},
	show: function(){
		this.body.show();
		this.top.show();
		this.bottom.show();
		this.text.show();
	}
	
};

var Graph = function(){
	this.nodes = new Array();
	this.connections = new Array();
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
	hide: function(){
		for(i in this.nodes){
			this.nodes[i].hide();
			for(j in this.nodes[i].connections){
				this.nodes[i].connections[j].fg.hide();
				this.nodes[i].connections[j].bg && this.nodes[i].bg.connection.hide();
			}
		}
	},
	show: function(){
		for(i in this.nodes){
			this.nodes[i].show();
			for(j in this.nodes[i].connections){
				this.nodes[i].connections[j].draw();
				this.nodes[i].connections[j].fg.show();
				this.nodes[i].connections[j].bg && this.nodes[i].bg.connection.show();
			}
		}
	},
	drawConnections: function(){
		for(i in this.connections){
			this.connections[i].draw();
		}
	}
};
