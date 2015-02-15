var marked = require('./marked-config');
module.exports.register = function (Handlebars, x)  {   

  Handlebars.registerHelper('foo', function (options)  { 
    return new Handlebars.SafeString(
      '<div class="mybold">'
      + marked(options.fn(this))
      + '</div>');
  });

};
