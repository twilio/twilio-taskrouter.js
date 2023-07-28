export default class WorkerChannelDescriptor {
    constructor(descriptor: Object);
    accountSid: string;
    assignedTasks: number;
    available: boolean;
    availableCapacityPercentage: number;
    capacity: number;
    dateCreated: Date;
    dateUpdated: Date;
    lastReservedTime: Date;
    sid: string;
    taskChannelSid: string;
    taskChannelUniqueName: string;
    workerSid: string;
    workspaceSid: string;
}
