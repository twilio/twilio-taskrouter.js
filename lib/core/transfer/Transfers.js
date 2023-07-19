import _ from 'lodash';
import { EventEmitter } from 'events';
import { taskTransferEventTypes } from '../../util/Constants';
import IncomingTransfer from './IncomingTransfer';
import OutgoingTransfer from './OutgoingTransfer';
import TaskDescriptor from '../../descriptors/TaskDescriptor';
import TransferDescriptor from '../../descriptors/TransferDescriptor';

/**
 * Construct the set of {@link Transfers} relevant to the {@link Worker}.
 * @classdesc {@link Transfers} contains both the {@link IncomingTransfer} and {@link OutgoingTransfer} for the {@link Worker}
 * @extends EventEmitter
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {TaskDescriptor} taskDescriptor - The task descriptor which describes the related {@link Task}
 * @property {IncomingTransfer} incoming - The {@link IncomingTransfer} for the {@link Worker} if the related {@link Reservation} was initiated via transfer by another agent
 * @property {OutgoingTransfer} outgoing - The current active (initiated but not yet finished) {@link OutgoingTransfer} initiated by the {@link Worker} to another agent or queue
 */
class Transfers extends EventEmitter {
    /**
     * @param {import('../../Worker')} worker - The {@link Worker}
     * @param {import('../../util/Request')} request - The {@link Request}
     * @param {TaskDescriptor} taskDescriptor - The task descriptor which describes the related {@link TaskDescriptor}
     */
    constructor(worker, request, taskDescriptor) {
        super();

        if (!(taskDescriptor instanceof TaskDescriptor)) {
            throw new TypeError('Failed to instantiate Transfers. <TaskDescriptor>taskDescriptor is a required parameter.');
        }
        /**
         * @private
         * @type {import('../../util/Logger')}
         */
        this._log = worker.getLogger(`Transfers-${taskDescriptor.sid}`);
        /**
         * @private
         * @type {import('../../Worker')}
         */
        this._worker = worker;
        /**
         * @private
         * @type {import('../../util/Request')}
         */
        this._request = request;
        /**
         * @type {IncomingTransfer}
         */
        this.incoming = taskDescriptor.incomingTransferDescriptor ? new IncomingTransfer(worker, taskDescriptor.incomingTransferDescriptor) : null;
        /**
         * @type {OutgoingTransfer}
         */
        this.outgoing = taskDescriptor.outgoingTransferDescriptor ? new OutgoingTransfer(worker, request, taskDescriptor.sid, taskDescriptor.outgoingTransferDescriptor) : null;
    }

    /**
     * Emit the transfer event and handle any appropriate clean-up or data modification
     * @param {Object} eventType - the name of the transfer event
     * @param {Object} rawEventData - the raw payload contents of the event
     */
    _emitEvent(eventType, rawEventData) {
        this._log.trace(`_emitEvent(${eventType}, ${JSON.stringify(rawEventData)})`);

        if (!_.isString(eventType)) {
            throw new TypeError('Error calling _emitEvent(). <string>eventType is a required parameter.');
        }

        if (!_.isObject(rawEventData)) {
            throw new TypeError('Error calling method _emitEvent(). <object>payload is a required parameter.');
        }

        const eventName = taskTransferEventTypes[eventType];
        if (this.outgoing) {
            // check if the sid of the event matches the sid of the existing outgoing transfer reference
            if (this.outgoing.sid === rawEventData.sid) {
                // update the outgoing transfer when an expected event is received
                if (Object.keys(_.pick(taskTransferEventTypes, ['transfer-attempt-failed', 'transfer-completed', 'transfer-failed', 'transfer-canceled'])).indexOf(eventType) > -1) {
                    this._updateOutgoing(rawEventData);
                    this.outgoing._emitEvent(eventName, rawEventData);
                }
            } else {
                this._log.warn('The transfer %s specified by Event: transfer.%s does not match the current active outgoing transfer for Worker %s. Skipping event.', rawEventData.sid, eventName, this._worker.sid);
            }
        } else {
            this._log.warn('An active outgoing transfer does currently exist in Worker %s transfers map for Event: transfer.%s. Skipping event.', this._worker.sid, eventName);
        }
    }

    /**
     * Update the outgoing transfer object with the latest transfer data
     * @param {Object} latestTransferData The latest raw active transfer data.
     * @param {boolean} overwrite Boolean value to overwrite the object.
     * @private
     */
    _updateOutgoing(latestTransferData, overwrite = false) {
        if (!this.outgoing || overwrite) {
            this.outgoing = new OutgoingTransfer(this._worker, this._request, latestTransferData.task_sid, new TransferDescriptor(latestTransferData));
        } else {
            this.outgoing._update(latestTransferData);
        }
    }

    /**
     * Update Transfers using the latest transfers data
     * @param {Object} latestTransfersData The latest transfers data
     */
    _update(latestTransfersData) {
        if (latestTransfersData.incoming) {
            if (this.incoming) {
                this.incoming._update(latestTransfersData.incoming);
            } else {
                // create the incoming transfer
                const incomingTransferDescriptor = new TransferDescriptor(latestTransfersData.incoming);
                this.incoming = new IncomingTransfer(this._worker, this._request, latestTransfersData.incoming.task_sid, incomingTransferDescriptor);
            }
        }

        if (latestTransfersData.outgoing) {
            if (this.outgoing) {
                this.outgoing._update(latestTransfersData.outgoing);
            } else {
                // create the outgoing transfer
                const outgoingTransferDescriptor = new TransferDescriptor(latestTransfersData.outgoing);
                this.outgoing = new OutgoingTransfer(this._worker, this._request, latestTransfersData.outgoing.task_sid, outgoingTransferDescriptor);
            }
        }
    }
}

export default Transfers;
