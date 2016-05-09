# Newless

*Newless* is a super-simple JavaScript library that allows you to modify or
create constructor functions that don't need to be called with `new`. This
makes your code more safe and allows constructors to be used in more functional
contexts (such as `Array.map`).

You can use it on a constructor while creating it:

```js
var MyObject = newless(function(something) {
  this.setSomething(something);
});

MyObject.prototype.setSomething = function(value) {
  this.something = value;
};

var instance = MyObject("Hello");
instance.something; // "Hello"
```

And, of course, on new ES 6/2015 style classes:

```js
var MyObject = newless(class {
  constructor(something) {
    this.setSomething(something);
  }
  setSomething(value) {
    this.something = value;
  }
});

var instance = MyObject("Hello");
instance.something; // "Hello"
```

You can also use it with existing constructors from other libraries without
disrupting them:

```js
var Map = newless(google.maps.Map);
var map = Map(document.getElementById("map-canvas"), options);
// or
var User = newless(Backbone.Model.extend({...}));
var user = User({name: "Jennifer"});
```

## Caveats

*Note: this description is long only because the caveat is uncommon and nuanced. In most cases, it shouldn’t affect you. :)*

When an ES 2015 class is wrapped with Newless, you should be somewhat careful in trying to call it with a custom context via `Class.call(customContext)` or `Class.apply(customContext)`. Because of limitations imposed by the class syntax, calling a Newless ES 2015 class will always return a new object. If the custom context you provide is one that includes the Newless class anywhere in its prototype chain, the returned object will have the exact same prototype chain as the custom context, but it will be separate object.

This is generally only an issue when creating a function constructor that inherits from a class constructor. Inheriting function constructors usually works like this:

```js
function SubConstructor() {
  SuperConstructor.call(this);
  this.x = "some instance value";
}
SubConstructor.prototype = Object.create(SuperConstructor.prototype);
```

This works just fine when `SuperConstructor` is a normal constructor function or a Newless constructor function. If `SuperConstructor` is a class, this doesn’t work at all. However, if `SuperConstructor` is a *Newless* class, the are some minor oddities:

```js
var superInstance;
var SuperConstructor = newless(class {
  constructor() {
    superInstance = this;
    this.y = "super constructor instance property";
  }
});

var instance = new SubConstructor();

// as you’d normally expect, all the properties are accessible:
instance.x === "some instance value";
instance.y === "super constructor instance property";

// ...but technically, the `this` in the two constructors is not the same!
instance !== superInstance;
Object.getPrototypeOf(instance) === superInstance;
```

You’ll notice above that the `this` used in `SuperConstructor` has become the prototype of the `this` used in `SubConstructor`. That’s done to make things work as smoothly as possible within the constraints created by ES 2015’s class syntax. You can avoid this slight oddity by instead coding `SubConstructor` like so:

```js
function SubConstructor() {
  var instance = SuperConstructor.call(this);
  instance.x = "some instance value";
  return instance;
}
SubConstructor.prototype = Object.create(SuperConstructor.prototype);
```

Note that, instead of working with `this`, you work with the return value of calling `SuperConstructor`. If you already code inheritance this way, everything works fine. If you don’t, making this change could help you avoid some rare edge cases where you might run into trouble.

## License

Newless is open source software. It is (c) 2013-2016 Rob Brackett and licensed under
the BSD license. The full license text is in the `LICENSE` file.
