function addCol(header, array, col){
	var th = document.createElement('th');
	table.rows[0].appendChild(th);
	th.innerHTML = header;
	
	for(var i=0; i<array.length; i++){
		var cell = (i+1 >= table.rows.length) ? getRowsLastCol(table.insertRow(table.rows.length)) : getRowsLastCol(table.rows[i+1]);
		cell.innerHTML = array[i].title;
		cell.onclick = getFunction(i, col, array); 
	}
}

function getRowsLastCol(row){
	var returnVal = false;
	for(var i=row.cells.length; i<table.rows[0].cells.length; i++){
		returnVal = row.insertCell(-1);
	}
	
	return returnVal;
}

function deleteLastCol(){
	for(var i=0; i<table.rows.length; i++) {
		if (table.rows[i].cells.length > 1) {
			table.rows[i].deleteCell(-1);
		}
	}
}

function getFunction(index, col, array){
	return function(){
		while(table.rows[0].cells.length > col+1)
			deleteLastCol();
		addCol(array[index].getLinkType(), array[index].getLink(), col+1);
	};
}
