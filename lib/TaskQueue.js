import TaskQueueDescriptor from './descriptors/TaskQueueDescriptor';

/**
 * Construct an {@link TaskQueue}.
 * @class
 * @classdesc A {@link TaskQueue} represents a set of {@link Task}s awaiting assignment.
 * @param {TaskQueueDescriptor} descriptor - The {@link TaskQueueDescriptor} of this {@link TaskQueue}
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
 * @property {int} maxReservedWorkers - The maximum number of reserved workers for the {@link TaskQueue}
 * @property {string} taskOrder - The task order for the {@link TaskQueue} FIFO or LIFO
 * @property {Date} dateCreated - The date when the {@link TaskQueue} was created
 * @property {Date} dateUpdated - The date when the {@link TaskQueue} was last updated
 */
class TaskQueue {
    constructor(descriptor) {
        if (!(descriptor instanceof TaskQueueDescriptor)) {
            throw new TypeError('Failed to create a TaskQueue. <TaskQueueDescriptor>descriptor is a required parameter.');
        }

        Object.assign(this, descriptor);
    }
}

export const TaskQueueProperties = [
    'friendly_name',
    'reservation_activity_name',
    'assignment_activity_name',
    'target_workers',
    'max_reserved_workers',
    'task_order',
    'reservation_activity_sid',
    'assignment_activity_sid',
    'workspace_sid',
    'account_sid',
    'sid',
    'date_created',
    'date_updated',
    'lifo_queue'
];

export default TaskQueue;
