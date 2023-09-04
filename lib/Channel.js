import _ from 'lodash';
import { EventEmitter } from 'events';
import WorkerChannelDescriptor from './descriptors/WorkerChannelDescriptor';
import Worker from './Worker';

const fieldsToUpdate = [
    'capacity',
    'available',
    'assignedTasks',
    'availableCapacityPercentage',
    'dateUpdated',
    'lastReservedTime'
];

/**
 * Construct a {@link Channel}.
 * @extends {EventEmitter}
 * @classdesc A {@link Channel} distinguishes {@link Task}s into specific types (e.g. Default, Chat, SMS, Video, Voice)
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {WorkerChannelDescriptor} descriptor - The data descriptor which describes this {@link Channel}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {number} assignedTasks - The number of {@link Task}s assigned to this {@link Channel}
 * @property {boolean} available - If the {@link Worker} should be assigned {@link Task}s of this {@link Channel} type
 * @property {number} availableCapacityPercentage - The current available capacity of this {@link Worker} to handle
 *   {@link Task}s of this {@link Channel} type
 * @property {number} capacity - The number of {@link Task}s that a {@link Worker} can handle of this {@link Channel} type
 * @property {Date} lastReservedTime - The date when the {@link Channel} last saw a Task
 * @property {Date} dateCreated - The date this {@link Channel} was created
 * @property {Date} dateUpdated - The date this {@link Channel} was last updated
 * @property {string} sid - The sid of this {@link Activity}
 * @property {string} taskChannelSid - The sid of the TaskChannel associated to this {@link Worker} {@link Channel}
 * @property {string} taskChannelUniqueName - The friendly name of this {@link Channel}
 * @property {string} workerSid - The sid of the {@link Worker} owning this {@link Channel}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Activity}
 * @fires Channel#capacityUpdated
 * @fires Channel#availabilityUpdated
 */
class Channel extends EventEmitter {
    /**
     * @param {import('./Worker')} worker
     * @param {import('./util/Request')} request
     * @param {WorkerChannelDescriptor} descriptor
     */
    constructor(worker, request, descriptor) {
        super();

        if (!(worker instanceof Worker)) {
            throw new TypeError('Failed to instantiate Worker. <Worker>worker is a required parameter.');
        }

        if (!(descriptor instanceof WorkerChannelDescriptor)) {
            throw new TypeError('Failed to instantiate Channel. <WorkerChannelDescriptor>descriptor is a required parameter.');
        }

        /**
         * @private
         * @type {import('./util/Request')}
         */
        this._request = request;
        /**
         * @private
         * @type {import('./util/Logger')}
         */
        this._log = worker.getLogger(`Channel-${descriptor.sid}`);

        /**
         * @readonly
         * @type {string}
         */
        this.accountSid = descriptor.accountSid;
        /**
         * @readonly
         * @type {number}
         */
        this.assignedTasks = descriptor.assignedTasks;
        /**
         * @readonly
         * @type {boolean}
         */
        this.available = descriptor.available;
        /**
         * @readonly
         * @type {number}
         */
        this.availableCapacityPercentage = descriptor.availableCapacityPercentage;
        /**
         * @readonly
         * @type {number}
         */
        this.capacity = descriptor.capacity;
        /**
         * @readonly
         * @type {Date}
         */
        this.dateCreated = descriptor.dateCreated;
        /**
         * @readonly
         * @type {Date}
         */
        this.dateUpdated = descriptor.dateUpdated;
        /**
         * @readonly
         * @type {Date}
         */
        this.lastReservedTime = descriptor.lastReservedTime;
        /**
         * @readonly
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @readonly
         * @type {string}
         */
        this.taskChannelSid = descriptor.taskChannelSid;
        /**
         * @readonly
         * @type {string}
         */
        this.taskChannelUniqueName = descriptor.taskChannelUniqueName;
        /**
         * @readonly
         * @type {string}
         */
        this.workerSid = descriptor.workerSid;
        /**
         * @readonly
         * @type {string}
         */
        this.workspaceSid = descriptor.workspaceSid;

        Object.assign(this, descriptor);
    }

    /**
     * Emit events from this {@link Channel}
     * @param {string} eventType - The event to emit
     * @param {Object} rawEventData - The eventData associated to the event
     * @private
     */
    _emitEvent(eventType, rawEventData) {
        if (!_.isString(eventType)) {
            throw new TypeError('Error calling _emitEvent(). <string>eventType is a required parameter.');
        }

        if (!_.isObject(rawEventData)) {
            throw new TypeError('Error calling method _emitEvent(). <object>rawEventData is a required parameter.');
        }

        this._update(rawEventData);
        this.emit(eventType, this);
    }

    /**
     * Update this using the latest {@link Channel} data
     * @param {Object} latestChannelData - The raw channel data
     * @private
     */
    _update(latestChannelData) {
        try {
            const updatedChannelDescriptor = new WorkerChannelDescriptor(latestChannelData);
            fieldsToUpdate.forEach(field => {
                this[field] = updatedChannelDescriptor[field];
            });
        } catch (err) {
            this._log.warn('Failed to update Channel sid=%s. Update aborted. Error: %s.', latestChannelData.sid, err);
        }

        return this;
    }
}

/**
 * The capacity of this {@link Channel} was updated
 * @event Channel#capacityUpdated
 * @param {Channel} channel - The {@link Channel} whose capacity was updated
 */

/**
 * The availability of this {@link Channel} was updated
 * @event Channel#availabilityUpdated
 * @param {Channel} channel - The {@link Channel} whose availability was updated
 */

export const ChannelProperties = [
    'account_sid',
    'assigned_tasks',
    'available',
    'available_capacity_percentage',
    'configured_capacity',
    'date_created',
    'date_updated',
    'last_reserved_time',
    'sid',
    'task_channel_sid',
    'task_channel_unique_name',
    'worker_sid',
    'workspace_sid'
];

export default Channel;
