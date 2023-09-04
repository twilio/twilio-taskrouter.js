import _ from 'lodash';
import ActivityDescriptor from './descriptors/ActivityDescriptor';

const validateOptions = require('./util/Tools').validateOptions;

/**
 * @typedef {Object} ActivityUpdateOptions
 * @property {boolean} [rejectPendingReservations=false] - Represents whether all pending reservations should be rejected with the update to an unavailable {@link Activity}.
 */

/**
 * Construct an {@link Activity}.
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
    /**
     * @param {import('./Worker')} worker
     * @param {ActivityDescriptor} descriptor
     */
    constructor(worker, descriptor) {
        if (!_.isObject(worker)) {
            throw new TypeError('Failed to create an Activity. <Worker>worker is a required parameter.');
        }

        if (!(descriptor instanceof ActivityDescriptor)) {
            throw new TypeError('Failed to create an Activity. <ActivityDescriptor>descriptor is a required parameter.');
        }

        /**
         * @readonly
         * @type {string}
         */
        this.accountSid = descriptor.accountSid;
        /**
         * @readonly
         * @type {boolean}
         */
        this.available = descriptor.available;
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
         * @type {string}
         */
        this.name = descriptor.name;
        /**
         * @readonly
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @readonly
         * @type {string}
         */
        this.workspaceSid = descriptor.workspaceSid;

        Object.assign(this, descriptor);

        /**
         * @private
         * @type {import('./Worker')} worker
         */
        this._worker = worker;
        /**
         * @type {boolean}
         * @private
         */
        this._isCurrent = false;
    }

    /**
     * @return {boolean}
     */
    get isCurrent() {
        return this._isCurrent;
    }

    /**
     * Make this {@link Activity} the current state of the Worker
     * @param {ActivityUpdateOptions} [options]
     * @returns {Promise<this>} - Rejected if the {@link Worker}'s activity state could not be set
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
