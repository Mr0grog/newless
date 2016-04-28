"use strict";

describe("Newless ES 2015 classes", function() {

  it("should work with ES2015 class syntax", function() {
    class ES2015Class {
      constructor() { this.constructed = true; }
    }

    var NewlessClass = newless(ES2015Class);
    var object = NewlessClass();
    expect(object).to.be.a(NewlessClass);
    expect(object.constructed).to.be.true
  });

  it("should work with the `new keyword` with ES2015 class syntax", function() {
    class ES2015Class {
      constructor() { this.constructed = true; }
    }

    var NewlessClass = newless(ES2015Class);
    var object = new NewlessClass();
    expect(object).to.be.a(NewlessClass);
    expect(object.constructed).to.be.true
  });

  it("should send correct arguments with ES2015 class syntax", function() {
    class ES2015Class {
      constructor(a, b) { this.argA = a; this.argB = b; }
    }

    var NewlessClass = newless(ES2015Class);
    var object = NewlessClass(1, 2);
    expect(object.argA).to.equal(1);
    expect(object.argB).to.equal(2);
  });

  it("should include all methods with ES2015 class syntax", function() {
    class ES2015Class {
      constructor() {}
      something() { return true; }
      static somethingStatic() { return true; }
    }

    var NewlessClass = newless(ES2015Class);
    var object = NewlessClass();
    expect(object).to.have.property("something");
    expect(object.something).to.be.a("function");
    expect(NewlessClass.somethingStatic).to.be.a("function");
  });

  it("should work with inheritance in ES2015 class syntax", function() {
    var instanceBase, instanceSub;

    class BaseClass {
      constructor() {
        instanceBase = this;
        this.baseInstanceProperty = true;
      }
      baseClassMethod() {}
    }

    var SubClass = newless(class SubClass extends BaseClass {
      constructor() {
        super();
        instanceSub = this;
        this.subInstanceProperty = true;
      }
      subClassMethod() {}
    });

    var object = SubClass();
    expect(object).to.be.a(SubClass);
    expect(object).to.be.a(BaseClass);
    expect(object.baseClassMethod).to.be.a("function");
    expect(object.subClassMethod).to.be.a("function");
    expect(object).to.have.property("baseInstanceProperty");
    expect(object).to.have.property("subInstanceProperty");
    // no spurious instances are created.
    expect(instanceSub).to.equal(instanceBase);
  });

  it("should be possible to inherit from a newless class", function() {
    var instanceBase, instanceSub;

    var BaseClass = newless(class BaseClass {
      constructor() {
        instanceBase = this;
        this.baseInstanceProperty = true;
      }
      baseClassMethod() {}
    });

    var SubClass = newless(class SubClass extends BaseClass {
      constructor() {
        super();
        instanceSub = this;
        this.subInstanceProperty = true;
      }
      subClassMethod() {}
    });

    var object = SubClass();
    expect(object).to.be.a(SubClass);
    expect(object).to.be.a(BaseClass);
    expect(object.baseClassMethod).to.be.a("function");
    expect(object.subClassMethod).to.be.a("function");
    expect(object).to.have.property("baseInstanceProperty");
    expect(object).to.have.property("subInstanceProperty");
    // no spurious instances are created.
    expect(instanceSub).to.equal(instanceBase);
  });

  it("should be possible for a non-newless class to inherit from a newless class", function() {
    var instanceBase, instanceSub;

    var BaseClass = newless(class BaseClass {
      constructor() {
        instanceBase = this;
        this.baseInstanceProperty = true;
      }
      baseClassMethod() {}
    });

    class SubClass extends BaseClass {
      constructor() {
        super();
        instanceSub = this;
        this.subInstanceProperty = true;
      }
      subClassMethod() {}
    };

    var object = new SubClass();
    expect(object).to.be.a(SubClass);
    expect(object).to.be.a(BaseClass);
    expect(object.baseClassMethod).to.be.a("function");
    expect(object.subClassMethod).to.be.a("function");
    expect(object).to.have.property("baseInstanceProperty");
    expect(object).to.have.property("subInstanceProperty");
    // no spurious instances are created.
    expect(instanceSub).to.equal(instanceBase);
  });

  it("should update a function's `this` when inheriting from a class constructor", function() {
    // NOTE: this does *not* mean `this` in SubClass === `this` in BaseClass.
    // We *are* trying to come as close to that as we can, though.

    var BaseClass = newless(class {
      constructor() {
        this.baseInstanceProperty = true;
      }
    });

    var SubClass = function() {
      BaseClass.call(this);
    };
    SubClass.prototype = Object.create(BaseClass.prototype);

    expect(new SubClass()).to.have.property("baseInstanceProperty");
  });

});

describe("ES 2015 arguments", function() {
  function source(fn, length) {
    return fn.toString().replace(/\s/g, "").slice(0, length)
  }

  it("should retain argument names with default values", function() {
    var Construct = newless(function(a=5, b=Infinity, c=[]) {});
    var signature = source(Construct, 29);
    expect(signature).to.equal("function(a=5,b=Infinity,c=[])");
  });

  it("Should work with destructuring.", function() {
    var withDestructuredArgs = newless(function({a, b}, [c, d]){});
    var signature = source(withDestructuredArgs, 21);
    expect(signature).to.equal("function({a,b},[c,d])");
  });

  it("Should work with parentheses in default values.", function() {
    var withFunnyArgs = newless(function(a="hello(name)"){});
    var signature = source(withFunnyArgs, 21);
    expect(signature).to.equal("function(a=\"hello(name)\")");

    var withMethodCallArgs = newless(function(value=Math.random()){});
    var signature = source(withMethodCallArgs, 29);
    expect(signature).to.equal("function(value=Math.random())");
  });

  it("Should work with functions in default values.", function() {
    var withFunnyArgs = newless(function(a=function(b){return b;}){});
    var signature = source(withFunnyArgs, 33);
    expect(signature).to.equal("function(a=function(b){return b;})");
  });

  it("Should work with arrow functions in default values.", function() {
    var withFunnyArgs = newless(function(a=(input) => input * 2){});
    var signature = source(withFunnyArgs, 28);
    expect(signature).to.equal("function(a=(input)=>input*2)");

    withFunnyArgs = newless(function(a=(input) => { input * 2; }){});
    signature = source(withFunnyArgs, 31);
    expect(signature).to.equal("function(a=(input)=>{input*2;})");
  });
});
