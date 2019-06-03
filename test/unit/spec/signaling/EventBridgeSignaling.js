/* eslint no-unused-expressions: 0 */
import EventBridgeSignaling from '../../../../lib/signaling/EventBridgeSignaling';
import Logger from '../../../../lib/util/Logger';
import Worker from '../../../../lib/Worker';
import { WorkerConfig } from '../../../mock/WorkerConfig';
import { token as initialToken, updatedToken } from '../../../mock/Token';

const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const expect = chai.expect;

describe('EventBridgeSignaling', () => {
  describe('constructor', () => {
    it('should throw an error if no Worker client is found', () => {
      (() => {
        new EventBridgeSignaling();
      }).should.throw(/worker is a required parameter/);
    });

    it('should throw an error if not constructed with a worker', () => {
      (() => {
        new EventBridgeSignaling('abc');
      }).should.throw(/worker is a required parameter/);
    });

    it('should set the environment and the closeExistingSessions options', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const options = {
        closeExistingSessions: true
      };

      const signaling = new EventBridgeSignaling(worker, options);

      assert.instanceOf(signaling._log, Logger);
      assert.isTrue(signaling.closeExistingSessions);
      assert.equal(signaling._worker, worker);
    });

    it('should set optional closeExistingSessions to false if not provided', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const signaling = new EventBridgeSignaling(worker);
      assert.isFalse(signaling.closeExistingSessions);
    });
  });

  describe('#updateToken(newToken)', () => {
    it('should throw an error if newToken is missing', () => {
      (() => {
        const worker = new Worker(initialToken, WorkerConfig);
        const signaling = new EventBridgeSignaling(worker);
        signaling.updateToken();
      }).should.throw(/To update the Twilio token, a new Twilio token must be passed in/);
    });

    it('should reconnect if connection was closed', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const signaling = new EventBridgeSignaling(worker);
      signaling.webSocket.readyState = signaling.webSocket.CLOSED;
      let createSpy = sinon.spy(EventBridgeSignaling.prototype, 'createWebSocket');
      signaling.updateToken(updatedToken);
      assert.isTrue(signaling.reconnect);
      expect(createSpy).to.have.been.calledOnce;
    });

    it('should clear the original token timeout and create a new timeout', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const signaling = new EventBridgeSignaling(worker);

      signaling.updateToken(updatedToken);
      const firstTimer = signaling.tokenTimer;
      assert.isNotNull(firstTimer);

      signaling.updateToken(updatedToken);
      const secondTimer = signaling.tokenTimer;
      assert.isNotNull(secondTimer);

      assert.notEqual(firstTimer, secondTimer);
    });
  });
});
