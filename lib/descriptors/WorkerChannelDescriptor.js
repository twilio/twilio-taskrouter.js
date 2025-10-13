import isObject from 'lodash/isObject';
import { ChannelProperties } from '../Channel';
import { parseTime } from '../util/Tools';

/**
 * Construct a {@link WorkerChannelDescriptor} for the given {@link Channel} data representation
 * @classdesc A data descriptor of a {@link Channel}
 * @param {Object} descriptor - The data representing a {@link Channel}
 * @property {string} accountSid - The Sid of the owning Account of the {@link Channel}}
 * @property {number} assignedTasks - The number of {@link Task}s assigned to this {@link Channel}
 * @property {boolean} available - Whether this {@link Channel} has capacity to consume more {@link Task}s
 * @property {number} availableCapacityPercentage - The percentage the {@link Channel} has to consume more {@link Task}s
 * @property {number} capacity - The total number of {@link Task}s this {@link Channel} can handle
 * @property {Date} dateCreated - The date when the {@link Channel} was created
 * @property {Date} dateUpdated - The date when the {@link Channel} was last updated
 * @property {Date} lastReservedTime - The date when the {@link Channel} last saw a Task
 * @property {string} sid - The Sid of the {@link Channel}
 * @property {string} taskChannelSid - The Sid of the matching TaskChannel
 * @property {string} taskChannelUniqueName - The friendly name of the matching TaskChannel
 * @property {string} workerSid - The Sid of the owning {@link Worker}
 * @property {string} workspaceSid - The Sid of the Workspace the {@link Channel} belongs to
 */
export default class WorkerChannelDescriptor {
    /**
     * @param {Object} descriptor - The data representing a {@link Channel}
     */
    constructor(descriptor) {
        if (!isObject(descriptor)) {
            throw new TypeError('Failed to instantiate WorkerChannelDescriptor. <Descriptor>descriptor is required.');
        }

        if (!ChannelProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to create a WorkerChannelDescriptor. <Descriptor>descriptor does not contain all properties of a Channel.');
        }

        /**
         * @type {string}
         */
        this.accountSid = descriptor.account_sid;
        /**
         * @type {number}
         */
        this.assignedTasks = descriptor.assigned_tasks;
        /**
         * @type {boolean}
         */
        this.available = !!descriptor.available;
        /**
         * @type {number}
         */
        this.availableCapacityPercentage = descriptor.available_capacity_percentage;
        /**
         * @type {number}
         */
        this.capacity = descriptor.configured_capacity;
        /**
         * @type {Date}
         */
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        /**
         * @type {Date}
         */
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        /**
         * @type {Date}
         */
        this.lastReservedTime = parseTime(descriptor.last_reserved_time);   // already in ms
        /**
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @type {string}
         */
        this.taskChannelSid = descriptor.task_channel_sid;
        /**
         * @type {string}
         */
        this.taskChannelUniqueName = descriptor.task_channel_unique_name;
        /**
         * @type {string}
         */
        this.workerSid = descriptor.worker_sid;
        /**
         * @type {string}
         */
        this.workspaceSid = descriptor.workspace_sid;
    }
}
