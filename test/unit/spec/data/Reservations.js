import { API_V2 } from '../../../../lib/util/Constants';
import { reservations as mockList, assignedReservationInstance as mockInstance } from '../../../mock/Reservations';
import Request from '../../../../lib/util/Request';
import ReservationsEntity from '../../../../lib/data/ReservationsEntity';
import Worker from '../../../../lib/Worker';
import { WorkerConfig } from '../../../mock/WorkerConfig';
import { token } from '../../../mock/Token';
import Configuration from '../../../../lib/util/Configuration';
import Routes from '../../../../lib/util/Routes';
import AssertionUtils from '../../../util/AssertionUtils';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.should();
const sinon = require('sinon');

describe('Reservations', () => {
    const config = new Configuration(token);
    const worker = new Worker(token, WorkerConfig);
    const routes = new Routes('WSxxx', 'WKxxx');
    sinon.stub(worker, 'getRoutes').returns(routes);

    describe('constructor', () => {
        it('should throw an error if the worker is missing', () => {
            (() => {
                new ReservationsEntity();
            }).should.throw(/worker is a required parameter/);
        });

        it('should use the default pageSize=1000, if none provided', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config));
            assert.equal(reservationsServices._pageSize, 1000);
        });

        it('should use the pageSize, if provided', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config), { pageSize: 50 });
            assert.equal(reservationsServices._pageSize, 50);
        });
    });

    describe('#fetchReservations', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should fetch all reservations', () => {
            const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations';
            const requestParams = {
                Active: 'true',
                PageSize: 1000
            };

            sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V2, requestParams).returns(Promise.resolve(mockList));
            const reservationsServices = new ReservationsEntity(worker, new Request(config));
            return reservationsServices.fetchReservations().then(() => {
                expect(reservationsServices.reservations.size).to.equal(mockList.total);
                mockList.contents.forEach(reservation => AssertionUtils.assertReservation(reservationsServices.reservations.get(reservation.sid), reservation));
            });
        });

        it('should clear old reservations before refreshing the reservation map', () => {
            const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations';
            const requestParams = {
                Active: 'true',
                PageSize: 1000
            };

            sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V2, requestParams).returns(Promise.resolve(mockList));

            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            return reservationsServices.fetchReservations().then(() => {
                expect(reservationsServices.reservations.size).to.equal(mockList.contents.length);

                reservationsServices.reservations.forEach(reservation => {
                    if (reservation.sid === 'WRxx1') {
                        assert.equal(reservation.accountSid, mockInstance.account_sid);
                        assert.equal(reservation.workspaceSid, mockInstance.workspace_sid);
                        assert.equal(reservation.sid, mockInstance.sid);
                        assert.equal(reservation.workerSid, mockInstance.worker_sid);
                        assert.equal(reservation.status, mockInstance.reservation_status);
                        assert.equal(reservation.timeout, mockInstance.reservation_timeout);
                        assert.deepEqual(reservation.dateCreated, new Date(mockInstance.date_created * 1000));
                        assert.deepEqual(reservation.dateUpdated, new Date(mockInstance.date_updated * 1000));
                    }
                });
            }).then(() => reservationsServices.fetchReservations()).then(() => {
                expect(reservationsServices.reservations.size).to.equal(mockList.contents.length);
            });
        });
    });

    describe('#getTasks', () => {
        it('should maintain a reverse lookup of TaskSid to ReservationSids and append if referencing the same reservation', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            // many reservations for the same worker for the same task
            const reservationData2 = Object.assign({}, mockInstance, { sid: 'WRxx2' });

            reservationsServices.insert(mockInstance);
            reservationsServices.insert(reservationData2);

            const taskReservationsList = reservationsServices.getTasks('WTxx1');
            assert.equal(taskReservationsList.length, 2);
            const task1 = taskReservationsList[0];
            const task2 = taskReservationsList[1];

            assert.equal(task1.reservationSid, 'WRxx1');
            assert.equal(task1.sid, 'WTxx1');
            assert.equal(task2.reservationSid, 'WRxx2');
            assert.equal(task2.sid, 'WTxx1');
            assert.notEqual(task1, task2);
        });

        it('should return null if looking up a task that has not been tracked', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            mockList.contents.forEach(mockReservation => {
                reservationsServices.insert(mockReservation);
            });

            assert.isNull(reservationsServices.getTasks('WTxx10'));
        });
    });

    describe('_insertReservation(reservationDescriptor)', () => {
        it('should track a new mapping for each unique Task', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            mockList.contents.forEach(mockReservation => {
                reservationsServices.insert(mockReservation);
            });

            assert.equal(reservationsServices._reservationSidsByTask.size, 9);
            reservationsServices._reservationSidsByTask.forEach(rt => {
                assert.equal(rt.size, 1);
            });
        });

        it('should not insert the same reservationTask twice', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            reservationsServices.insert(mockInstance);
            reservationsServices.insert(mockInstance);

            const taskReservationsList = reservationsServices.getTasks('WTxx1');
            assert.equal(taskReservationsList.length, 1);
            const task1 = taskReservationsList[0];

            assert.equal(task1.reservationSid, 'WRxx1');
            assert.equal(task1.sid, 'WTxx1');
        });

        it('should append to the set if a new Task is seen', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            reservationsServices.insert(mockInstance);
            reservationsServices.insert(Object.assign({}, mockInstance, { sid: 'WRxx2' }));

            assert.equal(reservationsServices._reservationSidsByTask.size, 1);
            const taskReservationsList = reservationsServices.getTasks('WTxx1');
            assert.equal(taskReservationsList.length, 2);

            const task1 = taskReservationsList[0];
            assert.equal(task1.reservationSid, 'WRxx1');
            assert.equal(task1.sid, 'WTxx1');
            const task2 = taskReservationsList[1];
            assert.equal(task2.reservationSid, 'WRxx2');
            assert.equal(task2.sid, 'WTxx1');
        });
    });
});
