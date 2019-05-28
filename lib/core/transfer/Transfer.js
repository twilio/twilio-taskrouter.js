import { EventEmitter } from 'events';
import TransferDescriptor from '../../descriptors/TransferDescriptor';

const fieldsToUpdate = [
    'dateUpdated',
    'status',
    'transferFailedReason'
];

/**
 * Construct a {@link Transfer}.
 * @class
 * @classdesc A {@link Transfer} represents the transfer of work from one {@link Worker} to another or a queue
 * @param {Worker} worker - The {@link Worker}
 * @param {TransferDescriptor} transferDescriptor - The transfer descriptor which describes this {@link Transfer}
 * @property {Date} dateCreated - The timestamp when this {@link Transfer} was created
 * @property {Date} dateUpdated - The timestamp when this {@link Transfer} was last updated
 * @property {string} mode - Transfer mode ['WARM', 'COLD']
 * @property {string} reservationSid - The sid of the initiating {@link Reservation}.
 * @property {string} sid - The sid of this {@link Transfer}
 * @property {string} status - ['INITIATED', 'FAILED', 'COMPLETE', 'CANCELED']
 * @property {string} to - The sid of the {@link Worker} or TaskQueue this {@link Transfer} is intended for
 * @property {string} type - The transfer type ['QUEUE', 'WORKER']
 * @property {string} workerSid - The sid of the initiating {@link Worker}
 */
class Transfer extends EventEmitter {
    constructor(worker, descriptor) {
        super();

        if (!(descriptor instanceof TransferDescriptor)) {
            throw new TypeError('Failed to instantiate Transfer. <TransferDescriptor>descriptor is a required parameter.');
        }
        this._log = worker.getLogger(`Transfer-${descriptor.sid}`);
        Object.assign(this, descriptor);
    }

    /**
     * Update this using the latest {@link Transfer} data
     * @param {Object} latestTransferData - The raw {@link Transfer} data
     * @private
     */
    _update(latestTransferData) {
        try {
            const updatedTransferDescriptor = new TransferDescriptor(latestTransferData);
            fieldsToUpdate.forEach(field => {
                this[field] = updatedTransferDescriptor[field];
            });
        } catch (err) {
            this._log.error(`Failed to update Transfer sid=${latestTransferData.sid}. Update aborted.`, err);
            throw new Error(`Failed to update Transfer sid=${latestTransferData.sid}. Update aborted. Error: ${err}.`);
        }

        return this;
    }
}

export const TransferProperties = [
    'date_created',
    'date_updated',
    'initiating_reservation_sid',
    'initiating_worker_sid',
    'initiating_queue_sid',
    'initiating_workflow_sid',
    'sid',
    'transfer_mode',
    'transfer_to',
    'transfer_type',
    'transfer_status',
];

export default Transfer;
