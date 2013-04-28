(function(global) {
  "use strict";

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
    var newlessConstructor = Function("constructor, create",
      "var newlessConstructor = function " + name + "() {" +
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
    newlessConstructor.displayName = constructor.displayName;
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
