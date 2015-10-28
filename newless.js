(function(global) {
  "use strict";

  var supportsSpread = false;
  try {
    supportsSpread = !!Function(
      "constructor, args",
      "'use strict'; return new constructor(...args);"
    );
  }
  catch (error) {}

  // ulta-simple Object.create polyfill (only does half the job)
  var create = Object.create || (function() {
    var Maker = function(){};
    return function(prototype) {
      Maker.prototype = prototype;
      return new Maker();
    }
  }());

  // If an engine does not yet implement the spread operator, emulate it by
  // constructing a function on the fly. That's pretty bad for performance, but
  // I don't see a better way here.
  function newWithArguments(constructor, args) {
    var instantiator = "'use strict'; return new constructor(";
    for (var i = 0, len = args.length; i < len; i++) {
      if (i > 0) {
        instantiator += ",";
      }
      instantiator += "args[" + i + "]";
    }
    instantiator += ");";
    return Function("constructor, args", instantiator)(constructor, args);
  }

  var newless = function(constructor) {
    // in order to preserve constructor name, use the Function constructor
    var name = constructor.name || "";

    // create a list of arguments so that original constructor's `length` property is kept
    var argumentList = [];
    for (var i = constructor.length; i > 0; i--) {
      argumentList.unshift("a" + i);
    }

    var newlessConstructor = Function("constructor, create, newWithArguments",
      "var newlessConstructor = function " + name + "(" + argumentList.join(",") + ") {" +
        // ES2015 classes can't have their constructors called with `apply`, so
        // we *must* use the `new` keyword. The only way to do this is either
        // with the spread operator or with some really slow and funky code to
        // emulate it. Unfortunately, some shipping engines implement classes
        // but not spread, so try and limit our use of really slow emulation by
        // only running it on things that appear to be classes.
        // NOTE: the only known implementations (V8 in NodeJS 4) that
        // support the class syntax but not spread happen to return the full
        // class declaration in `Class.toString()`, luckily allowing us to
        // differentiate. This isn't universal or by spec, though.
        (supportsSpread
          // NOTE: the arguments object can't be used w/ spread in Firefox
          ? "return new constructor(...([].slice.call(arguments)));"
          : (constructor.toString().indexOf("class") === 0
            ? "return newWithArguments(constructor, arguments);"
            : ("var obj = this;" +
              // don't create a new object if we've already got one
              // (e.g. we were called with `new`)
              "if (!(this instanceof newlessConstructor)) {" +
                "obj = create(newlessConstructor.prototype);" +
              "}" +
              // run the original constructor
              "var returnValue = constructor.apply(obj, arguments);" +
              // if we got back an object (and not null), use it as the return value
              "return (typeof returnValue === 'object' && returnValue) || obj;")
            )
          ) +
      "};" +
      "return newlessConstructor;")(constructor, create, newWithArguments);
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
