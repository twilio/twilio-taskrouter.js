export default IncomingTransfer;
declare class IncomingTransfer extends Transfer {
    constructor(worker: typeof import("../../Worker"), descriptor: typeof import("../../descriptors/TransferDescriptor"));
}
import Transfer from "./Transfer";
