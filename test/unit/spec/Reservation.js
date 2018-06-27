import _ from 'lodash';
import { API_V1 } from '../../../lib/util/Constants';
import Configuration from '../../../lib/util/Configuration';
import Logger from '../../../lib/util/Logger';
const mockEvents = require('../../mock/Events').events;
import { pendingReservationInstance, assignedReservationInstance } from '../../mock/Reservations';
import { reservationAccepted, reservationCalled, reservationDequeued, reservationRedirected, reservationRejected, reservationConferenced } from '../../mock/Responses';
import Reservation from '../../../lib/Reservation';
import ReservationDescriptor from '../../../lib/descriptors/ReservationDescriptor';
import Request from '../../../lib/util/Request';
import Worker from '../../../lib/Worker';
import { token } from '../../mock/Token';
const Errors = require('../../../lib/util/Constants').twilioErrors;

import Routes from '../../../lib/util/Routes';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');

const twimlCallUrl = 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeefff';

import { WorkerConfig } from '../../mock/WorkerConfig';

describe('Reservation', () => {
    const config = new Configuration(token);
    const routes = new Routes('WSxxx', 'WKxxx');
    const worker = new Worker(token, WorkerConfig);
    sinon.stub(worker, 'getRoutes').returns(routes);

    const pendingReservationDescriptor = new ReservationDescriptor(pendingReservationInstance, worker);
    const assignedReservationDescriptor = new ReservationDescriptor(assignedReservationInstance, worker);

    describe('constructor', () => {
        it('should throw an error if worker is missing', () => {
            (() => {
                new Reservation();
            }).should.throw(/worker is a required parameter/);
        });

        it('should throw an error if reservation descriptor is missing', () => {
            (() => {
                new Reservation(worker);
            }).should.throw(/descriptor is a required parameter/);
        });

        it('should set the properties of the Reservation on an API GET', () => {
            const res = new Reservation(worker, new Request(config), assignedReservationDescriptor);

            assert.equal(res.accountSid, assignedReservationInstance.account_sid);
            assert.equal(res.workspaceSid, assignedReservationInstance.workspace_sid);
            assert.equal(res.sid, assignedReservationInstance.sid);
            assert.equal(res.workerSid, assignedReservationInstance.worker_sid);
            assert.equal(res.status, assignedReservationInstance.reservation_status);
            assert.equal(res.timeout, assignedReservationInstance.reservation_timeout);
            assert.deepEqual(res.dateCreated, new Date(assignedReservationInstance.date_created * 1000));
            assert.deepEqual(res.dateUpdated, new Date(assignedReservationInstance.date_updated * 1000));
            assert.isTrue(typeof res.taskDescriptor === 'undefined');

            assert.deepEqual(res.task.addOns, JSON.parse(assignedReservationInstance.task.addons));
            assert.equal(res.task.age, assignedReservationInstance.task.age);
            assert.deepEqual(res.task.attributes, JSON.parse(assignedReservationInstance.task.attributes));
            assert.deepEqual(res.task.dateCreated, new Date(assignedReservationInstance.task.date_created * 1000));
            assert.deepEqual(res.task.dateUpdated, new Date(assignedReservationInstance.task.date_updated * 1000));
            assert.equal(res.task.priority, assignedReservationInstance.task.priority);
            assert.equal(res.task.queueName, assignedReservationInstance.task.queue_name);
            assert.equal(res.task.queueSid, assignedReservationInstance.task.queue_sid);
            assert.equal(res.task.reason, assignedReservationInstance.task.reason);
            assert.equal(res.task.sid, assignedReservationInstance.task.sid);
            assert.equal(res.task.status, assignedReservationInstance.task.assignment_status);
            assert.equal(res.task.taskChannelUniqueName, assignedReservationInstance.task.task_channel_unique_name);
            assert.equal(res.task.taskChannelSid, assignedReservationInstance.task.task_channel_sid);
            assert.equal(res.task.timeout, assignedReservationInstance.task.timeout);
            assert.equal(res.task.workflowSid, assignedReservationInstance.task.workflow_sid);
            assert.equal(res.task.workflowName, assignedReservationInstance.task.workflow_name);

            assert.equal(res._worker, worker);
            assert.instanceOf(res._log, Logger);
        });
    });

    describe('#accept', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = { ReservationStatus: 'accepted' };


        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should accept the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationAccepted));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.accept().then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('accepted');
            });
        });

        it('should return an error if unable to accept the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.accept().catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });
    });

    describe('#reject(options)', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = {
            ReservationStatus: 'rejected'
        };

        const optionalParams = { WorkerActivitySid: 'WAxxx' };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should reject the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationRejected));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.reject().then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('rejected');
            });
        });

        it('should return an error if the optional params fail type check', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.reject({ activitySid: true });
            }).should.throw(/activitySid does not meet the required type/);
        });

        it('should set the requestParams using the options provided', () => {
            const params = Object.assign({}, requestParams, optionalParams);

            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, params, API_V1).returns(Promise.resolve(reservationRejected));
            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.reject({ activitySid: 'WAxxx' }).then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('rejected');
            });
        });

        it('should return an error if unable to reject the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.reject().catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });
    });

    describe('#call(from, url, options)', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = {
            Instruction: 'call',
            CallFrom: '+12345678901',
            CallUrl: twimlCallUrl
        };

        const optionalParams = {
            to: '+11111111111',
            accept: true,
            record: 'do-not-record',
            timeout: 10,
            statusCallbackUrl: 'http://example.com'
        };
        const optionalParmsWithCallPrefix = _.mapKeys(optionalParams, (v, k) => 'Call' + _.upperFirst(k));

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should throw an error if the from parameter is not provided', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                // eslint-disable-next-line
                pendingReservation.call(null, twimlCallUrl);
            }).should.throw(/from is a required parameter/);
        });

        it('should throw an error if the url parameter is not provided', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.call('112345678901');
            }).should.throw(/url is a required parameter/);
        });

        it('should return an error if unable to issue a call instruction', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.call('+12345678901', twimlCallUrl).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });

        it('should issue a call instruction', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationCalled));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.call('+12345678901', twimlCallUrl).then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });

        it('should return an error if the optional params fail type check', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.call('+12345678901', twimlCallUrl, { accept: 'false' });
            }).should.throw(/accept does not meet the required type/);
        });

        it('should set the requestParams using the options provided', () => {
            const params = Object.assign({}, requestParams, optionalParmsWithCallPrefix);

            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, params, API_V1).returns(Promise.resolve(reservationCalled));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.call('+12345678901', twimlCallUrl, optionalParams).then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });
    });

    describe('#dequeue(options)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = {
            Instruction: 'dequeue'
        };
        const optionalParams = {
            to: '+11111111111',
            from: '+22222222222',
            postWorkActivitySid: 'WAxxx',
            record: 'do-not-record',
            timeout: 10,
            statusCallbackUrl: 'http://example.com',
            statusCallbackEvents: 'answered'
        };
        const optionalParmsWithDequeuePrefix = _.mapKeys(optionalParams, (v, k) => 'Dequeue' + _.upperFirst(k));


        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should throw an error if unable to issue dequeue instruction', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.dequeue().catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });

        it('should dequeue the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationDequeued));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.dequeue().then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });

        it('should return an error if the optional params fail type check', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.dequeue({ record: true });
            }).should.throw(/record does not meet the required type/);
        });

        it('should set the requestParams using the options provided', () => {
            const params = Object.assign({}, requestParams, optionalParmsWithDequeuePrefix);

            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, params, API_V1).returns(Promise.resolve(reservationDequeued));
            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.dequeue(optionalParams).then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });
    });

    describe('#redirect(callSid, url, options)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = {
            Instruction: 'redirect',
            RedirectCallSid: 'CA8d7a41c9c98d9ff2c16e1ae93bff381e',
            RedirectUrl: twimlCallUrl
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should throw an error if callSid is missing', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.redirect(null, twimlCallUrl);
            }).should.throw(/callSid is a required parameter/);
        });

        it('should throw an error if url is missing', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e');
            }).should.throw(/url is a required parameter/);
        });

        it('should throw an error if unable to issue redirect instruction', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);

            return pendingReservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', twimlCallUrl).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });

        it('should redirect the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationRedirected));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', twimlCallUrl).then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });

        it('should return an error if required parameters are missing', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', { accept: true });
            }).should.throw(/url is a required parameter/);
        });

        it('should set the requestParams using the options provided', () => {
            const params = Object.assign({}, requestParams, { RedirectAccept: true });

            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, params, API_V1).returns(Promise.resolve(reservationDequeued));
            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', twimlCallUrl, { accept: true }).then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });
    });

    describe('#conference(options)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = {
            Instruction: 'conference'
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should throw an error if unable to issue conference instruction', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.conference().catch((err) => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });

        it('should conference the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationConferenced));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.conference().then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });

        it('should return an error if the optional params fail type check', () => {
            (() => {
                const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
                pendingReservation.conference({ record: true });
            }).should.throw(/record does not meet the required type/);
        });

        it('should set the requestParams using the options provided', () => {
            const params = Object.assign({}, requestParams, { MaxParticipants: 10 });

            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, params, API_V1).returns(Promise.resolve(reservationDequeued));
            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.conference({ maxParticipants: 10 }).then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });
    });

    describe('#_emitEvent(eventType, rawEventData)', () => {
        it('should emit Event:on(accepted) and update the Reservation and Task', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            assert.equal(pendingReservation.status, 'pending');
            pendingReservation.on('accepted', spy);
            pendingReservation._emitEvent('accepted', mockEvents.reservation.accepted);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'accepted');
            assert.equal(pendingReservation.sid, mockEvents.reservation.accepted.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.accepted.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.accepted.task.date_updated * 1000));
        });

        it('should emit Event:on(completed) and update the Reservation and Task', () => {
            const spy = sinon.spy();

            const assignedReservation = new Reservation(worker, new Request(config), assignedReservationDescriptor);
            assert.equal(assignedReservation.status, 'accepted');
            assignedReservation.on('completed', spy);
            assignedReservation._emitEvent('completed', mockEvents.reservation.completed);

            assert.isTrue(spy.calledOnce);
            assert.equal(assignedReservation.status, 'completed');
            assert.equal(assignedReservation.sid, mockEvents.reservation.completed.sid);

            // check that the task's status was also updated
            assert.equal(assignedReservation.task.status, mockEvents.reservation.completed.task.assignment_status);
            assert.equal(assignedReservation.task.reason, mockEvents.reservation.completed.task.reason);
            assert.deepEqual(assignedReservation.task.dateUpdated, new Date(mockEvents.reservation.completed.task.date_updated * 1000));
        });

        it('should emit Event:on(rejected) and update the Reservation and Task', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            assert.equal(pendingReservation.status, 'pending');
            pendingReservation.on('rejected', spy);
            pendingReservation._emitEvent('rejected', mockEvents.reservation.rejected);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'rejected');
            assert.equal(pendingReservation.sid, mockEvents.reservation.rejected.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.rejected.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.rejected.task.date_updated * 1000));
        });

        it('should emit Event:on(timeout) and update the Reservation and Task', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            assert.equal(pendingReservation.status, 'pending');
            pendingReservation.on('timeout', spy);
            pendingReservation._emitEvent('timeout', mockEvents.reservation.timedOut);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'timeout');
            assert.equal(pendingReservation.sid, mockEvents.reservation.timedOut.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.timedOut.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.timedOut.task.date_updated * 1000));
        });


        it('should emit Event:on(canceled) and update the Reservation and Task', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            assert.equal(pendingReservation.status, 'pending');
            pendingReservation.on('canceled', spy);
            pendingReservation._emitEvent('canceled', mockEvents.reservation.canceled);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'canceled');
            assert.equal(pendingReservation.sid, mockEvents.reservation.canceled.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.canceled.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.canceled.task.date_updated * 1000));
        });

        it('should emit Event:on(rescinded) and update the Reservation and Task', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            assert.equal(pendingReservation.status, 'pending');
            pendingReservation.on('rescinded', spy);
            pendingReservation._emitEvent('rescinded', mockEvents.reservation.rescinded);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'rescinded');
            assert.equal(pendingReservation.sid, mockEvents.reservation.rescinded.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.rescinded.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.rescinded.task.date_updated * 1000));
        });
    });
});
