import _ from 'lodash';
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
     * Emit events from this {@link OutgoingTransfer}
     * @param {string} eventType - The event to emit
     * @param {Object} rawEventData - The eventData associated to the event
     * @private
     */
    _emitEvent(eventType, rawEventData) {
        this._log.trace(`_emitEvent(${eventType}, ${JSON.stringify(rawEventData)})`);

        if (!_.isString(eventType)) {
            throw new TypeError('Error calling _emitEvent(). <string>eventType is a required parameter.');
        }

        if (!_.isObject(rawEventData)) {
            throw new TypeError('Error calling method _emitEvent(). <object>payload is a required parameter.');
        }

        this.emit(eventType, this);
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

/**
 * The attempt to transfer the {@link Task} to the desired entity failed
 * @event OutgoingTransfer#attemptFailed
 * @param {OutgoingTransfer} outgoingTransfer - The {@link OutgoingTransfer} that had an attempt failure
 */

 /**
 * The {@link Task}'s current {@link OutgoingTransfer} has successfully been cancelled
 * @event OutgoingTransfer#canceled
 * @param {OutgoingTransfer} outgoingTransfer - The {@link OutgoingTransfer} that was canceled
 */

/**
 * The {@link OutgoingTransfer} has successfully been transferred to the desired entity
 * @event OutgoingTransfer#completed
 * @param {OutgoingTransfer} outgoingTransfer - The {@link OutgoingTransfer} that was completed
 */

/**
 * All attempts to transfer the {@link Task} to the desired entity have failed.
 * No more attempts on the {@link OutgoingTransfer} will be made.
 * @event OutgoingTransfer#failed
 * @param {OutgoingTransfer} outgoingTransfer - The {@link OutgoingTransfer} that has failed
 */
