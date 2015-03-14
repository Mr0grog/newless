(function(global) {
  "use strict";
  
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  var CAPTURE_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

  // ulta-simple Object.create polyfill (only does half the job)
  var create = Object.create || (function() {
    var Maker = function(){};
    return function(prototype) {
      Maker.prototype = prototype;
      return new Maker();
    }
  }());

  var newless = function(constructor) {
    // in order to preserve constructor name, use the Function constructor
    var name = constructor.name || "";
    
    // extract the original constructor's arguments
    var argumentList = Function.prototype.toString.call(constructor)
      .replace(STRIP_COMMENTS, '').match(CAPTURE_ARGS)[1];
    
    var newlessConstructor = Function("constructor, create",
      "var newlessConstructor = function " + name + "(" + argumentList + ") {" +
        "var obj = this;" +
        // don't create a new object if we've already got one
        // (e.g. we were called with `new`)
        "if (!(this instanceof newlessConstructor)) {" +
          "obj = create(newlessConstructor.prototype);" +
        "}" +
        // run the original constructor
        "var returnValue = constructor.apply(obj, arguments);" +
        // if we got back an object (and not null), use it as the return value
        "return (typeof returnValue === 'object' && returnValue) || obj;" +
      "};" +
      "return newlessConstructor;")(constructor, create);
    newlessConstructor.prototype = constructor.prototype;
    newlessConstructor.prototype.constructor = newlessConstructor;
    for (var property in constructor) {
      newlessConstructor[property] = constructor[property];
    }
    return newlessConstructor;
  };

  // support Node and browser
  if (typeof module !== "undefined") {
    module.exports = newless;
  }
  else {
    global.newless = newless;
  }

}(this));
