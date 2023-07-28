export const TransferProperties: string[];
export default Transfer;
declare class Transfer extends EventEmitter {
    constructor(worker: typeof import("../../Worker"), descriptor: TransferDescriptor);
    private _log;
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
    _update(latestTransferData: Object): this;
}
import { EventEmitter } from "events";
import TransferDescriptor from "../../descriptors/TransferDescriptor";
