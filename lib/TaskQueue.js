import TaskQueueDescriptor from './descriptors/TaskQueueDescriptor';

/**
 * Construct an {@link WorkerContainer}.
 * @class
 * @classdesc An {@link WorkerContainer} represents a Worker
 * @param {WorkerDescriptor} worker - The {@link WorkerDescriptor} of this {@link WorkerContainer}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {boolean} activityName - the activity name
 * @property {Date} activitySid - the activity sid
 * @property {Date} attributes - the attributes of the worker
 * @property {boolean} available - whether the worker is currently available
 * @property {string} name - The friendly name of this {@link WorkerContainer}
 * @property {string} sid - The sid of this {@link WorkerContainer}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link WorkerContainer}
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
