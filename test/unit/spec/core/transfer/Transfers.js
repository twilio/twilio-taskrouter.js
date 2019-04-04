import AssertionUtils from '../../../../util/AssertionUtils';
import { acceptedReservationWithIncomingAndActiveOutgoingTransfer as mockReservation } from '../../../../mock/Reservations';
import Request from '../../../../../lib/util/Request';
import Configuration from '../../../../../lib/util/Configuration';
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
});
