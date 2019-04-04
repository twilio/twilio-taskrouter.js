import Transfer from './Transfer';
/**
 * Construct an {@link IncomingTransfer}.
 * @class
 * @classdesc An {@link IncomingTransfer} represents the transfer of work for the {@link Worker} via another {@link Worker} or queue
 * @param {Worker} worker - The {@link Worker}
 * @param {TransferDescriptor} transferDescriptor - The transfer descriptor which describes this {@link IncomingTransfer}
 * @property {Date} dateCreated - The timestamp when this {@link IncomingTransfer} was created
 * @property {Date} dateUpdated - The timestamp when this {@link IncomingTransfer} was last updated
 * @property {string} mode - Transfer mode ['WARM', 'COLD']
 * @property {string} reservationSid - The sid of the initiating {@link Reservation}.
 * @property {string} sid - The sid of this {@link IncomingTransfer}
 * @property {string} status - ['INITIATED', 'FAILED', 'COMPLETE', 'CANCELED']
 * @property {string} to - The sid of the {@link Worker} or TaskQueue this {@link IncomingTransfer} is intended for
 * @property {string} type - The transfer type ['QUEUE', 'WORKER']
 * @property {string} workerSid - The sid of the initiating {@link Worker}
 */
class IncomingTransfer extends Transfer {
    constructor(worker, descriptor) {
        super(worker, descriptor);
    }
}

export default IncomingTransfer;
