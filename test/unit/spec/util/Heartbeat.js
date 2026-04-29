const { Heartbeat } = require('../../../../lib/util/Heartbeat');
const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');

describe('Heartbeat', () => {
  describe('constructor', () => {
    it('should create a Heartbeat instance with default values', () => {
      const hb = new Heartbeat();
      assert.equal(hb.interval, 10);
      assert.equal(hb.lastbeat, 0);
      assert.isNull(hb.pintvl);
    });

    it('should accept custom interval', () => {
      const hb = new Heartbeat({ interval: 5 });
      assert.equal(hb.interval, 5);
    });

    it('should accept custom callbacks', () => {
      const onsleep = sinon.spy();
      const onwakeup = sinon.spy();
      const hb = new Heartbeat({ onsleep, onwakeup });
      assert.equal(hb.onsleep, onsleep);
      assert.equal(hb.onwakeup, onwakeup);
    });

    it('should accept custom stop function', () => {
      const customStop = sinon.spy();
      const hb = new Heartbeat({ stop: customStop });
      assert.equal(hb.stop, customStop);
    });
  });

  describe('#toString', () => {
    it('should return class string for static method', () => {
      assert.equal(Heartbeat.toString(), '[Twilio.Heartbeat class]');
    });

    it('should return instance string for instance method', () => {
      const hb = new Heartbeat();
      assert.equal(hb.toString(), '[Twilio.Heartbeat instance]');
    });
  });

  describe('#sleeping', () => {
    it('should return true when not started', () => {
      const hb = new Heartbeat();
      assert.isTrue(hb.sleeping());
    });

    it('should return false after first beat', () => {
      const hb = new Heartbeat();
      hb.beat();
      assert.isFalse(hb.sleeping());
    });
  });

  describe('#beat while sleeping', () => {
    it('should trigger onwakeup callback when beat is called while sleeping', () => {
      const onwakeup = sinon.spy();
      const onsleep = sinon.spy();
      let currentTime = 0;
      const now = () => currentTime;
      const stopSpy = sinon.spy();
      let intervalId = 123;
      const repeat = sinon.stub().returns(intervalId);

      const hb = new Heartbeat({
        interval: 1,
        onwakeup,
        onsleep,
        now,
        repeat,
        stop: stopSpy
      });

      // Heartbeat starts in sleeping state
      assert.isTrue(hb.sleeping());

      // First beat while sleeping - should wake up and set up interval
      currentTime = 1000;
      hb.beat();
      assert.isFalse(hb.sleeping());
      assert.isTrue(onwakeup.calledOnce); // Should be called on first beat from sleeping state
      assert.isTrue(repeat.calledOnce);

      // Simulate going to sleep by calling check after interval
      currentTime = 2500; // 1.5 seconds later (past the 1 second interval)
      hb.check();
      assert.isTrue(hb.sleeping());
      assert.isTrue(onsleep.calledOnce);
      assert.isTrue(stopSpy.calledOnce);

      // Beat while sleeping again - should wake up
      currentTime = 3000;
      hb.beat();
      assert.isFalse(hb.sleeping());
      assert.isTrue(onwakeup.calledTwice); // Called again on second wakeup
      assert.isTrue(repeat.calledTwice); // Called again on wakeup
    });
  });

  describe('#check triggering sleep', () => {
    it('should call onsleep and stop interval when idle time exceeds interval', () => {
      const onsleep = sinon.spy();
      const stopSpy = sinon.spy();
      let currentTime = 0;
      const now = () => currentTime;
      let intervalId = 123;
      const repeat = sinon.stub().returns(intervalId);

      const hb = new Heartbeat({
        interval: 1,
        onsleep,
        now,
        repeat,
        stop: stopSpy
      });

      // Start the heartbeat
      currentTime = 1000;
      hb.beat();
      assert.isFalse(hb.sleeping());
      assert.isTrue(repeat.calledOnce);

      // Check immediately - should not sleep yet
      currentTime = 1500; // Only 0.5 seconds passed
      hb.check();
      assert.isFalse(hb.sleeping());
      assert.isFalse(onsleep.called);

      // Check after interval has passed - should sleep
      currentTime = 2000; // 1 second passed
      hb.check();
      assert.isTrue(hb.sleeping());
      assert.isTrue(onsleep.calledOnce);
      assert.isTrue(stopSpy.calledOnce);
      assert.isTrue(stopSpy.calledWith(intervalId));
    });

    it('should not call onsleep if already sleeping', () => {
      const onsleep = sinon.spy();
      const stopSpy = sinon.spy();
      let currentTime = 0;
      const now = () => currentTime;

      const hb = new Heartbeat({
        interval: 1,
        onsleep,
        now,
        stop: stopSpy
      });

      // Start and let it go to sleep
      currentTime = 1000;
      hb.beat();
      currentTime = 2000;
      hb.check();
      assert.isTrue(hb.sleeping());
      assert.isTrue(onsleep.calledOnce);

      // Check again while sleeping - should not call onsleep again
      currentTime = 3000;
      hb.check();
      assert.isTrue(onsleep.calledOnce); // Still only once
    });
  });

  describe('#beat', () => {
    it('should update lastbeat timestamp', () => {
      let currentTime = 5000;
      const now = () => currentTime;
      const hb = new Heartbeat({ now });

      hb.beat();
      assert.equal(hb.lastbeat, 5000);

      currentTime = 6000;
      hb.beat();
      assert.equal(hb.lastbeat, 6000);
    });

    it('should initialize repeat interval on first beat', () => {
      const repeat = sinon.spy();
      const hb = new Heartbeat({ repeat, interval: 2 });

      hb.beat();
      assert.isTrue(repeat.calledOnce);
      const callback = repeat.firstCall.args[0];
      const interval = repeat.firstCall.args[1];
      assert.isFunction(callback);
      assert.equal(interval, 2000); // 2 seconds * 1000
    });
  });
});
