(function(global) {
  "use strict";

  // Used to track the original wrapped constructor on a newless instance
  var TRUE_CONSTRUCTOR = global.Symbol
    ? Symbol("trueConstructor")
    : "__newlessTrueConstructor__";

  // Test whether a given new syntax is supported
  function isSyntaxSupported(example) {
    try { return !!Function("", "'use strict';" + example); }
    catch (error) { return false; }
  }

  // Polyfills for get/set prototype
  var getPrototype = Object.getPrototypeOf || function getPrototype(object) {
    return object.__proto__ ||
      (object.constructor && object.constructor.prototype) ||
      Object.prototype;
  };

  var setPrototype = Object.setPrototypeOf ||
    function setPrototypeOf(object, newPrototype) {
      object.__proto__ = newPrototype;
    };

  // Polyfill for Reflect.construct
  var construct = global.Reflect && global.Reflect.construct || (function() {
    if (isSyntaxSupported("class Test {}")) {
      // The spread operator is *dramatically faster, so use it if we can:
      // http://jsperf.com/new-via-spread-vs-dynamic-function/4
      var supportsSpread = isSyntaxSupported("Object(...[{}])");

      return Function("constructor, args, target",
        "'use strict';" +
        "target = target || constructor;" +

        // extend target so the right prototype is constructed (or nearly the
        // right one; ideally we'd do instantiator.prototype = target.prototype,
        // but a class's prototype property is not writable)
        "class instantiator extends target {};" +
        // but ensure the *logic* is `constructor` for ES2015-compliant engines
        "Object.setPrototypeOf(instantiator, constructor);" +
        // ...and for Safari 9
        "instantiator.prototype.constructor = constructor;" +

        (supportsSpread ?
          "var value = new instantiator(...([].slice.call(args)));" :

          // otherwise, create a dynamic function in order to use `new`
          // Note using `function.bind` would be simpler, but is much slower:
          // http://jsperf.com/new-operator-with-dynamic-function-vs-bind
          "var argList = '';" +
          "for (var i = 0, len = args.length; i < len; i++) {" +
            "if (i > 0) argList += ',';" +
            "argList += 'args[' + i + ']';" +
          "}" +
          "var constructCall = Function('constructor, args'," +
            "'return new constructor(' + argList + ');'" +
          ");" +
          "var value = constructCall(constructor, args);"
        ) +

        // fix up the prototype so it matches the intended one, not one who's
        // prototype is the intended one :P
        "Object.setPrototypeOf(value, target.prototype);" +
        "return value;"
      );
    }
    else {
      var instantiator = function() {};
      return function construct(constructor, args, target) {
        instantiator.prototype = (target || constructor).prototype;
        var instance = new instantiator();
        var value = constructor.apply(instance, args);
        return (typeof value === "object" && value) || instance;
      }
    }
  })();

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

  var newless = function(constructor) {
    var name = constructor.name || "";

    // create a list of arguments so that the newless constructor's `length`
    // is the same as the original constructor's
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
    var newlessConstructor = Function("constructor, construct, setPrototype",
      "var requiresNew = " + usesClassSyntax + ";" +
      "var newlessConstructor = function " + name +
        "(" + argumentList.join(",") + ") {" +
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
        // make a reasonably good replacement for `new.target` which is a
        // syntax error in older engines
        "var newTarget = (this instanceof newlessConstructor) ? " +
                         "this.constructor : constructor;" +
        "var returnValue = construct(constructor, arguments, newTarget);" +
        // best effort to make things easy for functions inheriting from classes
        "if (this instanceof newlessConstructor) {" +
          "setPrototype(this, returnValue);" +
        "}" +
        "return returnValue;" +
      "};" +
      "return newlessConstructor;")(constructor, construct, setPrototype);

    copyProperties(constructor, newlessConstructor);
    newlessConstructor.prototype = constructor.prototype;
    // NOTE: *usually* the below will already be true, but we ensure it here.
    // Safari 9 requires this for the `super` keyword to work. Newer versions
    // of WebKit and other engines do not. Instead, they use the constructor's
    // prototype chain (which is correct by ES2015 spec) (see below).
    newlessConstructor.prototype.constructor = constructor;

    // for ES2015 classes, we need to make sure the constructor's prototype
    // is the super class's constructor. Further, optimize performance by
    // pointing at the actual constructor implementation instead of the
    // newless wrapper (in the case that it is wrapped by newless).
    newlessConstructor[TRUE_CONSTRUCTOR] = constructor;
    var superConstructor = getPrototype(constructor);
    var realSuperConstructor = superConstructor[TRUE_CONSTRUCTOR];
    setPrototype(newlessConstructor, realSuperConstructor || superConstructor);
    if (realSuperConstructor) {
      setPrototype(constructor, realSuperConstructor);
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
