
module.exports.register = function (Handlebars, x)  {   

  Handlebars.registerHelper('gfm', function (options)  { 
  	var marked = require('./marked-config');
    return new Handlebars.SafeString(
      '<div class="mybold">'
      + marked(options.fn(this))
      + '</div>');
  });
};
