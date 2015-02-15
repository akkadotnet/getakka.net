module.exports.register = function (Handlebars, options)  { 
  Handlebars.registerHelper('foo', function (str)  { 
    return  "TJOOOO!!!!!";
  });
};