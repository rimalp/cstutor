
var redraw, g, renderer, addNode;

/* only do all this when document has finished loading (needed for RaphaelJS) */
window.onload = function() {
    
    var width = $(document).width() - 20;
    var height = $(document).height() - 60;
    
    g = new Graph();

    /* layout the graph using the Spring layout implementation */
    //var layouter = new Graph.Layout.Spring(g);
    
    /* draw the graph using the RaphaelJS draw implementation */
    renderer = new Graph.Renderer.Raphael('canvas', g, width, height);
    
    redraw = function() {
        //layouter.layout();
        renderer.draw();
    };
    
    addNode = function(name){
	renderer.graph.addNode(name);
	//layouter.layout();
	renderer.draw();
    }
};

