var express = require('express');
var app = express();

app.get('/', function(req, res){
  res.send('<html><body><button>Hello World</button></body></html>');
});

app.listen(3000);
