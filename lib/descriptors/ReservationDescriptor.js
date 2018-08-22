import _ from 'lodash';
import { parseTime } from '../util/Tools';
import { ReservationProperties } from '../Reservation';
import TaskDescriptor from './TaskDescriptor';

/**
 * Construct a {@link ReservationDescriptor} for the given {@link Reservation} data representation
 * @class
 * @classdesc A data descriptor of a {@link Reservation}
 * @param {Object} descriptor - The data representing a {@link Reservation}
 * @param {Worker} worker - The {@link Worker}
 * @param {Array<string>} ignoredProperties - The properties we should ignore when validating the {@link ReservationDescriptor}
 * @property {string} accountSid - The Sid of the owning Account
 * @property {Date} dateCreated - The date when the {@link Reservation} was created
 * @property {Date} dateUpdated - The date when the {@link Reservation} was last updated
 * @property {string} sid - The Sid of the {@link Reservation}
 * @property {string} status - The current status: ['pending', 'accepted', 'rejected', 'timeout', 'canceled', 'rescinded'] of the {@link Reservation}
 * @property {TaskDescriptor} taskDescriptor - The {@link TaskDescriptor} that describes the Task associated to the {@link Reservation}
 * @property {int} timeout - The number of seconds until the {@link Task} times out
 * @property {string} workerSid - The Sid of the {@link Worker} associated to this {@link Reservation}
 * @property {string} workspaceSid - The Sid of the Workspace owning the {@link Reservation}
 */
export default class ReservationDescriptor {
    constructor(descriptor, worker, ignoredProperties = []) {
        if (!_.isObject(descriptor)) {
            throw new TypeError('Failed to instantiate ReservationDescriptor. <Descriptor>descriptor is required.');
        }

        if (!_.isObject(worker)) {
            throw new TypeError('Failed to instantiate ReservationDescriptor. <Worker>worker is required.');
        }

        const requiredProperties = _.filter(ReservationProperties, p => ignoredProperties.indexOf(p) === -1);
        if (!_.every(requiredProperties, p => p in descriptor)) {
            const missing = _.difference(requiredProperties, Object.keys(descriptor)).join(', ');
            throw new TypeError(`Failed to instantiate ReservationDescriptor. <Descriptor>descriptor does not contain all properties of a Reservation. Missing: ${missing}`);
        }

        this.accountSid = descriptor.account_sid;
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        this.sid = descriptor.sid;
        this.status = descriptor.reservation_status;
        this.timeout = descriptor.reservation_timeout;
        this.workerSid = descriptor.worker_sid;
        this.workspaceSid = descriptor.workspace_sid;
        this.taskDescriptor = null;

        const log = worker.getLogger(`ReservationDescriptor-${this.sid}`);
        // contains a task property, create a TaskDescriptor for it
        if (ignoredProperties.indexOf('task') === -1) {
            try {
                this.taskDescriptor = new TaskDescriptor(descriptor.task);
            } catch (err) {
                log.error('Failed to create a ReservationDescriptor. The \'task\' property is malformed.');
                throw err;
            }
        }
    }
}
