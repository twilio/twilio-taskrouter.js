import _ from 'lodash';
import { parseTime } from '../util/Tools';
import { TransferProperties } from '../Transfer';

/**
 * Construct a {@link TransferDescriptor} for the given {@link Transfer} data representation
 * @class
 * @classdesc A data descriptor of a {@link Transfer}
 * @param {Object} descriptor - The data representing a {@link Transfer}
 * @property {Date} dateCreated
 * @property {Date} dateUpdated
 * @property {string} mode - Transfer mode ['WARM', 'COLD']
 * @property {string} reservationSid - The SID of the initiating {@link Reservation}.
 * @property {string} to
 * @property {string} type
 * @property {string} sid
 * @property {string} status - ['INITIATED', 'FAILED', 'COMPLETED']
 * @property {string} workerSid
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
        this.reservationSid = descriptor.initiating_reservation_sid;
        this.to = descriptor.transfer_to;
        this.type = descriptor.transfer_type;
        this.sid = descriptor.sid;
        this.status = descriptor.transfer_status;
        this.workerSid = descriptor.initiating_worker_sid;
    }
}
