
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('graph.html', { title: 'Building First Express App with Node js.' });
};