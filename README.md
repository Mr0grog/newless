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

You can also use it with existing constructors from other libraries without
disrupting them:

```js
var Map = newless(google.maps.Map);
var map = Map(document.getElementById("map-canvas"), options);
// or
var User = newless(Backbone.Model.extend({...}));
var user = User({name: "Jennifer"});
```

## License

Newless is open source software. It is (c) 2013 Rob Brackett and licensed under
the BSD license. The full license text is in the `LICENSE` file.