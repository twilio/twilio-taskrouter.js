import WorkerDescriptor from './descriptors/WorkerDescriptor';

/**
 * Construct a {@link WorkerContainer}.
 * @class
 * @classdesc A {@link WorkerContainer} represents a Worker
 * @param {WorkerDescriptor} descriptor - The {@link WorkerDescriptor} of this {@link WorkerContainer}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {boolean} activityName - the activity name
 * @property {Date} activitySid - the activity sid
 * @property {Date} attributes - the attributes of the worker
 * @property {boolean} available - whether the worker is currently available
 * @property {string} name - The friendly name of this {@link WorkerContainer}
 * @property {string} sid - The sid of this {@link WorkerContainer}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link WorkerContainer}
 */
class WorkerContainer {
    constructor(descriptor) {
        if (!(descriptor instanceof WorkerDescriptor)) {
            throw new TypeError('Failed to create a WorkerContainer. <WorkerDescriptor>descriptor is a required parameter.');
        }

        Object.assign(this, descriptor);
    }
}

export default WorkerContainer;
