import _ from 'lodash';
import { parseTime } from '../util/Tools';
import { WorkerProperties } from '../Worker';

/**
 * Construct a {@link WorkerDescriptor} for the given {@link Worker} data representation
 * @class
 * @classdesc A data descriptor of a {@link Worker}
 * @param {Object} descriptor - The data representing a {@link Worker}
 * @property {string} accountSid - The Sid of the owning Account of the {@link Worker}
 * @property {string} activityName - The current {@link Activity} name the {@link Worker} is currently in
 * @property {string} activitySid - The Sid of the {@link Activity} the {@link Worker} is currently in
 * @property {Object} attributes - The attribtues describing the {@link Worker}
 * @property {boolean} available - Whether or not the {@link Worker} is available to taken on {@link Task}s
 * @property {Date} dateCreated - The date when the {@link Task} was created
 * @property {Date} dateStatusChanged - The date when the {@link Worker}'s state was last changed
 * @property {Date} dateUpdated - The date when the {@link Task} was last updated
 * @property {string} name - The friendly name of the {@link Worker}
 * @property {string} sid - The Sid of the {@link Worker}
 * @property {string} workspaceSid - The Sid of the Workspace the {@link Worker} belongs to
 * @property {string} version - The version of this {@link Worker}
 */
export default class WorkerDescriptor {
    constructor(descriptor, config) {
        if (!_.isObject(descriptor)) {
            throw new TypeError('Failed to create a WorkerDescriptor. <Descriptor>descriptor is a required parameter.');
        }

        if (!_.isObject(config)) {
            throw new TypeError('Failed to create a WorkerDescriptor. <Configuration>config is a required parameter.');
        }

        if (!WorkerProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to create a WorkerDescriptor. The provided <Descriptor>descriptor does not contain all properties of a Worker.');
        }

        this.accountSid = descriptor.account_sid;
        this.activityName = descriptor.activity_name;
        this.activitySid = descriptor.activity_sid;
        this.attributes = JSON.parse(descriptor.attributes);
        this.available = descriptor.available;
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        this.dateStatusChanged = parseTime(descriptor.date_status_changed * 1000);
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        this.name = descriptor.friendly_name;
        this.sid = descriptor.sid;
        this.workspaceSid = descriptor.workspace_sid;
        this.version = String(descriptor.version);
    }
}
