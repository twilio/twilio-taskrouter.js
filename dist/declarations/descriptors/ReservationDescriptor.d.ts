export default class ReservationDescriptor {
    constructor(descriptor: Object, worker: typeof import("../Worker"), ignoredProperties?: Array<string>);
    accountSid: string;
    dateCreated: Date;
    dateUpdated: Date;
    sid: string;
    status: string;
    timeout: number;
    workerSid: string;
    workspaceSid: string;
    taskDescriptor: TaskDescriptor | null;
    transferDescriptor: TransferDescriptor | null;
    version: string;
    canceledReasonCode: number | null;
}
import TaskDescriptor from "./TaskDescriptor";
import TransferDescriptor from "./TransferDescriptor";
