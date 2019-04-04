import Transfer from './Transfer';
import { API_V2, TRANSFER_STATUS } from '../../util/Constants';
import { TASK_TRANSFER_INSTANCE } from '../../util/Routes';

/**
 * Construct a {@link OutgoingTransfer}.
 * @class
 * @classdesc An {@link OutgoingTransfer} represents the currently active outgoing transfer initiated by the {@link Worker} to another {@link Worker} or queue
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {string} taskSid - The sid of the owning {@link Task}
 * @param {TransferDescriptor} transferDescriptor - The transfer descriptor which describes this {@link OutgoingTransfer}
 * @property {Date} dateCreated - The timestamp when this {@link OutgoingTransfer} was created
 * @property {Date} dateUpdated - The timestamp when this {@link OutgoingTransfer} was last updated
 * @property {string} mode - Transfer mode ['WARM', 'COLD']
 * @property {string} reservationSid - The sid of the initiating {@link Reservation}.
 * @property {string} sid - The sid of this {@link OutgoingTransfer}
 * @property {string} status - ['INITIATED', 'FAILED', 'COMPLETED', 'CANCELED']
 * @property {string} to - The sid of the {@link Worker} or TaskQueue this {@link OutgoingTransfer} is intended for
 * @property {string} type - The transfer type ['QUEUE', 'WORKER']
 * @property {string} workerSid - The sid of the initiating {@link Worker}
 */
class OutgoingTransfer extends Transfer {
    constructor(worker, request, taskSid, descriptor) {
        super(worker, descriptor);

        if (typeof taskSid !== 'string') {
            throw new TypeError('Failed to instantiate OutgoingTransfer. <string>taskSid is a required parameter.');
        }

        this._worker = worker;
        this._request = request;
        this.taskSid = taskSid;
    }

    /**
     * Cancel the ongoing {@link OutgoingTransfer}
     * @return {Promise<this>} - Rejected if the {@link OutgoingTransfer} state could not be updated to 'canceled'
     */
    async cancel() {
        const requestURL = this._worker.getRoutes().getRoute(TASK_TRANSFER_INSTANCE, this.sid).path;
        const requestParams = {
            TaskSid: this.taskSid,
            TransferStatus: TRANSFER_STATUS.canceled,
        };

        const canceledTransferResponse = await this._request.post(requestURL, requestParams, API_V2);
        return this._update(canceledTransferResponse);
    }
}

export default OutgoingTransfer;
