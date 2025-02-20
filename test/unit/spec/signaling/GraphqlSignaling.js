/* eslint no-unused-expressions: 0 */
import GraphqlSignaling from '../../../../lib/signaling/GraphqlSignaling';
import Logger from '../../../../lib/util/Logger';
import Worker from '../../../../lib/Worker';
import { token as initialToken, updatedToken } from '../../../mock/Token';

const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const assert = chai.assert;
const expect = chai.expect;
const WorkerConfig = {
  useGraphQL: true,
};

const sleep = (delay) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

describe('GraphqlSignaling', () => {
  describe('constructor', () => {
    it('should throw an error if no Worker client is found', () => {
      (() => {
        new GraphqlSignaling();
      }).should.throw(/worker is a required parameter/);
    });

    it('should throw an error if not constructed with a worker', () => {
      (() => {
        new GraphqlSignaling('abc');
      }).should.throw(/worker is a required parameter/);
    });

    it('should throw an error when passing an invalid closeExistingSessions value', () => {
      (() => {
        const worker = new Worker(initialToken, WorkerConfig);
        const options = {
          closeExistingSessions: 'true',
        };
        new GraphqlSignaling(worker, options);
      }).should.throw(/Invalid type passed for <boolean>closeExistingSessions/);
    });

    it('should set the environment and the closeExistingSessions options', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const options = {
        closeExistingSessions: true,
      };

      const signaling = new GraphqlSignaling(worker, options);

      assert.instanceOf(signaling._log, Logger);
      assert.isTrue(signaling.closeExistingSessions);
      assert.equal(signaling._worker, worker);
    });

    it('should set optional closeExistingSessions to false if not provided', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const signaling = new GraphqlSignaling(worker);
      assert.isFalse(signaling.closeExistingSessions);
    });

    it('should set setWorkerOfflineIfDisconnected option', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const options = {
        setWorkerOfflineIfDisconnected: false,
      };

      const signaling = new GraphqlSignaling(worker, options);

      assert.isFalse(signaling.setWorkerOfflineIfDisconnected);
    });
  });

  describe('#updateToken(newToken)', () => {
    it('should throw an error if newToken is missing', () => {
      (() => {
        const worker = new Worker(initialToken, WorkerConfig);
        const signaling = new GraphqlSignaling(worker);
        signaling.updateToken();
      }).should.throw(/To update the Twilio token, a new Twilio token must be passed in/);
    });

    it('should clear the original token timeout and create a new timeout', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const signaling = new GraphqlSignaling(worker);

      signaling.updateToken(updatedToken);
      const firstTimer = signaling.tokenTimer;
      assert.isNotNull(firstTimer);

      signaling.updateToken(updatedToken);
      const secondTimer = signaling.tokenTimer;
      assert.isNotNull(secondTimer);

      assert.notEqual(firstTimer, secondTimer);
    });

    it('should reconnect if connection was closed', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      const signaling = new GraphqlSignaling(worker);
      signaling.webSocket = null;
      let createSpy = sinon.spy(GraphqlSignaling.prototype, 'createWebSocket');
      signaling.updateToken(updatedToken);
      assert.isTrue(signaling.reconnect);
      expect(createSpy).to.have.been.calledOnce;
    });
  });

  describe('websocket teardown', () => {
    it('should close the websocket connection', async() => {
      const worker = new Worker(initialToken, WorkerConfig);
      const websocketCloseSpy = sinon.spy(worker._gqlSignaling.webSocket, 'dispose');

      await sleep(500);
      assert.isDefined(worker._gqlSignaling.webSocket);

      // webSocket.dispose() called after disconnect
      worker._gqlSignaling.disconnect();
      expect(websocketCloseSpy).to.have.been.calledOnce;
    });
  });

  describe('websocket events', () => {
    it('should emit a connected event to the worker', async() => {
      const worker = new Worker(initialToken, WorkerConfig);
      const connectedSpy = sinon.spy(worker._gqlSignaling, 'emit');

      const events = {};
      worker._gqlSignaling.webSocket = {
        on: (event, cb) => {
          events[event] = cb;
        },
      };

      worker._gqlSignaling.registerWebSocketEvents();

      events.connected();
      expect(connectedSpy).to.have.been.calledOnceWith('connected');
    });

    it('should emit a disconnected event to the worker', async() => {
      const worker = new Worker(initialToken, WorkerConfig);
      const connectedSpy = sinon.spy(worker._gqlSignaling, 'emit');

      const events = {};
      worker._gqlSignaling.webSocket = {
        on: (event, cb) => {
          events[event] = cb;
        },
      };

      worker._gqlSignaling.registerWebSocketEvents();

      events.closed();
      expect(connectedSpy).to.have.been.calledOnceWith('disconnected');
    });

    it('should emit a message event to the worker', async() => {
      const worker = new Worker(initialToken, WorkerConfig);
      const connectedSpy = sinon.spy(worker._gqlSignaling, 'emit');

      const events = {};
      worker._gqlSignaling.webSocket = {
        on: (event, cb) => {
          events[event] = cb;
        },
      };

      worker._gqlSignaling.registerWebSocketEvents();

      events.message({
        type: 'message',
        payload: 'payload',
      });
      expect(connectedSpy).to.have.been.calledOnceWith('message', 'payload');
    });
  });
});
