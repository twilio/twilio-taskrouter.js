import _ from 'lodash';
import { ChannelProperties } from '../Channel';
import { parseTime } from '../util/Tools';

/**
 * Construct a {@link WorkerChannelDescriptor} for the given {@link Channel} data representation
 * @class
 * @classdesc A data descriptor of a {@link Channel}
 * @param {Object} descriptor - The data representing a {@link Channel}
 * @property {string} sid - The Sid of the {@link Channel}
 * @property {string} accountSid - The Sid of the owning Account of the {@link Channel}}
 * @property {string} workspaceSid - The Sid of the Workspace the {@link Channel} belongs to
 * @property {string} workerSid - The Sid of the owning {@link Worker}
 * @property {string} taskChannelSid - The Sid of the matching TaskChannel
 * @property {string} taskChannelUniqueName - The friendly name of the matching TaskChannel
 * @property {int} assignedTasks - The number of {@link Task}s assigned to this {@link Channel}
 * @property {boolean} available - Whether this {@link Channel} has capacity to consume more {@link Task}s
 * @property {int} availableCapacityPercentage - The percentage the {@link Channel} has to consume more {@link Task}s
 * @property {int} capacity - The total number of {@link Task}s this {@link Channel} can handle
 * @property {Date} lastReservedTime - The date when the {@link Channel} last saw a Task
 * @property {Date} dateCreated - The date when the {@link Channel} was created
 * @property {Date} dateUpdated - The date when the {@link Channel} was last updated
 */
export default class WorkerChannelDescriptor {
    constructor(descriptor) {
        if (!_.isObject(descriptor)) {
            throw new TypeError('Failed to instantiate WorkerChannelDescriptor. <Descriptor>descriptor is required.');
        }

        if (!ChannelProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to create a WorkerChannelDescriptor. <Descriptor>descriptor does not contain all properties of a Channel.');
        }

        this.accountSid = descriptor.account_sid;
        this.assignedTasks = descriptor.assigned_tasks;
        this.available = !!descriptor.available;
        this.availableCapacityPercentage = descriptor.available_capacity_percentage;
        this.capacity = descriptor.configured_capacity;
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        this.lastReservedTime = parseTime(descriptor.last_reserved_time);   // already in ms
        this.sid = descriptor.sid;
        this.taskChannelSid = descriptor.task_channel_sid;
        this.taskChannelUniqueName = descriptor.task_channel_unique_name;
        this.workerSid = descriptor.worker_sid;
        this.workspaceSid = descriptor.workspace_sid;
    }
}
