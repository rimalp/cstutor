
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Building First Express App with Node js.' });
};