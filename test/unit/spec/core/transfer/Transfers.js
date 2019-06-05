import AssertionUtils from '../../../../util/AssertionUtils';
const chai = require('chai');
const assert = chai.assert;
import { acceptedReservationWithIncomingAndActiveOutgoingTransfer as mockReservation } from '../../../../mock/Reservations';
import Request from '../../../../../lib/util/Request';
import Configuration from '../../../../../lib/util/Configuration';
const mockEvents = require('../../../../mock/Events').events;
const sinon = require('sinon');
import Transfers from '../../../../../lib/core/transfer/Transfers';
import { token } from '../../../../mock/Token';
import Worker from '../../../../../lib/Worker';
import { WorkerConfig } from '../../../../mock/WorkerConfig';
import ReservationDescriptor from '../../../../../lib/descriptors/ReservationDescriptor';
import { TRANSFER_STATUS } from '../../../../../lib/util/Constants';
import { canceledTaskTransfer } from '../../../../mock/Transfers';

describe('Transfers', () => {
    const config = new Configuration(token);
    const worker = new Worker(token, WorkerConfig);
    const request = new Request(config);
    const reservationDescriptor = new ReservationDescriptor(mockReservation, worker);
    const taskDescriptor = reservationDescriptor.taskDescriptor;


    describe('constructor', () => {
        it('should throw an error if task descriptor is missing', () => {
            (() => {
                new Transfers(worker, request, null);
            }).should.throw(/taskDescriptor is a required parameter/);
        });

        it('should set Transfer properties', () => {
            const transfers = new Transfers(worker, request, taskDescriptor);
            AssertionUtils.assertTransfer(transfers.incoming, mockReservation.task_transfer);
            AssertionUtils.assertTransfer(transfers.outgoing, mockReservation.active_outgoing_task_transfer);
        });
    });

    describe('#_updateOutgoing', () => {
        let transfers;
        beforeEach(() => {
            transfers = new Transfers(worker, request, taskDescriptor);
        });

        it('should create transfers.outgoing object if absent', () => {
            delete transfers.outgoing;
            transfers._updateOutgoing(canceledTaskTransfer);
            AssertionUtils.assertTransfer(transfers.incoming, mockReservation.task_transfer);
            AssertionUtils.assertTransfer(transfers.outgoing, canceledTaskTransfer);
        });

        it('should overwrite transfers.outgoing object', () => {
            transfers._updateOutgoing(canceledTaskTransfer, true);
            AssertionUtils.assertTransfer(transfers.incoming, mockReservation.task_transfer);
            AssertionUtils.assertTransfer(transfers.outgoing, canceledTaskTransfer);
        });

        it('should only update transfers.outgoing object if present', () => {
            const updatedTransferInstance = Object.create(mockReservation.active_outgoing_task_transfer);
            /* eslint-disable camelcase */
            updatedTransferInstance.transfer_status = TRANSFER_STATUS.failed;
            /* eslint-enable camelcase */
            transfers._updateOutgoing(updatedTransferInstance);
            // assert transfers.incoming has not changed
            AssertionUtils.assertTransfer(transfers.incoming, mockReservation.task_transfer);
            AssertionUtils.assertTransfer(transfers.outgoing, updatedTransferInstance);
        });
    });

    describe('#_update', () => {
        let transfers;
        beforeEach(() => {
            transfers = new Transfers(worker, request, taskDescriptor);
        });

        it('should throw an error if taskDescriptor is of wrong type', () => {
            (() => {
                new Transfers(worker, request, {});
            }).should.throw(/taskDescriptor is a required parameter/);
        });

        it('should ONLY update transfers from updatedReservation object', () => {
            const updatedReservationDescriptor = Object.create(reservationDescriptor);
            updatedReservationDescriptor.taskDescriptor.incomingTransferDescriptor.status = TRANSFER_STATUS.complete;
            const updatedTransferInstance = Object.create(mockReservation.task_transfer);
            /* eslint-disable camelcase */
            updatedTransferInstance.transfer_status = TRANSFER_STATUS.complete;
            /* eslint-enable camelcase */
            transfers._update(updatedReservationDescriptor.taskDescriptor);

            // Only the incoming transfer status should be updated
            AssertionUtils.assertTransfer(transfers.incoming, updatedTransferInstance);
            AssertionUtils.assertTransfer(transfers.outgoing, mockReservation.active_outgoing_task_transfer);
        });
    });

    describe('_emitEvent(eventType, rawEventData)', () => {
        let transfers;

        beforeEach(() => {
            transfers = new Transfers(worker, request, taskDescriptor);
        });

        it('should not emit an event or update if the outgoing transfer is null when an event is received', () => {
            transfers.outgoing = null;
            transfers._emitEvent('transfer-failed', {});
            assert.isNull(transfers.outgoing);
        });

        it('should not emit an event or update if the sid of the event does not match the existing outgoing instance', () => {
            transfers.outgoing.sid = 'TTxx3';
            transfers._emitEvent('transfer-failed', mockEvents.task.transferFailed);
            // check that the outgoing sid has not been updated
            assert.equal(transfers.outgoing.sid, 'TTxx3');
        });

        it('should emit the event and update the outgoing transfer on event transfer-failed', () => {
            const failedTransfer = Object.assign({}, mockEvents.task.transferFailed, { sid: 'TTxx2' });
            const spy = sinon.spy();
            transfers.outgoing.on('failed', spy);
            transfers._emitEvent('transfer-failed', failedTransfer);
            assert.isTrue(spy.calledOnce);
            spy.returned(sinon.match.same(failedTransfer));
            assert.equal(transfers.outgoing.status, 'failed');
            assert.equal(transfers.outgoing.sid, 'TTxx2');
        });

        it('should emit the event and update the outgoing transfer on event transfer-completed', () => {
            const completedTransfer = Object.assign({}, mockEvents.task.transferCompleted, { sid: 'TTxx2' });
            const spy = sinon.spy();
            transfers.outgoing.on('completed', spy);
            transfers._emitEvent('transfer-completed', completedTransfer);
            assert.isTrue(spy.calledOnce);
            spy.returned(sinon.match.same(completedTransfer));
            assert.equal(transfers.outgoing.status, 'complete');
            assert.equal(transfers.outgoing.sid, 'TTxx2');
        });

        it('should emit the event and update the outgoing transfer on event transfer-canceled', () => {
            const canceledTransfer = Object.assign({}, mockEvents.task.transferCanceled, { sid: 'TTxx2' });
            const spy = sinon.spy();
            transfers.outgoing.on('canceled', spy);
            transfers._emitEvent('transfer-canceled', canceledTransfer);
            assert.isTrue(spy.calledOnce);
            spy.returned(sinon.match.same(canceledTransfer));
            assert.equal(transfers.outgoing.status, 'canceled');
            assert.equal(transfers.outgoing.sid, 'TTxx2');
        });

        it('should emit the event and update outgoing transfer on event transfer-attempt-failed', () => {
            const attemptFailedTransfer = Object.assign({}, mockEvents.task.transferAttemptFailed, { sid: 'TTxx2' });
            const spy = sinon.spy();
            transfers.outgoing.on('attemptFailed', spy);
            transfers._emitEvent('transfer-attempt-failed', attemptFailedTransfer);
            assert.isTrue(spy.calledOnce);
            spy.returned(sinon.match.same(attemptFailedTransfer));
            assert.isNotNull(transfers.outgoing);
            assert.equal(transfers.outgoing.status, 'initiated');
            assert.equal(transfers.outgoing.transferFailedReason, 'Transfer attempt failed on reservation reject because there are no more pending reservations');
        });
    });
});
