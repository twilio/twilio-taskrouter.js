/* eslint no-unused-expressions: 0 */
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

import Activity from '../../../lib/Activity';
import ActivityDescriptor from '../../../lib/descriptors/ActivityDescriptor';
import { API_V1, API_V2 } from '../../../lib/util/Constants';
import Configuration from '../../../lib/util/Configuration';
const Errors = require('../../../lib/util/Constants').twilioErrors;
import Logger from '../../../lib/util/Logger';
import { list as mockList } from '../../mock/Activities';
import { pageSize1000 } from '../../mock/Channels';
import { reservations } from '../../mock/Reservations';
import { updateWorkerAttributes, updateWorkerActivityToIdle, createTask, initWorkerAttributes } from '../../mock/Responses';
import Request from '../../../lib/util/Request';
import EventBridgeSignaling from '../../../lib/signaling/EventBridgeSignaling';
import { token as initialToken, updatedToken } from '../../mock/Token';
import Worker from '../../../lib/Worker';
import { WorkerConfig } from '../../mock/WorkerConfig';
import Routes from '../../../lib/util/Routes';
import { events as mockEvents } from '../../mock/Events';

describe('Worker', () => {
  const routes = new Routes('WSxxx', 'WKxxx');

  describe('constructor', () => {
    it('should throw an error if the token is missing', () => {
      (() => {
        new Worker();
      }).should.throw(/token is a required parameter/);
    });

    it('should create a Worker Configuration with the token and any options', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      assert.isNotNull(worker._config);
      assert.instanceOf(worker._config, Configuration);
    });

    it('should create a signaling instance', () => {
      const worker = new Worker(initialToken, WorkerConfig);

      assert.isNotNull(worker._signaling);
      assert.instanceOf(worker._signaling, EventBridgeSignaling);
    });

    it('should create an instance of Logger at the optional logLevel', () => {
      let config = WorkerConfig;
      config.logLevel = 'trace';
      const worker = new Worker(initialToken, config);
      assert.instanceOf(worker._log, Logger);
      assert.equal(worker._log.getLevel(), 'trace');
    });
  });

  describe('#setAttributes(attributes)', () => {
    let worker;
    let sandbox;
    let setAttributesSpy;

    const requestURL = 'Workspaces/WSxxx/Workers/WKxxx';
    const requestParams = {
      Attributes: {
        languages: ['en']
      }
    };

    beforeEach(() => {
      worker = new Worker(initialToken, WorkerConfig);
      worker.version = 1;
      sinon.stub(worker, 'getRoutes').returns(routes);

      setAttributesSpy = sinon.spy(worker, 'setAttributes');
      sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
      setAttributesSpy.resetHistory();
      sandbox.restore();
    });

    it('should throw an error if parameter attributes is missing', () => {
      (() => {
        worker.setAttributes();
      }).should.throw(/attributes is a required parameter/);
    });

    it('should not update the attributes, if none provided', () => {
      const attributes = '{"languages":["es"]}';
      worker.attributes = attributes;
      (() => {
        worker.setAttributes();
      }).should.throw(/attributes is a required parameter/);
      assert.equal(attributes, worker.attributes);
    });

    it('should set the attributes of the Worker', () => {
      const s = sandbox.stub(Request.prototype, 'post');
      s.withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(updateWorkerAttributes));

      // set initial attributes
      worker.attributes = '{"languages":["es"]}';
      return worker.setAttributes({ languages: ['en'] }).then(updatedWorker => {
        expect(worker).to.equal(updatedWorker);
        expect(worker.attributes).to.deep.equal(JSON.parse(updateWorkerAttributes.attributes));
        expect(worker.dateUpdated).to.deep.equal(new Date(updateWorkerAttributes.date_updated * 1000));
        expect(worker.dateStatusChanged).to.deep.equal(new Date(updateWorkerAttributes.date_status_changed * 1000));

        expect(setAttributesSpy).to.have.been.calledOnce;
        expect(setAttributesSpy.withArgs({ 'languages': ['en'] }).calledOnce).to.be.true;
        expect(s).to.have.been.calledOnce;
        expect(s.withArgs(requestURL, requestParams).calledOnce).to.be.true;
      });
    });

    it('should return an error if attributes update failed', () => {
      sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      return worker.setAttributes({ languages: ['en'] }).catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });

    });

    it('should not update any unrelated Worker properties', () => {
      const unUpdatedWorker = worker;
      const s = sandbox.stub(Request.prototype, 'post');
      s.withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(updateWorkerAttributes));

      // set initial attributes
      worker.attributes = '{"languages":["es"]}';

      return worker.setAttributes({ languages: ['en'] }).then((updatedWorker) => {
        expect(worker).to.equal(updatedWorker);
        expect(worker.attributes).to.deep.equal(JSON.parse(updateWorkerAttributes.attributes));

        expect(unUpdatedWorker.accountSid).to.equal(worker.accountSid);
        expect(unUpdatedWorker.activities).to.equal(worker.activities);
        expect(unUpdatedWorker.activity).to.equal(worker.activity);
        expect(unUpdatedWorker.channels).to.equal(worker.channels);
        expect(unUpdatedWorker.connectActivitySid).to.equal(worker.connectActivitySid);
        expect(unUpdatedWorker.dateCreated).to.equal(worker.dateCreated);
        expect(unUpdatedWorker.dateStatusChanged).to.equal(worker.dateStatusChanged);
        expect(unUpdatedWorker.dateUpdated).to.equal(worker.dateUpdated);
        expect(unUpdatedWorker.disconnectActivitySid).to.equal(worker.disconnectActivitySid);
        expect(unUpdatedWorker.name).to.equal(worker.name);
        expect(unUpdatedWorker.reservations).to.deep.equal(worker.reservations);
        expect(unUpdatedWorker.sid).to.equal(worker.sid);
        expect(unUpdatedWorker.workspaceSid).to.equal(worker.workspaceSid);

        expect(setAttributesSpy).to.have.been.calledOnce;
        expect(setAttributesSpy.withArgs({ 'languages': ['en'] }).calledOnce).to.be.true;
        expect(s).to.have.been.calledOnce;
        expect(s.withArgs(requestURL, requestParams).calledOnce).to.be.true;
      });
    });

    it('should pass the object version to API request', () => {
      const version = worker.version;
      const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
      stub.returns(Promise.resolve(updateWorkerAttributes));

      worker.attributes = '{"languages":["es"]}';

      return worker.setAttributes({ languages: ['en'] }).then(() => {
        expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, version);
      });
    });
  });

  describe('#createTask(to, from, workflowSid, taskQueueSid, options={})', () => {
    let worker;
    let sandbox;

    const requestURL = 'Workspaces/WSxxx/Tasks';
    const requestParams = {
      WorkflowSid: 'WWxxx',
      TaskQueueSid: 'WQxxx',
      RoutingTarget: 'WKxxx',
      Attributes: {
        // eslint-disable-next-line camelcase
        outbound_to: 'customer',
        from: 'worker'
      }
    };

    beforeEach(() => {
      worker = new Worker(initialToken, WorkerConfig);
      worker.sid = 'WKxxx';
      sinon.stub(worker, 'getRoutes').returns(routes);
      sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should throw an error required parameters are missing', () => {
      (() => {
        worker.createTask();
      }).should.throw(/<string>to is a required parameter/);

      (() => {
        worker.createTask('abc');
      }).should.throw(/<string>from is a required parameter/);

      (() => {
        worker.createTask('abc', 'def');
      }).should.throw(/<string>workflowSid is a required parameter/);

      (() => {
        worker.createTask('abc', 'def', 'ghi');
      }).should.throw(/<string>taskQueueSid is a required parameter/);
    });

    it('should create a task request with a routing target of workersid', () => {
      sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(createTask));

      return worker.createTask('customer', 'worker', 'WWxxx', 'WQxxx').then(taskSid => {
        expect(taskSid).to.equal(createTask.sid);
      });
    });

    it('should return an Error if the create task failed', () => {
      const error = Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.');
      sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(error));
      return worker.createTask('customer', 'worker', 'WWxxx', 'WQxxx').should.be.rejectedWith(error);
    });

    it('should overwrite custom attributes if they conflict with required attributes', () => {
      const stub = sandbox.stub(Request.prototype, 'post');
      stub.withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(createTask));

      // eslint-disable-next-line camelcase
      return worker.createTask('customer', 'worker', 'WWxxx', 'WQxxx', { attributes: { from: 'abc', outbound_to: '+123' } }).then(taskSid => {
        expect(taskSid).to.equal(createTask.sid);
        sinon.assert.calledWith(stub, requestURL, requestParams, API_V1);
      });
    });

    it('should set attributes in addition to the required attributes', () => {
      const stub = sandbox.stub(Request.prototype, 'post');
      const customRequestParams = Object.assign({}, requestParams, {
        Attributes: {
          // eslint-disable-next-line camelcase
          outbound_to: 'customer',
          from: 'worker',
          language: 'en',
          nested: {
            nested2: 'answer'
          }
        }
      });

      stub.withArgs(requestURL, customRequestParams, API_V1).returns(Promise.resolve(createTask));
      return worker.createTask('customer', 'worker', 'WWxxx', 'WQxxx', { attributes: { from: 'abc', language: 'en', nested: { nested2: 'answer' } } }).then(taskSid => {
        expect(taskSid).to.equal(createTask.sid);
        sinon.assert.calledWith(stub, requestURL, customRequestParams, API_V1);
      });
    });

    it('should set required attributes even when custom attributes not passed', () => {
      const stub = sandbox.stub(Request.prototype, 'post');
      stub.withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(createTask));

      return worker.createTask('customer', 'worker', 'WWxxx', 'WQxxx').then(taskSid => {
        expect(taskSid).to.equal(createTask.sid);
        sinon.assert.calledWith(stub, requestURL, requestParams, API_V1);
      });
    });
  });

  describe('#updateToken(newToken)', () => {
    let signalingSpy;
    let configSpy;

    beforeEach(() => {
      signalingSpy = sinon.spy(EventBridgeSignaling.prototype, 'updateToken');
      configSpy = sinon.spy(Configuration.prototype, 'updateToken');
    });

    afterEach(() => {
      signalingSpy.restore();
      configSpy.restore();
    });

    it('should throw an error if newToken not provided', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      (() => {
        worker.updateToken();
      }).should.throw(/newToken is a required parameter/);
    });

    it('should update the token if provided', () => {
      const worker = new Worker(initialToken, WorkerConfig);
      assert.equal(worker._config.token, initialToken);

      const spy = sinon.spy();
      worker.on('tokenUpdated', spy);

      worker.updateToken(updatedToken);

      assert.equal(spy.callCount, 1);

      expect(signalingSpy).to.have.been.calledOnce;
      assert.isTrue(signalingSpy.withArgs(updatedToken).calledOnce);

      expect(configSpy).to.have.been.calledOnce;
      assert.isTrue(configSpy.withArgs(updatedToken).calledOnce);

    });
  });

  describe('#_updateWorkerActivity(activitySid)', () => {
    let worker;
    let sandbox;
    let _updateWorkerActivitySpy;

    const requestURL = 'Workspaces/WSxxx/Workers/WKxxx';
    const requestParams = { ActivitySid: 'WAxx2' };

    beforeEach(() => {
      worker = new Worker(initialToken, WorkerConfig);
      worker.version = 1;
      sinon.stub(worker, 'getRoutes').returns(routes);

      const activities = new Map();
      mockList.contents.forEach((activityPayload) => {
        const activityDescriptor = new ActivityDescriptor(activityPayload);
        activities.set(activityPayload.sid, new Activity(worker, activityDescriptor, activityPayload.sid));
      });

      sinon.stub(worker, 'activities').get(() => activities);

      _updateWorkerActivitySpy = sinon.spy(worker, '_updateWorkerActivity');
      sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
      _updateWorkerActivitySpy.resetHistory();
      sandbox.restore();
    });

    it('should throw an error if parameter attributes is missing', () => {
      (() => {
        worker._updateWorkerActivity();
      }).should.throw(/activitySid is a required parameter/);
    });

    it('should update the activity of the Worker', () => {
      const version = worker.version;
      const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
      stub.returns(Promise.resolve(updateWorkerActivityToIdle));

      worker.activities.forEach((activity) => {
        if (activity.name === 'Offline') {
          activity._isCurrent = true;
          worker.activity = activity;
          assert.equal(worker.activity, activity);
          assert.isTrue(worker.activity.isCurrent);
        } else {
          assert.isFalse(activity.isCurrent);
          assert.notEqual(worker.activity, activity);
        }
      });

      // update Worker activity from Offline to Idle
      return worker._updateWorkerActivity('WAxx2').then(updatedWorker => {
        expect(worker).to.equal(updatedWorker);
        expect(worker.activity.sid).to.equal('WAxx2');
        expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, version);

        worker.activities.forEach(activity => {
          if (activity.name === 'Idle') {
            expect(activity.isCurrent).to.be.true;
            expect(worker.activity).to.equal(activity);
          } else {
            expect(activity.isCurrent).to.be.false;
            expect(worker.activity).to.not.equal(activity);
          }
        });
      });
    });

    it('should return an Error if the update failed', () => {
      sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      return worker._updateWorkerActivity('WAxx2').catch(err => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });
  });

  describe('#TaskrouterListenerSubscriptions', () => {

    let sandbox;
    let requestStub;
    const requestURL = 'Workspaces/WSxxx/Workers/WKxxx';
    const activitiesURL = 'Workspaces/WSxxx/Activities';
    const channelsURL = 'Workspaces/WSxxx/Workers/WKxxx/WorkerChannels';
    const reservationsURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations';
    const requestParams = {
      PageSize: 1000
    };
    const reservationParam = {
      Active: 'true',
      PageSize: 1000
    };

    // 5 listeners for signaling layer additional 22 for taskrouter events
    const expectedTRListenerCount = 22;
    const expectedSignalingListenerCnt = 5;
    const expectedMaxListenerForEvent = 1;

    beforeEach(done => {
      sandbox = sinon.sandbox.create();
      requestStub = sandbox.stub(Request.prototype, 'get');
      requestStub
          .withArgs(requestURL, API_V1).returns(Promise.resolve(initWorkerAttributes))
          .withArgs(activitiesURL, API_V1, requestParams).returns(Promise.resolve(mockList))
          .withArgs(channelsURL, API_V1, requestParams).returns(Promise.resolve(pageSize1000))
          .withArgs(reservationsURL, API_V2, reservationParam).returns(Promise.resolve(reservations));
      done();
    });

    afterEach(done => {
      sandbox.restore();
      done();
    });

    it('should subscribe to taskrouter events once on websocket connect', done => {
      let worker = new Worker(initialToken, WorkerConfig);
      sinon.stub(worker, 'getRoutes').returns(routes);

      let workerSubscribeSpy = sinon.spy(worker, '_subscribeToTaskRouterEvents');

      worker.on('ready', () => {
        expect(workerSubscribeSpy.calledOnce).to.be.true;
        expect(worker._signaling.eventNames().length).to.equal(
            expectedTRListenerCount + expectedSignalingListenerCnt
        );
        worker._signaling.eventNames().forEach(eventName => {
          expect(worker._signaling.listenerCount(eventName), expectedMaxListenerForEvent);
        });
        done();
      });

      // emit the init event which triggers worker.ready after successful initialization
      worker._signaling.emit('init', mockEvents.signaling.initWorkerEvent);
    }).timeout(5000);

    it('should receive a disconnected event message', done => {
      const worker = new Worker(initialToken, WorkerConfig);
      sinon.stub(worker, 'getRoutes').returns(routes);

      const workerUnsubscribeSpy = sinon.spy(worker, '_unSubscribeFromTaskRouterEvents');

      worker.on('disconnected', event => {
        expect(workerUnsubscribeSpy.calledOnce).to.be.true;
        expect(event).to.equal('worker got disconnected message');
        done();
      });
      worker._signaling.emit('disconnected', 'worker got disconnected message');

    }).timeout(5000);

    it('should unsubscribe from taskrouter events once on disconnect', done => {
      let worker = new Worker(initialToken, WorkerConfig);
      sinon.stub(worker, 'getRoutes').returns(routes);

      let workerUnsubscribeSpy = sinon.spy(worker, '_unSubscribeFromTaskRouterEvents');

      worker.on('disconnected', () => {
        expect(workerUnsubscribeSpy.calledOnce).to.be.true;
        // Worker should have unsubed from all taskrouter events events except the signaling events
        expect(worker._signaling.eventNames().length).to.equal(expectedSignalingListenerCnt);
        done();
      });

      // emit disconnected event
      worker._signaling.emit('disconnected');
    }).timeout(5000);

    it('should have no duplicate taskrouter listeners', done => {
      let worker = new Worker(initialToken, WorkerConfig);
      sinon.stub(worker, 'getRoutes').returns(routes);

      worker.on('ready', () => {
        expect(worker._signaling.eventNames().length).to.equal(
            expectedTRListenerCount + expectedSignalingListenerCnt
        );
        // validate we don't end up with duplicate listeners
        worker._signaling.eventNames().forEach(eventName => {
          expect(worker._signaling.listenerCount(eventName)).to.equal(expectedMaxListenerForEvent);
        });
        done();
      });

      worker.on('disconnected', () => {
        worker._signaling.emit('connected');
        worker._signaling.emit('init', mockEvents.signaling.initWorkerEvent);
      });

      // subscribe to taskrouter events without initialize (worker should not end up with duplicate listeners after
      // disconnect)
      worker._subscribeToTaskRouterEvents();
      // validate the method subscribes to all taskrouter listeners
      expect(worker._signaling.eventNames().length).to.equal(
          expectedTRListenerCount + expectedSignalingListenerCnt
      );
      // simulate disconnected--> connected-->init
      worker._signaling.emit('disconnected');
    }).timeout(5000);


  });

});
