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

});
