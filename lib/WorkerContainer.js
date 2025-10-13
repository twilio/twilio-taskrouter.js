import WorkerDescriptor from './descriptors/WorkerDescriptor';

/**
 * Construct a {@link WorkerContainer}.
 * @classdesc A {@link WorkerContainer} represents a Worker
 * @param {WorkerDescriptor} descriptor - The {@link WorkerDescriptor} of this {@link WorkerContainer}
 * @property {string} accountSid - The Sid of the owning Account of the {@link Worker}
 * @property {string} activityName - The current {@link Activity} name the {@link Worker} is currently in
 * @property {string} activitySid - The Sid of the {@link Activity} the {@link Worker} is currently in
 * @property {Record<any,any>} attributes - The attributes describing the {@link Worker}
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
 * @property {string} friendlyName - The friendly name of the {@link Worker} */
class WorkerContainer {
    /**
     * @param {WorkerDescriptor} descriptor - The {@link WorkerDescriptor} of this {@link WorkerContainer}
     */
    constructor(descriptor) {
        if (!(descriptor instanceof WorkerDescriptor)) {
            throw new TypeError('Failed to create a WorkerContainer. <WorkerDescriptor>descriptor is a required parameter.');
        }

        Object.assign(this, descriptor);
    }
}

export default WorkerContainer;
