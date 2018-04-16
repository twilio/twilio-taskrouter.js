import _ from 'lodash';
import Configuration from './util/Configuration';
import { EventEmitter } from 'events';
import Logger from './util/Logger';
import WorkerChannelDescriptor from './descriptors/WorkerChannelDescriptor';

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
 * @class
 * @classdesc A {@link Channel} distinguishes Tasks into specific types (e.g. Default, Chat, SMS, Video, Voice)
 * @param {Configuration} config - The {@link Configuration} of the {@link Worker}
 * @param {WorkerChannelDescriptor} descriptor - The data descriptor which describes this {@link Channel}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {int} assignedTasks - The number of {@link Task}s assigned to this {@link Channel}
 * @property {boolean} available - If the {@link Worker} should be assigned {@link Task}s of this {@link Channel} type
 * @property {int} availableCapacityPercentage - The current available capacity of this {@link Worker} to handle
 *   {@link Task}s of this {@link Channel} type
 * @property {int} capacity - The number of {@link Task}s that a {@link Worker} can handle of this {@link Channel} type
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
    constructor(config, request, descriptor) {
        super();

        if (!(config instanceof Configuration)) {
            throw new TypeError('Failed to instantiate Channel. <Configuration>config is a required parameter.');
        }

        if (!(descriptor instanceof WorkerChannelDescriptor)) {
            throw new TypeError('Failed to instantiate Channel. <WorkerChannelDescriptor>descriptor is a required parameter.');
        }

        this._config = config;
        this._request = request;
        this._log = new Logger(`Channel-${descriptor.sid}`, config._logLevel);
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
