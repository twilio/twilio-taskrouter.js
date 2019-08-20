/* eslint no-unused-expressions: 0 */
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

import Activity from '../../../lib/Activity';
import ActivityDescriptor from '../../../lib/descriptors/ActivityDescriptor';
import { API_V1 } from '../../../lib/util/Constants';
import Configuration from '../../../lib/util/Configuration';
const Errors = require('../../../lib/util/Constants').twilioErrors;
import Logger from '../../../lib/util/Logger';
import { list as mockList } from '../../mock/Activities';
import { updateWorkerAttributes, updateWorkerActivityToIdle, createTask } from '../../mock/Responses';
import Request from '../../../lib/util/Request';
import EventBridgeSignaling from '../../../lib/signaling/EventBridgeSignaling';
import { token as initialToken, updatedToken } from '../../mock/Token';
import Worker from '../../../lib/Worker';
import { WorkerConfig } from '../../mock/WorkerConfig';
import Routes from '../../../lib/util/Routes';

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
      sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(updateWorkerActivityToIdle));

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
});
