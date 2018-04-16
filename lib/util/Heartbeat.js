

/**
 * Heartbeat just wants you to call <code>beat()</code> every once in a while.
 *
 * <p>It initializes a countdown timer that expects a call to
 * <code>Hearbeat#beat</code> every n seconds. If <code>beat()</code> hasn't
 * been called for <code>#interval</code> seconds, it emits a
 * <code>onsleep</code> event and waits. The next call to <code>beat()</code>
 * emits <code>onwakeup</code> and initializes a new timer.</p>
 *
 * <p>For example:</p>
 *
 * @example
 *
 *     >>> hb = new Heartbeat({
 *     ...   interval: 10,
 *     ...   onsleep: function() { console.log('Gone to sleep...Zzz...'); },
 *     ...   onwakeup: function() { console.log('Awake already!'); },
 *     ... });
 *
 *     >>> hb.beat(); # then wait 10 seconds
 *     Gone to sleep...Zzz...
 *     >>> hb.beat();
 *     Awake already!
 *
 * @exports Heartbeat as Twilio.Heartbeat
 * @memberOf Twilio
 * @constructor
 * @param {object} opts Options for Heartbeat
 * @config {int} [interval=10] Seconds between each call to <code>beat</code>
 * @config {function} [onsleep] Callback for sleep events
 * @config {function} [onwakeup] Callback for wakeup events
 */
function Heartbeat(opts) {
  if (!(this instanceof Heartbeat)) return new Heartbeat(opts);
  opts = opts || {};
  /** @ignore */
  const noop = function() {};  // eslint-disable-line
  const defaults = {
    interval: 10,
    now: function() { return new Date().getTime(); },
    repeat: function(f, t) { return setInterval(f, t); },
    stop: function(f, t) { return clearInterval(f, t); },
    onsleep: noop,
    onwakeup: noop
  };
  for (let prop in defaults) {
    if (prop in opts) continue;
    opts[prop] = defaults[prop];
  }
  /**
   * Number of seconds with no beat before sleeping.
   * @type number
   */
  this.interval = opts.interval;
  this.lastbeat = 0;
  this.pintvl = null;

  /**
   * Invoked when this object has not received a call to <code>#beat</code>
   * for an elapsed period of time greater than <code>#interval</code>
   * seconds.
   *
   * @event
   */
  this.onsleep = opts.onsleep;

  /**
   * Invoked when this object is sleeping and receives a call to
   * <code>#beat</code>.
   *
   * @event
   */
  this.onwakeup = opts.onwakeup;

  this.repeat = opts.repeat;
  this.stop = opts.stop;
  this.now = opts.now;
}

/**
 * @return {string}
 */
Heartbeat.toString = function() {
  return '[Twilio.Heartbeat class]';
};

/**
 * @return {string}
 */
Heartbeat.prototype.toString = function() {
  return '[Twilio.Heartbeat instance]';
};
/**
 * Keeps the instance awake (by resetting the count down); or if asleep,
 * wakes it up.
 */
Heartbeat.prototype.beat = function() {
  this.lastbeat = this.now();
  if (this.sleeping()) {
    if (this.onwakeup) {
      this.onwakeup();
    }
    var self = this;
    this.pintvl = this.repeat.call(
      null,
      function() { self.check(); },
      this.interval * 1000
    );
  }
};
/**
 * Goes into a sleep state if the time between now and the last heartbeat
 * is greater than or equal to the specified <code>interval</code>.
 */
Heartbeat.prototype.check = function() {
  const timeidle = this.now() - this.lastbeat;
  if (!this.sleeping() && timeidle >= this.interval * 1000) {
    if (this.onsleep) {
      this.onsleep();
    }
    this.stop.call(null, this.pintvl);

    this.pintvl = null;
  }
};
/**
 * @return {boolean} True if sleeping
 */
Heartbeat.prototype.sleeping = function() {
  return this.pintvl === null;
};

exports.Heartbeat = Heartbeat;
