
module.exports.register = function (Handlebars, x)  {   

  Handlebars.registerHelper('replace', function (stringToReplace, replacementText, stringToSearch)  { 
    var result = stringToSearch.replace(stringToReplace, replacementText);
    return new Handlebars.SafeString(result);
  });
};
