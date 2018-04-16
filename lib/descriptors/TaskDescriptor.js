import _ from 'lodash';
import { parseTime } from '../util/Tools';
import { TaskProperties } from '../Task';

/**
 * Construct a {@link TaskDescriptor} for the given {@link Task} data representation
 * @class
 * @classdesc A data descriptor of a {@link Task}
 * @param {Object} descriptor - The data representing a {@link Task}
 * @property {Object} addOns - The addons attached to the {@link Task}
 * @property {number} age - The age of the {@link Task} in seconds
 * @property {Object} attributes - The attributes describing the {@link Task}
 * @property {Date} dateCreated - The date when the {@link Task} was created
 * @property {Date} dateUpdated - The date when the {@link Task} was last updated
 * @property {number} priority - The priority ranking given to the {@link Task}
 * @property {string} queueName - The friendly name of the TaskQueue the {@link Task} belongs to
 * @property {string} queueSid - The Sid of the TaskQueue the {@link Task} belongs to
 * @property {string} reason - The reason that describes why the {@link Task} moved to status=['canceled', 'completed']
 * @property {string} sid - The Sid of the {@link Task}
 * @property {string} status - The current assignment status=['pending', 'reserved', 'assigned', 'canceled', 'completed', 'wrapping']
 * @property {string} taskChannelUniqueName - The friendly name of the TaskChannel the {@link Task} was created against
 * @property {string} taskChannelSid - The Sid of the TaskChannel the {@link Task} was created against
 * @property {number} timeout - The timeout configured on a {@link Task}
 * @property {string} workflowName - The friendly name of the Workflow the {@link Task} was created against
 * @property {string} workflowSid - The Sid of the Workflow the {@link Task} was created against
 */
export default class TaskDescriptor {
    constructor(descriptor, config) {
        if (!_.isObject(descriptor)) {
            throw new TypeError('Failed to instantiate TaskDescriptor. <Descriptor>descriptor is required.');
        }

        if (!_.isObject(config)) {
            throw new TypeError('Failed to instantiate TaskDescriptor. <Configuration>config is required.');
        }

        if (!TaskProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to instantiate TaskDescriptor. <Descriptor>descriptor does not contain all properties of a Task.');
        }

        this.addOns = JSON.parse(descriptor.addons);
        this.age = descriptor.age;
        this.attributes = JSON.parse(descriptor.attributes);
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        this.priority = descriptor.priority;
        this.queueName = descriptor.queue_name;
        this.queueSid = descriptor.queue_sid;
        this.reason = descriptor.reason;
        this.sid = descriptor.sid;
        this.status = descriptor.assignment_status;
        this.taskChannelUniqueName = descriptor.task_channel_unique_name;
        this.taskChannelSid = descriptor.task_channel_sid;
        this.timeout = descriptor.timeout;
        this.workflowName = descriptor.workflow_name;
        this.workflowSid = descriptor.workflow_sid;
    }
}
