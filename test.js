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
  var ifClassSyntaxIt = it;
  try {
    var ES2015Class = Function("",
      "class ES2015Class {" +
        "constructor() { this.constructed = true; }" +
      "};" +
      "return ES2015Class;")();
  }
  catch(error) {
    console.log("This JS engine does not support class syntax; skipping related tests.");
    var ifClassSyntaxIt = it.skip;
  }
  
  ifClassSyntaxIt("should work with ES2015 class syntax.", function() {
    var NewlessClass = newless(ES2015Class);
    var object = NewlessClass();
    expect(object.constructed).to.be.true
  });
  
  //---- ES 2015 default args and destructuring. ----
  it("Should work with destructuring.", function() {
    var withDestructuredArgs = newless(function({a, b}, [c, d]){});
    var signature = withDestructuredArgs.toString().replace(/\s/g, "").slice(0, 21);
    expect(signature).to.equal("function({a,b},[c,d])");
  });
  
  it("Should work with parentheses in default values.", function() {
    var withFunnyArgs = newless(function(a="hello(name)"){});
    var signature = withFunnyArgs.toString().replace(/\s/g, "").slice(0, 21);
    expect(signature).to.equal("function(a=\"hello(name)\")");
  });
  
  it("Should work with functions in default values.", function() {
    var withFunnyArgs = newless(function(a=function(b){return b;}){});
    var signature = withFunnyArgs.toString().replace(/\s/g, "").slice(0, 33);
    expect(signature).to.equal("function(a=function(b){return b;})");
  });
});
