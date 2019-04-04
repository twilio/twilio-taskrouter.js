import _ from 'lodash';
import { parseTime } from '../util/Tools';
import { TransferProperties } from '../core/transfer/Transfer';

/**
 * Construct a {@link TransferDescriptor} for the given {@link Transfer} data representation
 * @class
 * @classdesc A data descriptor of a {@link Transfer}
 * @param {Object} descriptor - The data representing a {@link Transfer}
 * @property {Date} dateCreated - The timestamp when this {@link Transfer} was created
 * @property {Date} dateUpdated - The timestamp when this {@link Transfer} was last updated
 * @property {string} mode - Transfer mode ['WARM', 'COLD']
 * @property {string} reservationSid - The Sid of the initiating {@link Reservation}.
 * @property {string} to - The sid of the {@link Worker} or TaskQueue this {@link Transfer} is intended for
 * @property {string} type - The transfer type ['QUEUE', 'WORKER']
 * @property {string} sid - The sid of this {@link Transfer}
 * @property {string} status - ['INITIATED', 'FAILED', 'COMPLETED', 'CANCELED']
 * @property {string} workerSid - The sid of the initiating {@link Worker}
 */
export default class TransferDescriptor {
    constructor(descriptor) {
        if (!_.isObject(descriptor)) {
            throw new TypeError('Failed to instantiate TransferDescriptor. <Descriptor>descriptor is required.');
        }

        if (!TransferProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to instantiate TransferDescriptor. <Descriptor>descriptor does not contain all properties of a Transfer.');
        }

        this.dateCreated = parseTime(descriptor.date_created * 1000);
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        this.mode = descriptor.transfer_mode;
        this.queueSid = descriptor.initiating_queue_sid;
        this.reservationSid = descriptor.initiating_reservation_sid;
        this.to = descriptor.transfer_to;
        this.type = descriptor.transfer_type;
        this.sid = descriptor.sid;
        this.status = descriptor.transfer_status;
        this.workerSid = descriptor.initiating_worker_sid;
        this.workflowSid = descriptor.initiating_workflow_sid;
    }
}
