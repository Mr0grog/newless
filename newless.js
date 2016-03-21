(function(global) {
  "use strict";

  // This property newless constructors points to the underlying implementation.
  var TRUE_CONSTRUCTOR = global.Symbol
    ? Symbol("trueConstructor")
    : "__newlessTrueConstructor__";

  var SUPPORTS_CLASS = false;
  try {
    SUPPORTS_CLASS = !!Function("", "'use strict'; class Test {};");
  }
  catch (error) {}

  var MAKE_CLASS =
    "class placeholder extends target {};" +
    "Object.setPrototypeOf(placeholder, constructor);" +
    "placeholder.prototype.constructor = constructor;";
  var MAKE_FUNCTION =
    "function placeholder() {" +
      "var returnValue = constructor.apply(this, arguments);" +
      "return (typeof returnValue == 'object' && returnValue) || this;" +
    "};" +
    "placeholder.prototype = target.prototype;";

  // Create a function that roughly matches Reflect.construct (though we can't
  // mimic the third argument).
  var construct = null;//global.Reflect && global.Reflect.construct;
  if (!construct) {
    // Use the spread operator if supported
    try {
      // construct = Function("constructor, args",
      //   "'use strict'; return new constructor(...([].slice.call(args)));");
      construct = Function("constructor, args, target",
        "'use strict';" +
        "target = target || constructor;" +

        (SUPPORTS_CLASS ? MAKE_CLASS : MAKE_FUNCTION) +

        "var returnValue = new placeholder(...([].slice.call(args)));" +
        "Object.setPrototypeOf(returnValue, target.prototype);" +
        "return returnValue;");
    }
    // ...otherwise we'll get a syntax error; fall back to a dynamic function
    catch(error) {
      construct = function construct(constructor, args, target) {
        var instantiator = "'use strict';" +
          "target = target || constructor;" +
          (SUPPORTS_CLASS ? MAKE_CLASS : MAKE_FUNCTION) +
          "var returnValue = new placeholder(";
        for (var i = 0, len = args.length; i < len; i++) {
          if (i > 0) {
            instantiator += ",";
          }
          instantiator += "args[" + i + "]";
        }
        instantiator += ");";
        instantiator +=
          "if (Object.setPrototypeOf) { Object.setPrototypeOf(returnValue, target.prototype); }" +
          "return returnValue;";
        return Function("constructor, args, target", instantiator)(constructor, args, target);
      };
    }
  }

  // ES2015 class methods are non-enumerable; we need a helper for copying them.
  var SKIP_PROPERTIES = ["arguments", "caller", "length", "name", "prototype"];
  function copyProperties(source, destination) {
    if (Object.getOwnPropertyNames && Object.defineProperty) {
      var properties = Object.getOwnPropertyNames(source);
      if (Object.getOwnPropertySymbols) {
        properties = properties.concat(Object.getOwnPropertySymbols(source));
      }
      for (var i = properties.length - 1; i >= 0; i--) {
        if (SKIP_PROPERTIES.indexOf(properties[i]) === -1) {
          Object.defineProperty(
            destination,
            properties[i],
            Object.getOwnPropertyDescriptor(source, properties[i]));
        }
      }
    }
    else {
      for (var property in source) {
        destination[property] = source[property];
      }
    }
  }

  // If an engine does not yet implement the spread operator, emulate it by
  // constructing a function on the fly.
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

    // V8 and newer versions of JSCore return the full class declaration from
    // `toString()`, which lets us be a little smarter and more performant
    // about what to do, since we know we are dealing with a "class". Note,
    // however, not all engines do this. This could be false and the constructor
    // might still use class syntax.
    var usesClassSyntax = constructor.toString().substr(0, 5) === "class";

    // Create and call a function that returns a wrapped constructor that can
    // be called without new. This is needed in order to give the wrapper some
    // otherwise unalterable properties like name and arguments.
    var newlessConstructor = Function("constructor, construct",
      "var requiresNew = " + usesClassSyntax + ";" +
      "var newlessConstructor = function " + name + "(" + argumentList.join(",") + ") {" +
        // Inheritance with plain functions requires calling the "super"
        // constructor via `superConstructor.call(this, arg1, arg2...)`. In
        // this situation, we want to try and preserve that `this` instead of
        // constructing a new one; checking the above call's return value is
        // not common practice and lot of constructors would break if we
        // returned a different object instance.
        "if (!requiresNew && this instanceof newlessConstructor) {" +
          // Not all engines provide enough clues to set `requiresNew` properly.
          // Even if false, it may still require `new` and throw an error.
          "try {" +
            // run the original constructor
            "var returnValue = constructor.apply(this, arguments);" +
            // if we got back a non-null object, use it as the return value
            "return (typeof returnValue === 'object' && returnValue) || this;" +
          "}" +
          "catch (error) {" +
            // Do our best to only capture errors triggred by class syntax.
            // Unfortunately, there's no special error type for this and the
            // message is non-standard, so this is the best check we can do.
            "if (!(error instanceof TypeError &&" +
              " /class constructor/i.test(error.message))) {" +
              "throw error;" +
            "}" +
            // mark this constructor as requiring `new` for next time
            "requiresNew = true;" +
          "}" +
        "}" +
        "var newTarget = (this instanceof newlessConstructor) ? this.constructor : undefined;" +
        "if (newTarget) {" +
        "return construct(constructor, arguments, newTarget);" +
        "} else {" +
        "return construct(constructor, arguments);" +
        "}" +
      "};" +
      "return newlessConstructor;")(constructor, construct);

    copyProperties(constructor, newlessConstructor);
    newlessConstructor.prototype = constructor.prototype;
    newlessConstructor.prototype.constructor = constructor;
    // newlessConstructor.prototype.constructor = newlessConstructor;
    // NOTE: `newlessConstructor.prototype.constructor` === `constructor`!
    // Safari 9 requires this for the `super` keyword to work. Newer versions
    // of WebKit and other engines do not. Instead, they use the constructor's
    // prototype chain (see below).

    // the underlying constructor implementation needs to be tracked so that
    // prototypes can be set appropriately to support calling super()
    newlessConstructor[TRUE_CONSTRUCTOR] = constructor;

    // The `super` keyword works by examining the constructor's prototype chain.
    // Because there is no way for newless to apply the logic of a super
    // constructor created via class syntax from the outside (because the `new`
    // keyword *must* be used), the newless constructor's prototype must not
    // point to a newless-wrapped constructor, but to the underlying
    // constructor itself.
    // NOTE: this can be better handled with Reflect.construct, but that's not
    // supported everywhere classes are so it can't be depended upon.
    if (Object.getPrototypeOf && Object.setPrototypeOf) {
      var superConstructor = Object.getPrototypeOf(constructor);
      Object.setPrototypeOf(newlessConstructor, superConstructor);
      if (superConstructor[TRUE_CONSTRUCTOR]) {
        Object.setPrototypeOf(
          constructor, superConstructor[TRUE_CONSTRUCTOR]);
        Object.setPrototypeOf(newlessConstructor, superConstructor[TRUE_CONSTRUCTOR]);
      }
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
