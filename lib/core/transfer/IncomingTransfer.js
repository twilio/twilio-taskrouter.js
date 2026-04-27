import Transfer from './Transfer';

/**
 * Construct an {@link IncomingTransfer}.
 * @classdesc An {@link IncomingTransfer} represents the transfer of work for the {@link Worker} via another {@link Worker} or queue
 * @extends Transfer
 * @param {Worker} worker - The {@link Worker}
 * @param {TransferDescriptor} transferDescriptor - The transfer descriptor which describes this {@link IncomingTransfer}
 * @property {Date} dateCreated - The timestamp when this {@link Transfer} was created
 * @property {Date} dateUpdated - The timestamp when this {@link Transfer} was last updated
 * @property {string} mode - Transfer mode ['WARM', 'COLD']
 * @property {string} queueSid - The Sid of the TaskQueue the {@link Task} belongs to
 * @property {string} reservationSid - The Sid of the initiating {@link Reservation}.
 * @property {string} to - The sid of the {@link Worker} or TaskQueue this {@link Transfer} is intended for
 * @property {string} [transferFailedReason] - The reason, if applicable, for why a transfer failed
 * @property {string} type - The transfer type ['QUEUE', 'WORKER']
 * @property {string} sid - The sid of this {@link Transfer}
 * @property {string} status - ['INITIATED', 'FAILED', 'COMPLETED', 'CANCELED']
 * @property {string} workerSid - The sid of the initiating {@link Worker}
 * @property {string} workflowSid - The Sid of the Workflow the {@link Task} was created against
 */
class IncomingTransfer extends Transfer {
    /**
     * @param {import('../../Worker')} worker - The {@link Worker}
     * @param {import('../../descriptors/TransferDescriptor')} descriptor - The transfer descriptor which describes this {@link TransferDescriptor}
     */
    constructor(worker, descriptor) {
        super(worker, descriptor);
    }
}

export default IncomingTransfer;
