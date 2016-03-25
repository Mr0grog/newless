// if testing via the CLI, use the --require options to grab the helper:
// `mocha --require test_helper_node.js`

describe("Newless functions", function() {
  it("should make a constructor work without `new`", function() {
    var Construct = newless(function() {});
    var obj = Construct();

    expect(obj).to.be.a(Construct);
  });

  it("should still work with `new`", function() {
    var Construct = newless(function() {});
    var obj = new Construct();

    expect(obj).to.be.a(Construct);
  });

  it("should run the constructor's logic", function() {
    var Construct = newless(function() {
      this.called = true;
    });
    var obj = Construct();

    expect(obj.called).to.equal(true);
  });

  it("should pass arguments through", function() {
    var Construct = newless(function(first) {
      this.first = first;
      // even if not in the signature
      this.second = arguments[1];
    });
    var obj = Construct("a", "b");

    expect(obj.first).to.equal("a");
    expect(obj.second).to.equal("b");
  });

  it("should preserve a constructor's prototype", function() {
    var BareConstructor = function() {};
    BareConstructor.prototype = {
      logCalled: function() {
        this.called = true;
      }
    };
    var Construct = newless(BareConstructor);
    var obj = Construct();

    expect(Object.getPrototypeOf(obj)).to.equal(Construct.prototype);
    expect(Object.getPrototypeOf(obj)).to.equal(BareConstructor.prototype);
  });

  it("should preserve a constructor's name", function() {
    var implementation = function Maker() {};
    var Construct = newless(implementation);
    expect(Construct.name).to.equal(implementation.name);
  });

  it("should preserve a constructor's displayName", function() {
    var BareConstructor = function() {};
    BareConstructor.displayName = "Maker Constructor";
    var Construct = newless(BareConstructor);
    expect(Construct.displayName).to.equal("Maker Constructor");
  });

  it("should preserve properties on the constructor.", function() {
    var BareConstructor = function() {};
    BareConstructor.staticFunction = function() {};
    BareConstructor.someProperty = 15;
    var Construct = newless(BareConstructor);

    expect(Construct.staticFunction).to.equal(BareConstructor.staticFunction);
    expect(Construct.someProperty).to.equal(15);
  });

  it("should preserve the constructor's `length` property.", function() {
    var BareConstructor = function(a, b, c) {};
    var Construct = newless(BareConstructor);
    expect(Construct.length).to.equal(BareConstructor.length);
  });

  it("should allow calling “super” constructors via `call/apply`.", function() {
    function create(prototype) {
      function constructor(){};
      constructor.prototype = prototype;
      return new constructor();
    }

    var superInstance, subInstance;
    var SuperConstructor = newless(function() {
      this.setBySuper = true;
      superInstance = this;
    });
    var SubImplementation = function() {
      SuperConstructor.call(this);
      this.setBySub = true;
      subInstance = this;
    };
    SubImplementation.prototype = create(SuperConstructor.prototype);
    var SubConstructor = newless(SubImplementation);

    var obj = SubConstructor();

    expect(obj).to.be.a(SubConstructor);
    expect(obj).to.be.a(SuperConstructor);
    expect(obj).to.have.property("setBySuper", true);
    expect(obj).to.have.property("setBySub", true);
    expect(superInstance).to.equal(subInstance);
  });
});

//---- Load tests for ES 2015 classes only if syntax is supported. ----
var warn = console.warn || console.log;
try {
  var ES2015Class = Function("",
    "\"use strict\";" +
    "class ES2015Class { constructor() {} };")();

  if (typeof document !== "undefined" && document.write) {
    document.write("<sc" + "ript src='test-es2015-class.js'></script>");
  }
  else if (typeof require !== "undefined") {
    require("./test-es2015-class.js");
  }
  else {
    warn("This JS engine supports class syntax, but the appropriate tests could not be loaded.");
  }
}
catch(error) {
  warn("This JS engine does not support class syntax; skipping related tests.");
}
