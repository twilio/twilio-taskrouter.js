import _ from 'lodash';
import { ActivityProperties } from '../Activity';
import { parseTime } from '../util/Tools';

/**
 * Construct an {@link ActivityDescriptor} for the given {@link Activity} data representation
 * @class
 * @classdesc A data descriptor of an {@link Activity}
 * @param {Object} descriptor - The data representing an {@link Activity}
 * @property {string} accountSid - The Sid of the owning Account
 * @property {boolean} available - Whether or not the {@link Activity} is in an available state
 * @property {Date} dateCreated - The date when the {@link Activity} was created
 * @property {Date} dateUpdated - The date when the {@link Activity} was updated
 * @property {string} name - The friendly name of the {@link Activity}
 * @property {string} sid - The Sid of the {@link Activity}
 * @property {string} workspaceSid - The Sid of the Workspace owning the {@link Activity}
 */
export default class ActivityDescriptor {
    constructor(descriptor) {
        if (!_.isObject(descriptor)) {
            throw new TypeError('Failed to instantiate ActivityDescriptor. <Descriptor>descriptor is required.');
        }

        if (!ActivityProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to instantiate ActivityDescriptor. <Descriptor>descriptor does not contain all properties of an Activity.');
        }

        this.accountSid = descriptor.account_sid;
        this.available = descriptor.available;
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        this.name = descriptor.friendly_name;
        this.sid = descriptor.sid;
        this.workspaceSid = descriptor.workspace_sid;
    }
}
