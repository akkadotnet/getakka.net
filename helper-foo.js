var marked = require('./marked-config');
module.exports.register = function (Handlebars, options)  {   
  Handlebars.registerHelper('foo', function (str)  { 
    return  "TJOOOO!!!!!";
  });
};
