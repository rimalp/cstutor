var client = null;

var Database = function(connection){
	client = connection;
}

Database.prototype = {

	rawQuery: function(querystring){
		var query = client.query(querystring);
		query.on('error'), function(error){
			console.log(error);
			return false;
		});
		query.on('end', function(result){
			return result;
		});
	}

	
};
