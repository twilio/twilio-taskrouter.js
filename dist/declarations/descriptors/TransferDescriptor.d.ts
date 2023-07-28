export default class TransferDescriptor {
    constructor(descriptor: Object);
    dateCreated: Date;
    dateUpdated: Date;
    mode: string;
    queueSid: string;
    reservationSid: string;
    to: string;
    transferFailedReason: string | null;
    type: string;
    sid: string;
    status: string;
    workerSid: string;
    workflowSid: string;
}
