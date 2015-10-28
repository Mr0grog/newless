// if testing via the CLI, use the --require options to grab the helper:
// `mocha --require test_helper_node.js`

describe("newless", function() {
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
    var Construct = newless(function Maker() {});
    expect(Construct.name).to.equal("Maker");
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

  //---- Tests for ES 2015 classes. Skipped if syntax is not supported. ----
  var classIt = it;
  try {
    var ES2015Class = Function("",
      "\"use strict\";" +
      "class ES2015Class {" +
        "constructor(a, b) { this.constructed = true; this.argA = a; this.argB = b; }" +
        "something() { return true; }" +
      "};" +
      "return ES2015Class;")();
  }
  catch(error) {
    console.log("This JS engine does not support class syntax; skipping related tests.");
    var classIt = it.skip;
  }

  classIt("should work with ES2015 class syntax.", function() {
    var NewlessClass = newless(ES2015Class);
    var object = NewlessClass();
    expect(object.constructed).to.be.true
  });

  classIt("should send correct arguments with ES2015 class syntax.", function() {
    var NewlessClass = newless(ES2015Class);
    var object = NewlessClass(1, 2);
    expect(object.argA).to.equal(1);
    expect(object.argB).to.equal(2);
  });

  classIt("should include all methods with ES2015 class syntax.", function() {
    var NewlessClass = newless(ES2015Class);
    var object = NewlessClass();
    expect(object).to.have.property("something");
    expect(object.something).to.be.a("function");
  });
});
