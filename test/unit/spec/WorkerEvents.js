const mockEvents = require('../../mock/Events').events;
import { initiatedTaskTransfer } from '../../mock/Transfers';
import { API_V2 } from '../../../lib/util/Constants';
import Request from '../../../lib/util/Request';
import ReservationsEntity from '../../../lib/data/ReservationsEntity';
import Routes from '../../../lib/util/Routes';
import Worker from '../../../lib/Worker';
import { WorkerConfig } from '../../mock/WorkerConfig';
import { token } from '../../mock/Token';
import Configuration from '../../../lib/util/Configuration';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

describe('WorkerEvents', () => {
    const config = new Configuration(token);
    const worker = new Worker(token, WorkerConfig);
    const routes = new Routes('WSxxx', 'WKxxx');
    sinon.stub(worker, 'getRoutes').returns(routes);
    worker._subscribeToTaskRouterEvents();

    const r1 = 'WRxx1';
    const r2 = 'WRxx2';
    const r3 = 'WRxx3';
    const t1 = 'WTxx1';
    const t2 = 'WTxx2';
    const w1 = 'WKxx1';

    describe('TaskEvents', () => {
        it('should emit events for all relevant tasks', () => {
            const spy = sinon.spy();

            const reservationsServices = new ReservationsEntity(worker, new Request(config));
            worker._dataServices.reservationsEntity = reservationsServices;

            const reservation3 = Object.assign({}, mockEvents.reservation.accepted, { sid: r3 });
            reservation3.task.sid = t2;

            // two reservations WRxx1, WRxx2, for the same task WTxx1
            reservationsServices.insert(mockEvents.reservation.wrapping);
            reservationsServices.insert(mockEvents.reservation.createdByColdTransfer);
            // reservation for a different task WRxx3 for task WTxx2
            reservationsServices.insert(reservation3);

            // add a listener for all ReservationTasks related to WTxx1
            const taskReservationsList = reservationsServices.getTasks(t1);
            assert.equal(taskReservationsList.length, 2);
            assert.notEqual(taskReservationsList[0], taskReservationsList[1]);
            taskReservationsList.forEach(t => {
                t.on('updated', spy);
            });

            // add a listener for all ReservationTasks related to WTxx2
            const taskReservationList2 = reservationsServices.getTasks(t2);
            assert.equal(taskReservationList2.length, 1);
            assert.equal(taskReservationList2[0].reservationSid, r3);
            taskReservationList2.forEach(t => {
                t.on('updated', spy);
            });

            // trigger a task update for task WTxx1
            // it should send 2 update events to the two related reservations WRxx1 and WRxx2, not WRxx3
            worker._signaling.emit('task.updated', mockEvents.task.updated, 'task.updated');

            expect(spy.callCount).to.equal(2);
            expect(spy.getCall(0).args[0].reservationSid).to.equal(r1);
            expect(spy.getCall(1).args[0].reservationSid).to.equal(r2);

        });

        it('should update version field after receiving task update event', () => {
            const oldVersion = 1;
            const newVersion = 2;

            const reservationsServices = new ReservationsEntity(worker, new Request(config));
            worker._dataServices.reservationsEntity = reservationsServices;

            const reservation = Object.assign({}, mockEvents.reservation.accepted);
            reservation.task.sid = t1;
            reservation.task.version = oldVersion;
            reservationsServices.insert(reservation);

            worker._signaling.emit('task.updated', Object.assign({}, mockEvents.task.updated, { version: newVersion }), 'task.updated');

            const updatedTask = reservationsServices.reservations.get(reservation.sid).task;
            assert.equal(updatedTask.version, newVersion);
        });
    });

    describe('TransferEvents', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Transfers';

        const requestParams = {
            ReservationSid: r1,
            TaskSid: t1,
            To: w1,
            Mode: 'COLD'
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should emit transfer events only for the relevant tasks', () => {
            const spy = sinon.spy();

            const reservationsServices = new ReservationsEntity(worker, new Request(config));
            worker._dataServices.reservationsEntity = reservationsServices;

            // two reservations for the same task
            reservationsServices.insert(mockEvents.reservation.wrapping);
            reservationsServices.insert(mockEvents.reservation.createdByColdTransfer);

            const taskReservationsList = reservationsServices.getTasks(t1);
            assert.equal(taskReservationsList.length, 2);
            assert.notEqual(taskReservationsList[0], taskReservationsList[1]);

            // mock the initiated transfer
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.resolve(initiatedTaskTransfer));

            return taskReservationsList[0].transfer(w1, { mode: 'COLD' }).then(transferredTask => {
                assert.isNotNull(transferredTask.transfers.outgoing);
                transferredTask.transfers.outgoing.on('completed', spy);

                // eslint-disable-next-line camelcase
                worker._signaling.emit('task.transfer-completed', Object.assign({}, mockEvents.task.transferCompleted, { initiating_reservation_sid: r1, task_sid: t1 }), 'task.transfer-completed');
                assert.equal(spy.callCount, 1);
                // check that the first wrapping reservation does not have a transfer object
                assert.isNull(taskReservationsList[1].transfers.outgoing);
            });
        });
    });

    describe('ReservationEvents', () => {
        it('should emit Event:on(reservationFailed)', () => {
            const spy = sinon.spy();

            worker.on('reservationFailed', spy);
            worker.emit('reservationFailed', mockEvents.reservation.failed, 'reservationFailed');
            assert.isTrue(spy.calledOnce);
            expect(spy.getCall(0).args[0]).to.equal(mockEvents.reservation.failed);
        });

        it('should update version field after receiving reservation accepted event', () => {
            const oldVersion = 1;
            const newVersion = 2;

            const reservationsServices = new ReservationsEntity(worker, new Request(config));
            worker._dataServices.reservationsEntity = reservationsServices;

            const reservation = Object.assign({}, mockEvents.reservation.accepted);
            reservation.version = oldVersion;
            reservationsServices.insert(reservation);

            worker._signaling.emit('reservation.accepted', Object.assign({}, mockEvents.reservation.accepted, { version: newVersion }), 'reservation.accepted');

            const updatedReservation = reservationsServices.reservations.get(reservation.sid);
            assert.equal(updatedReservation.version, newVersion);
        });
    });

});
