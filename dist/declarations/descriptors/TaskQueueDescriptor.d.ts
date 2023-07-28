export default class TaskQueueDescriptor {
    constructor(descriptor: Object);
    sid: string;
    queueSid: string;
    accountSid: string;
    workspaceSid: string;
    name: string;
    queueName: string;
    assignmentActivityName: string;
    reservationActivityName: string;
    assignmentActivitySid: string;
    reservationActivitySid: string;
    targetWorkers: string;
    maxReservedWorkers: number;
    taskOrder: string;
    dateCreated: Date;
    dateUpdated: Date;
}
