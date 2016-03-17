/**
 *
 * @param mediator
 * @param promise is the implementation of CommonJS Promises/A and must have interface
 * {
 *  getDefer:function,  // create new defer (like jQuery.Deferred). Defer should implement one method - resolve()
 *  when:function,      // schedule callback on defer resolve (like jQuery.when)
 *  then:function       // schedule callback on next defer (like jQuery.then)
 * }
 *
 * @constructor
 */
YOVALUE.Publisher = function(mediator, promise){
  this._mediator = mediator;
  this._promise = promise;
};

YOVALUE.Publisher.prototype = {
  /**
   *
   * @param name
   * @param data
   * @returns {YOVALUE.Event}
   */
  createEvent: function(name,data){
    return new YOVALUE.Event(name, data, this._promise.getDefer())
  },

  /**
   * Publish one event with name "name" and data "data"
   * @param name
   * @param data
   * @returns {*}
   */
  publish: function(name, data){
    var e = this.createEvent(name, data);
    this.publishEvent(e);
    return e;
  },

  /**
   * Publish several events created by this.createEvent
   * usage:
   * e1 = this.createEvent(name, data);
   * e2 = this.createEvent(name, data);
   * this.publishEvent(e1, e1);
   */
  publishEvent: function(){
    var i;
    for(i in arguments){
      this._mediator.dispatch(arguments[i]);
    }
  },

  /**
   * Get response for instant event (instant event is not defer answer, but returns it immediately)
   * @param name
   * @param data
   */
  getInstant: function(name, data){
    var event = this.createEvent(name, data);
    this._mediator.dispatch(event);
    return event.getResponse();
  },

  /**
   *
   * @param events - can be array [name, data], string 'name' or YOVALUE.Event(name, data)
   */
  when: function(events){
    for(var i in arguments){
      if(YOVALUE.typeof(arguments[i]) == 'array') arguments[i] = this.createEvent(arguments[i][0], arguments[i][1]);
      else if(YOVALUE.typeof(arguments[i]) == 'string') arguments[i] = this.createEvent(arguments[i]);
    }
    var defer = this._promise.when.apply(this._promise, arguments);
    this.publishEvent.apply(this, arguments);
    return defer;
  }
};
