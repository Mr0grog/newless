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
});
