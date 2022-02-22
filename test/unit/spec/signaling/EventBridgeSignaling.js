/* eslint no-unused-expressions: 0 */
import EventBridgeSignaling from '../../../../lib/signaling/EventBridgeSignaling';
import Logger from '../../../../lib/util/Logger';
import Worker from '../../../../lib/Worker';
import { WorkerConfig } from '../../../mock/WorkerConfig';
import { token as initialToken, updatedToken } from '../../../mock/Token';

const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const assert = chai.assert;
const expect = chai.expect;

const sleep = (delay) => {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
};

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

  describe('websocket teardown', () => {
    it('should close the existing websocket when no heartbeat is received in 60s', async() => {
      const worker = new Worker(initialToken, WorkerConfig);

      const disconnectedSpy = sinon.spy();
      const connectedSpy = sinon.spy();

      worker._signaling.on('disconnected', disconnectedSpy);
      worker._signaling.on('connected', connectedSpy);

      // verify that the current websocket is not already closing or closed
      assert.isTrue(worker._signaling.webSocket.readyState !== WebSocket.CLOSED && worker._signaling.webSocket.readyState !== WebSocket.CLOSING);
      // verify that if the websocket disconnects, it will attempt to reconnect
      assert.isTrue(worker._signaling.reconnect);

      // wait for the socket to transition from CONNECTING -> OPEN state
      await sleep(500);
      assert.isTrue(worker._signaling.webSocket.readyState === WebSocket.OPEN);

      // trigger the heartbeat sleep function (no heartbeat felt within max 60s interval)
      worker._signaling._heartbeat.onsleep();

      // verify that websocket moves to closed when the onsleep triggers a disconnect
      assert.isTrue(worker._signaling.webSocket.readyState === WebSocket.CLOSED);
      expect(disconnectedSpy).to.have.been.calledOnce;
      expect(connectedSpy).to.have.been.calledOnce;

      // random backoff will wait x ms before attempting to create a new websocket
      await sleep(1000);
      // verify that a new websocket was created
      assert.isTrue(worker._signaling.webSocket.readyState !== WebSocket.CLOSED && worker._signaling.webSocket.readyState !== WebSocket.CLOSING);
      expect(connectedSpy).to.have.been.calledTwice;
    });

    it('should not be closed by missing heartbeat if closed manually', async() => {
      const worker = new Worker(initialToken, WorkerConfig);
      const websocketCloseSpy = sinon.spy(worker._signaling.webSocket, 'close');

      await sleep(500);
      assert.isTrue(worker._signaling.webSocket.readyState === WebSocket.OPEN);

      // webSocket.close() called after disconnect
      worker._signaling.disconnect();
      expect(websocketCloseSpy).to.have.been.calledOnce;

      // webSocket.close() cannot be called by missing heartbeat anymore
      worker._signaling._heartbeat.onsleep();
      expect(websocketCloseSpy).to.have.been.calledOnce;
    });
  });
});
