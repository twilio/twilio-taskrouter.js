import _ from 'lodash';
import { parseTime } from '../util/Tools';
import { TaskQueueProperties } from '../TaskQueue';

/**
 * Construct a {@link TaskQueueDescriptor} for the given {@link TaskQueue} data representation
 * @class
 * @classdesc A data descriptor of a {@link TaskQueue}
 * @param {Object} descriptor - The data representing a {@link TaskQueue}
 * @property {string} sid - The Sid of the {@link TaskQueue}
 * @property {string} accountSid - The Sid of the owning Account of the {@link TaskQueue}}
 * @property {string} workspaceSid - The Sid of the Workspace the {@link TaskQueue} belongs to
 * @property {string} name - The friendly name of the {@link TaskQueue}
 * @property {string} assignmentActivityName - The {@link Activity} name for the reservation of the {@link TaskQueue}
 * @property {string} reservationActivityName - The {@link Activity} name for the assignment of the {@link TaskQueue}
 * @property {string} assignmentActivitySid - The Sid of the assignment {@link Activity} for the {@link TaskQueue}
 * @property {string} reservationActivitySid - The Sid of the reservation {@link Activity} for the {@link TaskQueue}
 * @property {string} targetWorkers - The expression used to target workers
 * @property {int} maxReservedWorkers - The maximum number of reserved workers for the {@link TaskQueue}
 * @property {string} taskOrder - The task order for the {@link TaskQueue} FIFO or LIFO
 * @property {Date} dateCreated - The date when the {@link TaskQueue} was created
 * @property {Date} dateUpdated - The date when the {@link TaskQueue} was last updated
 */
export default class TaskQueueDescriptor {
    constructor(descriptor) {
        if (!_.isObject(descriptor)) {
            throw new TypeError('Failed to instantiate TaskQueueDescriptor. <Descriptor>descriptor is required.');
        }

        if (!TaskQueueProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to instantiate TaskQueueDescriptor. <Descriptor>descriptor does not contain all properties of a TaskQueue.');
        }

        this.sid = descriptor.sid;
        this.accountSid = descriptor.account_sid;
        this.workspaceSid = descriptor.workspace_sid;
        this.name = descriptor.friendly_name;
        this.assignmentActivityName = descriptor.assignment_activity_name;
        this.reservationActivityName = descriptor.reservation_activity_name;
        this.assignmentActivitySid = descriptor.assignment_activity_sid;
        this.reservationActivitySid = descriptor.reservation_activity_sid;
        this.targetWorkers = descriptor.target_workers;
        this.maxReservedWorkers = descriptor.max_reserved_workers;
        this.taskOrder = descriptor.task_order;
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
    }
}
