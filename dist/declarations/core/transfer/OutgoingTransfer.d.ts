export default OutgoingTransfer;
declare class OutgoingTransfer extends Transfer {
    constructor(worker: typeof import("../../Worker"), request: typeof import("../../util/Request"), taskSid: string, descriptor: typeof import("../../descriptors/TransferDescriptor"));
    private _worker;
    private _request;
    taskSid: string;
    private _emitEvent;
    public cancel(): Promise<OutgoingTransfer>;
}
import Transfer from "./Transfer";
