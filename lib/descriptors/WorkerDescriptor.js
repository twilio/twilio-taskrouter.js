import isObject from 'lodash/isObject';
import { parseTime } from '../util/Tools';
import { WorkerProperties } from '../Worker';

/**
 * Construct a {@link WorkerDescriptor} for the given {@link Worker} data representation
 * @classdesc A data descriptor of a {@link Worker}
 * @param {Object} descriptor - The data representing a {@link Worker}
 * @property {string} accountSid - The Sid of the owning Account of the {@link Worker}
 * @property {string} activityName - The current {@link Activity} name the {@link Worker} is currently in
 * @property {string} activitySid - The Sid of the {@link Activity} the {@link Worker} is currently in
 * @property {Object} attributes - The attributes describing the {@link Worker}
 * @property {boolean} available - Whether the {@link Worker} is available to take on {@link Task}s
 * @property {Date} dateCreated - The date when the {@link Task} was created
 * @property {Date} dateStatusChanged - The date when the {@link Worker}'s state was last changed
 * @property {Date} dateUpdated - The date when the {@link Task} was last updated
 * @property {string} name - The friendly name of the {@link Worker}
 * @property {string} sid - The Sid of the {@link Worker}
 * @property {string} workspaceSid - The Sid of the Workspace the {@link Worker} belongs to
 * @property {string} version - The version of this {@link Worker}
 * @property {string} workerSid - The Sid of the {@link Worker}
 * @property {string} workerActivitySid - The Sid of the {@link Activity} the {@link Worker} is currently in
 * @property {Date} dateActivityChanged - The date when the {@link Worker}'s state was last changed
 * @property {string} friendlyName - The friendly name of the {@link Worker}
 */
export default class WorkerDescriptor {
    /**
     * @param {Object} descriptor - The data representing a {@link Worker}
     */
    constructor(descriptor) {
        if (!isObject(descriptor)) {
            throw new TypeError('Failed to create a WorkerDescriptor. <Descriptor>descriptor is a required parameter.');
        }

        if (!WorkerProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to create a WorkerDescriptor. The provided <Descriptor>descriptor does not contain all properties of a Worker.');
        }

        /**
         * @type {string}
         */
        this.accountSid = descriptor.account_sid;
        /**
         * @type {string}
         */
        this.activityName = descriptor.activity_name;
        /**
         * @type {string}
         */
        this.activitySid = descriptor.activity_sid;
        /**
         * @type {Object}
         */
        this.attributes = JSON.parse(descriptor.attributes);
        /**
         * @type {boolean}
         */
        this.available = descriptor.available;
        /**
         * @type {Date}
         */
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        /**
         * @type {Date}
         */
        this.dateStatusChanged = parseTime(descriptor.date_status_changed * 1000);
        /**
         * @type {Date}
         */
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        /**
         * @type {string}
         */
        this.name = descriptor.friendly_name;
        /**
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @type {string}
         */
        this.workspaceSid = descriptor.workspace_sid;
        /**
         * @type {string}
         */
        this.version = String(descriptor.version);
        // duplicated fields for sync compatibility
        /**
         * @type {string}
         */
        this.workerSid = descriptor.sid;
        /**
         * @type {string}
         */
        this.workerActivitySid = descriptor.activity_sid;
        /**
         * @type {Date}
         */
        this.dateActivityChanged = parseTime(descriptor.date_status_changed * 1000);
        /**
         * @type {string}
         */
        this.friendlyName = descriptor.friendly_name;
    }
}
