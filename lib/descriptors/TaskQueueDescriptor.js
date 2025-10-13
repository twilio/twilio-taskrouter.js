import isObject from 'lodash/isObject';
import { parseTime } from '../util/Tools';
import { TaskQueueProperties } from '../TaskQueue';

/**
 * Construct a {@link TaskQueueDescriptor} for the given {@link TaskQueue} data representation
 * @classdesc A data descriptor of a {@link TaskQueue}
 * @param {Object} descriptor - The data representing a {@link TaskQueue}
 * @property {string} sid - The Sid of the {@link TaskQueue}
 * @property {string} queueSid - The Sid of the {@link TaskQueue}
 * @property {string} accountSid - The Sid of the owning Account of the {@link TaskQueue}}
 * @property {string} workspaceSid - The Sid of the Workspace the {@link TaskQueue} belongs to
 * @property {string} name - The friendly name of the {@link TaskQueue}
 * @property {string} queueName - The friendly name of the {@link TaskQueue}
 * @property {string} assignmentActivityName - The {@link Activity} name for the reservation of the {@link TaskQueue}
 * @property {string} reservationActivityName - The {@link Activity} name for the assignment of the {@link TaskQueue}
 * @property {string} assignmentActivitySid - The Sid of the assignment {@link Activity} for the {@link TaskQueue}
 * @property {string} reservationActivitySid - The Sid of the reservation {@link Activity} for the {@link TaskQueue}
 * @property {string} targetWorkers - The expression used to target workers
 * @property {number} maxReservedWorkers - The maximum number of reserved workers for the {@link TaskQueue}
 * @property {string} taskOrder - The task order for the {@link TaskQueue} FIFO or LIFO
 * @property {Date} dateCreated - The date when the {@link TaskQueue} was created
 * @property {Date} dateUpdated - The date when the {@link TaskQueue} was last updated
 */
export default class TaskQueueDescriptor {
    /**
     * @param {Object} descriptor - The data representing a {@link TaskQueue}
     */
    constructor(descriptor) {
        if (!isObject(descriptor)) {
            throw new TypeError('Failed to instantiate TaskQueueDescriptor. <Descriptor>descriptor is required.');
        }

        if (!TaskQueueProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to instantiate TaskQueueDescriptor. <Descriptor>descriptor does not contain all properties of a TaskQueue.');
        }

        /**
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @type {string}
         */
        this.queueSid = descriptor.sid;
        /**
         * @type {string}
         */
        this.accountSid = descriptor.account_sid;
        /**
         * @type {string}
         */
        this.workspaceSid = descriptor.workspace_sid;
        /**
         * @type {string}
         */
        this.name = descriptor.friendly_name;
        /**
         * @type {string}
         */
        this.queueName = descriptor.friendly_name;
        /**
         * @type {string}
         */
        this.assignmentActivityName = descriptor.assignment_activity_name;
        /**
         * @type {string}
         */
        this.reservationActivityName = descriptor.reservation_activity_name;
        /**
         * @type {string}
         */
        this.assignmentActivitySid = descriptor.assignment_activity_sid;
        /**
         * @type {string}
         */
        this.reservationActivitySid = descriptor.reservation_activity_sid;
        /**
         * @type {string}
         */
        this.targetWorkers = descriptor.target_workers;
        /**
         * @type {number}
         */
        this.maxReservedWorkers = descriptor.max_reserved_workers;
        /**
         * @type {string}
         */
        this.taskOrder = descriptor.task_order;
        /**
         * @type {Date}
         */
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        /**
         * @type {Date}
         */
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
    }
}
