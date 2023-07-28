export default Transfers;
declare class Transfers extends EventEmitter {
    constructor(worker: typeof import("../../Worker"), request: typeof import("../../util/Request"), taskDescriptor: TaskDescriptor);
    private _log;
    private _worker;
    private _request;
    incoming: IncomingTransfer;
    outgoing: OutgoingTransfer;
    _emitEvent(eventType: Object, rawEventData: Object): void;
    private _updateOutgoing;
    _update(latestTransfersData: Object): void;
}
import { EventEmitter } from "events";
import IncomingTransfer from "./IncomingTransfer";
import OutgoingTransfer from "./OutgoingTransfer";
import TaskDescriptor from "../../descriptors/TaskDescriptor";
