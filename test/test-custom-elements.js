"use strict";

describe("Using Newless with Custom Elements", function() {

  it("should work with ES5-style constructors", function() {

    const HTMLElement = newless(window.HTMLElement);

    function MyEl(...args) {
      const self = HTMLElement.call(this, ...args);
      if ( self.__proto__ !== MyEl.prototype )
        self.__proto__ = MyEl.prototype;
      return self;
    }
    MyEl.prototype = {
      __proto__: HTMLElement.prototype,
      constructor: MyEl,

      connectedCallback() {
        this.connected = true;
      },
    };
    MyEl.__proto__ = HTMLElement;

    customElements.define('my-el', MyEl);
    const el = document.createElement('my-el');

    expect(el).to.be.a(window.HTMLElement);
    expect(el).to.be.a(HTMLElement);
    expect(el).to.be.a(MyEl);

    document.body.appendChild( el );

    expect(el.connected).to.be.true;

    document.body.removeChild( el );
  });

});
