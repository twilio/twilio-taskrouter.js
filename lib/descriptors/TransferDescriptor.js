import isObject from 'lodash/isObject';
import { parseTime } from '../util/Tools';
import { TransferProperties } from '../core/transfer/Transfer';

/**
 * Construct a {@link TransferDescriptor} for the given {@link Transfer} data representation
 * @classdesc A data descriptor of a {@link Transfer}
 * @param {Object} descriptor - The data representing a {@link Transfer}
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
export default class TransferDescriptor {
    /**
     * @param {Object} descriptor - The data representing a {@link Transfer}
     */
    constructor(descriptor) {
        if (!isObject(descriptor)) {
            throw new TypeError('Failed to instantiate TransferDescriptor. <Descriptor>descriptor is required.');
        }

        if (!TransferProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to instantiate TransferDescriptor. <Descriptor>descriptor does not contain all properties of a Transfer.');
        }

        /**
         * @type {Date}
         */
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        /**
         * @type {Date}
         */
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        /**
         * @type {string}
         */
        this.mode = descriptor.transfer_mode;
        /**
         * @type {string}
         */
        this.queueSid = descriptor.initiating_queue_sid;
        /**
         * @type {string}
         */
        this.reservationSid = descriptor.initiating_reservation_sid;
        /**
         * @type {string}
         */
        this.to = descriptor.transfer_to;
        /**
         * @type {?string}
         */
        this.transferFailedReason = descriptor.transfer_failed_reason;
        /**
         * @type {string}
         */
        this.type = descriptor.transfer_type;
        /**
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @type {string}
         */
        this.status = descriptor.transfer_status;
        /**
         * @type {string}
         */
        this.workerSid = descriptor.initiating_worker_sid;
        /**
         * @type {string}
         */
        this.workflowSid = descriptor.initiating_workflow_sid;
    }
}
