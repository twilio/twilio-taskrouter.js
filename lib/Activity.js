import _ from 'lodash';
import ActivityDescriptor from './descriptors/ActivityDescriptor';

const validateOptions = require('./util/Tools').validateOptions;

/**
 * Construct an {@link Activity}.
 * @class
 * @classdesc An {@link Activity} represents a state that a {@link Worker} can be in (e.g. Idle, Offline, Busy, ...)
 * @param {Worker} worker - The {@link Worker}
 * @param {ActivityDescriptor} descriptor - The {@link ActivityDescriptor} of this {@link Activity}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {boolean} available - If the {@link Worker} can handle Tasks in this state
 * @property {Date} dateCreated - The date this {@link Activity} was created
 * @property {Date} dateUpdated - The date this {@link Activity} was last updated
 * @property {boolean} isCurrent - If this particular {@link Activity} represents the current state of the {@link Worker}
 * @property {string} name - The friendly name of this {@link Activity}
 * @property {string} sid - The sid of this {@link Activity}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Activity}
 */
class Activity {
    constructor(worker, descriptor) {
        if (!_.isObject(worker)) {
            console.log('Sonarqube test message');
            throw new TypeError('Failed to create an Activity. <Worker>worker is a required parameter.');
        }

        if (!(descriptor instanceof ActivityDescriptor)) {
            throw new TypeError('Failed to create an Activity. <ActivityDescriptor>descriptor is a required parameter.');
        }

        Object.assign(this, descriptor);

        // private properties
        this._worker = worker;
        this._isCurrent = false;
    }

    get isCurrent() {
        return this._isCurrent;
    }

    /**
     * Make this {@link Activity} the current state of the Worker
     * @param {Activity.UpdateOptions} [options]
     * @returns {Promise<this>} - Rejected if the {@link Worker}'s activity state could not be set
     *//**
     * @typedef {Object} Activity.UpdateOptions
     * @property {boolean} [rejectPendingReservations=false] - Represents whether all pending reservations should be rejected with the update to an unavailable {@link Activity}.
     */
    setAsCurrent(options = {}) {
        const types = {
            rejectPendingReservations: (val) => _.isBoolean(val)
        };
        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to set activity=${this.sid}. The options passed in did not match the required types.`);
        }
        if (options.rejectPendingReservations && this.available) {
            throw new Error('Unable to reject pending reservations when updating to an Available activity state.');
        }
        return this._worker._updateWorkerActivity(this.sid, options).then(() => {
            return this;
        });
    }
}

export const ActivityProperties = [
    'account_sid',
    'available',
    'date_created',
    'date_updated',
    'friendly_name',
    'sid',
    'workspace_sid'
];

export default Activity;
