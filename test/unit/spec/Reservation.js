import _ from 'lodash';
import { API_V1, API_V2 } from '../../../lib/util/Constants';
import Configuration from '../../../lib/util/Configuration';
import Logger from '../../../lib/util/Logger';
const mockEvents = require('../../mock/Events').events;
import { pendingReservationInstance, assignedReservationInstance, acceptedReservationWithActiveOutgoingTransfer, acceptedReservationWithIncomingAndActiveOutgoingTransfer, pendingReservationIncomingTransfer } from '../../mock/Reservations';
import { reservationAccepted, reservationCalled, reservationDequeued, reservationRedirected, reservationRejected, reservationConferenced, reservationCompleted, reservationWrapping } from '../../mock/Responses';
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
import AssertionUtils from '../../util/AssertionUtils';

describe('Reservation', () => {
    const config = new Configuration(token);
    const routes = new Routes('WSxxx', 'WKxxx');
    const worker = new Worker(token, WorkerConfig);
    sinon.stub(worker, 'getRoutes').returns(routes);

    const pendingReservationDescriptor = new ReservationDescriptor(pendingReservationInstance, worker);
    const assignedReservationDescriptor = new ReservationDescriptor(assignedReservationInstance, worker);

    // transfers
    const acceptedReservationWithActiveOutgoingTransferDescriptor = new ReservationDescriptor(acceptedReservationWithActiveOutgoingTransfer, worker);
    const acceptedReservationWithIncomingAndActiveOutgoingTransferDescriptor = new ReservationDescriptor(acceptedReservationWithIncomingAndActiveOutgoingTransfer, worker);
    const pendingTransferReservationDescriptor = new ReservationDescriptor(pendingReservationIncomingTransfer, worker);

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

        describe('should sync on API GET', () => {
            it('for simple reservation object', () => {
                const res = new Reservation(worker, new Request(config), assignedReservationDescriptor);
                AssertionUtils.assertReservation(res, assignedReservationInstance);
                assert.equal(res._worker, worker);
                assert.instanceOf(res._log, Logger);
            });

            it('for reservation with outgoing transfer info', () => {
                const res = new Reservation(worker, new Request(config), acceptedReservationWithActiveOutgoingTransferDescriptor);
                AssertionUtils.assertReservation(res, acceptedReservationWithActiveOutgoingTransfer);
                assert.equal(res._worker, worker);
                assert.instanceOf(res._log, Logger);
            });

            it('for reservation with incoming/outgoing transfer info', () => {
                const res = new Reservation(worker, new Request(config), acceptedReservationWithIncomingAndActiveOutgoingTransferDescriptor);
                AssertionUtils.assertReservation(res, acceptedReservationWithIncomingAndActiveOutgoingTransfer);
                assert.equal(res._worker, worker);
                assert.instanceOf(res._log, Logger);
            });
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

        it('should pass the object version to API request', () => {
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1);
            stub.returns(Promise.resolve(reservationAccepted));

            const reservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            reservation.version = 1;

            return reservation.accept().then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, reservation.version);
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

    describe('#complete', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = { ReservationStatus: 'completed' };


        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should complete the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationCompleted));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.complete().then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('completed');
            });
        });

        it('should pass the object version to API request', () => {
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1);
            stub.returns(Promise.resolve(reservationCompleted));

            const reservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            reservation.version = 1;

            return reservation.complete().then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, reservation.version);
            });
        });

        it('should return an error if unable to complete the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.complete().catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });
    });

    describe('#wrap', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations/WRxx1';
        const requestParams = { ReservationStatus: 'wrapping' };


        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should wrap the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationWrapping));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.wrap().then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('wrapping');
            });
        });

        it('should pass the object version to API request', () => {
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1);
            stub.returns(Promise.resolve(reservationWrapping));

            const reservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            reservation.version = 1;

            return reservation.wrap().then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, reservation.version);
            });
        });

        it('should return an error if unable to wrap the reservation', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.wrap().catch(err => {
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

        it('should pass the object version to API request', () => {
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1);
            stub.returns(Promise.resolve(reservationRejected));

            const reservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            reservation.version = 1;

            return reservation.reject().then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, reservation.version);
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

        it('should pass the object version to API request', () => {
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1);
            stub.returns(Promise.resolve(reservationCalled));

            const reservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            reservation.version = 1;

            return reservation.call('+12345678901', twimlCallUrl).then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, reservation.version);
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

        it('should pass the object version to API request', () => {
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1);
            stub.returns(Promise.resolve(reservationCalled));

            const reservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            reservation.version = 1;

            return reservation.dequeue().then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, reservation.version);
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

        it('should pass the object version to API request', () => {
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1);
            stub.returns(Promise.resolve(reservationRedirected));

            const reservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            reservation.version = 1;

            return reservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', twimlCallUrl).then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, reservation.version);
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

        it('should not override reservation status received from Taskrouter', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(reservationAccepted));

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            return pendingReservation.conference().then(updatedReservation => {
                expect(updatedReservation).to.equal(pendingReservation);
                expect(pendingReservation.status).to.equal('pending');
            });
        });
    });

    describe('#updateParticipant(options)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/WorkerParticipant';
        const requestParams = {
            ReservationSid: 'WRxx1',
            EndConferenceOnExit: true
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should return an error if the optional params fail type check', () => {
            (() => {
                const assignedReservation = new Reservation(worker, new Request(config), assignedReservationDescriptor);
                assignedReservation.updateParticipant({ endConferenceOnExit: 'true' });
            }).should.throw(/endConferenceOnExit does not meet the required type/);
        });

        it('should update properties on the Worker leg and return self', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.resolve(assignedReservationDescriptor));

            const assignedReservation = new Reservation(worker, new Request(config), assignedReservationDescriptor);
            assignedReservation.updateParticipant({ endConferenceOnExit: true }).then(sameRes => {
                expect(assignedReservation).to.be.equal(sameRes);
            });
        });

        it('should return an error if updating the worker leg failed', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const assignedReservation = new Reservation(worker, new Request(config), assignedReservationDescriptor);
            assignedReservation.updateParticipant({ endConferenceOnExit: true }).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
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

            // check that the transfers are not updated
            assert.isNull(pendingReservation.task.transfers.incoming);
            assert.isNull(pendingReservation.task.transfers.outgoing);

            // check that reservation object did not have property canceledReasonCode
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));
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

            // check that the transfers are not updated
            assert.isNull(assignedReservation.task.transfers.incoming);
            assert.isNull(assignedReservation.task.transfers.outgoing);

            // check that reservation object did not have property canceledReasonCode
            assert.isFalse(assignedReservation.hasOwnProperty('canceledReasonCode'));
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

            // check that the transfers are not updated
            assert.isNull(pendingReservation.task.transfers.incoming);
            assert.isNull(pendingReservation.task.transfers.outgoing);

            // check that reservation object did not have property canceledReasonCode
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));
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

            // check that the transfers are not updated
            assert.isNull(pendingReservation.task.transfers.incoming);
            assert.isNull(pendingReservation.task.transfers.outgoing);

            // check that reservation object did not have property canceledReasonCode
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));
        });


        it('should emit Event:on(canceled) and update the Reservation and Task', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);
            assert.equal(pendingReservation.status, 'pending');

            // check that pending reservation object did not have property canceledReasonCode
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));

            pendingReservation.on('canceled', spy);
            pendingReservation._emitEvent('canceled', mockEvents.reservation.canceled);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'canceled');
            assert.equal(pendingReservation.sid, mockEvents.reservation.canceled.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.canceled.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.canceled.task.date_updated * 1000));

            // check that the transfers are not updated
            assert.isNull(pendingReservation.task.transfers.incoming);
            assert.isNull(pendingReservation.task.transfers.outgoing);

            // check that reservation object did not have property canceledReasonCode on emitted canceled event
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));
        });

        it('should emit Event:on(canceled) and update the Reservation with valid canceled_reason_code', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);

            assert.equal(pendingReservation.status, 'pending');

            // check that pending reservation object did not have property canceledReasonCode
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));

            pendingReservation.on('canceled', spy);
            pendingReservation._emitEvent('canceled', mockEvents.reservation.canceledWithValidReasonCode);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'canceled');
            assert.equal(pendingReservation.sid, mockEvents.reservation.canceledWithValidReasonCode.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.canceledWithValidReasonCode.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.canceledWithValidReasonCode.task.date_updated * 1000));

            // check that the transfers are not updated
            assert.isNull(pendingReservation.task.transfers.incoming);
            assert.isNull(pendingReservation.task.transfers.outgoing);

            // check that reservation object has property canceledReasonCode on emitted canceled event
            assert.isTrue(pendingReservation.hasOwnProperty('canceledReasonCode'));
            assert.equal(pendingReservation.canceledReasonCode, mockEvents.reservation.canceledWithValidReasonCode.canceled_reason_code);
        });

        it('should emit Event:on(canceled) and update the Reservation with invalid canceled_reason_code', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingReservationDescriptor);

            assert.equal(pendingReservation.status, 'pending');

            // check that pending reservation object did not have property canceledReasonCode
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));

            pendingReservation.on('canceled', spy);
            pendingReservation._emitEvent('canceled', mockEvents.reservation.canceledWithInvalidReasonCode);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'canceled');
            assert.equal(pendingReservation.sid, mockEvents.reservation.canceledWithInvalidReasonCode.sid);

            // check that the task's status was also updated
            assert.equal(pendingReservation.task.status, mockEvents.reservation.canceledWithInvalidReasonCode.task.assignment_status);
            assert.deepEqual(pendingReservation.task.dateUpdated, new Date(mockEvents.reservation.canceledWithInvalidReasonCode.task.date_updated * 1000));

            // check that the transfers are not updated
            assert.isNull(pendingReservation.task.transfers.incoming);
            assert.isNull(pendingReservation.task.transfers.outgoing);

            // check that reservation object has property canceledReasonCode on emitted canceled event
            assert.isTrue(pendingReservation.hasOwnProperty('canceledReasonCode'));
            assert.equal(pendingReservation.canceledReasonCode, mockEvents.reservation.canceledWithInvalidReasonCode.canceled_reason_code);
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

            // check that the transfers are not updated
            assert.isNull(pendingReservation.task.transfers.incoming);
            assert.isNull(pendingReservation.task.transfers.outgoing);

            // check that reservation object did not have property canceledReasonCode
            assert.isFalse(pendingReservation.hasOwnProperty('canceledReasonCode'));
        });
    });

    describe('#_update()', () => {
        it('should update the incoming transfer, if applicable', () => {
            const spy = sinon.spy();

            const pendingReservation = new Reservation(worker, new Request(config), pendingTransferReservationDescriptor);
            assert.equal(pendingReservation.status, 'pending');
            assert.equal(pendingReservation.task.transfers.incoming.status, 'initiated');
            assert.isNull(pendingReservation.task.transfers.outgoing);

            pendingReservation.on('canceled', spy);
            pendingReservation._emitEvent('canceled', mockEvents.reservation.canceledForIncomingTransfer);

            assert.isTrue(spy.calledOnce);
            assert.equal(pendingReservation.status, 'canceled');
            assert.equal(pendingReservation.sid, mockEvents.reservation.canceledForIncomingTransfer.sid);
            assert.equal(pendingReservation.task.transfers.incoming.status, 'canceled');
            // verify that the outgoing transfer is still unset
            assert.isNull(pendingReservation.task.transfers.outgoing);
        });
    });
});
