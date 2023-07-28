export default class TaskDescriptor {
    constructor(descriptor: Object);
    addOns: Object;
    age: number;
    attributes: Object;
    dateCreated: Date;
    dateUpdated: Date;
    priority: number;
    queueName: string;
    queueSid: string;
    reason: string;
    routingTarget: string;
    sid: string;
    status: string;
    taskChannelUniqueName: string;
    taskChannelSid: string;
    timeout: number;
    workflowName: string;
    workflowSid: string;
    incomingTransferDescriptor: typeof import("./TransferDescriptor") | null;
    outgoingTransferDescriptor: typeof import("./TransferDescriptor") | null;
    version: string;
}
