import { EventEmitter } from 'events';
import TransferDescriptor from '../../descriptors/TransferDescriptor';

const fieldsToUpdate = [
    'dateUpdated',
    'status',
    'transferFailedReason'
];

/**
 * Construct a {@link Transfer}.
 * @classdesc A {@link Transfer} represents the transfer of work from one {@link Worker} to another or a queue
 * @extends EventEmitter
 * @param {Worker} worker - The {@link Worker}
 * @param {TransferDescriptor} transferDescriptor - The transfer descriptor which describes this {@link Transfer}
 * @property {Date} dateCreated - The timestamp when this {@link Transfer} was created
 * @property {Date} dateUpdated - The timestamp when this {@link Transfer} was last updated
 * @property {string} mode - Transfer mode ['WARM', 'COLD']
 * @property {string} queueSid - The Sid of the TaskQueue the {@link Task} belongs to
 * @property {string} reservationSid - The Sid of the initiating {@link Reservation}.
 * @property {string} to - The sid of the {@link Worker} or TaskQueue this {@link Transfer} is intended for
 * @property {string} [transferFailedReason] - The reason, if applicable, for why a transfer failed
 * @property {string} type - The transfer type ['QUEUE', 'WORKER']
 * @property {string} sid - The sid of this {@link Transfer}
 * @property {string} status - ['INITIATED', 'FAILED', 'COMPLETED', 'CANCELED']
 * @property {string} workerSid - The sid of the initiating {@link Worker}
 * @property {string} workflowSid - The Sid of the Workflow the {@link Task} was created against
 */
class Transfer extends EventEmitter {
    /**
     * @param {import('../../Worker')} worker - The {@link Worker}
     * @param {TransferDescriptor} descriptor - The transfer descriptor which describes this {@link Transfer}
     */
    constructor(worker, descriptor) {
        super();

        if (!(descriptor instanceof TransferDescriptor)) {
            throw new TypeError('Failed to instantiate Transfer. <TransferDescriptor>descriptor is a required parameter.');
        }
        /**
         * @private
         * @type {import('../../util/Logger')}
         */
        this._log = worker.getLogger(`Transfer-${descriptor.sid}`);
        /**
         * @type {Date}
         */
        this.dateCreated = descriptor.dateCreated;
        /**
         * @type {Date}
         */
        this.dateUpdated = descriptor.dateUpdated;
        /**
         * @type {string}
         */
        this.mode = descriptor.mode;
        /**
         * @type {string}
         */
        this.queueSid = descriptor.queueSid;
        /**
         * @type {string}
         */
        this.reservationSid = descriptor.reservationSid;
        /**
         * @type {string}
         */
        this.to = descriptor.to;
        /**
         * @type {?string}
         */
        this.transferFailedReason = descriptor.transferFailedReason;
        /**
         * @type {string}
         */
        this.type = descriptor.type;
        /**
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @type {string}
         */
        this.status = descriptor.status;
        /**
         * @type {string}
         */
        this.workerSid = descriptor.workerSid;
        /**
         * @type {string}
         */
        this.workflowSid = descriptor.workflowSid;

        Object.assign(this, descriptor);
    }

    /**
     * Update this using the latest {@link Transfer} data
     * @param {Object} latestTransferData - The raw {@link Transfer} data
     * @return {this} - {@link Transfer}
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
