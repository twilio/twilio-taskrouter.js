import IncomingTransfer from './IncomingTransfer';
import OutgoingTransfer from './OutgoingTransfer';
import TaskDescriptor from '../../descriptors/TaskDescriptor';
import TransferDescriptor from '../../descriptors/TransferDescriptor';

/**
 * Construct the set of {@link Transfers} relevant to the {@link Worker}.
 * @class
 * @classdesc {@link Transfers} contains both the {@link IncomingTransfer} and {@link OutgoingTransfer} for the {@link Worker}
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {TaskDescriptor} taskDescriptor - The task descriptor which describes the related {@link Task}
 * @property {IncomingTransfer} incoming - The {@link IncomingTransfer} for the {@link Worker} if the related {@link Reservation} was initiated via transfer by another agent
 * @property {OutgoingTransfer} outgoing - The current active {@link OutgoingTransfer} initiated by the {@link Worker} to another agent or queue
 */
class Transfers {
    constructor(worker, request, taskDescriptor) {
        if (!(taskDescriptor instanceof TaskDescriptor)) {
            throw new TypeError('Failed to instantiate Transfers. <TaskDescriptor>taskDescriptor is a required parameter.');
        }
        this._log = worker.getLogger(`Task-${taskDescriptor.sid}`);
        this._worker = worker;
        this._request = request;
        this.incoming = taskDescriptor.incomingTransferDescriptor ? new IncomingTransfer(worker, taskDescriptor.incomingTransferDescriptor) : null;
        this.outgoing = taskDescriptor.outgoingTransferDescriptor ? new OutgoingTransfer(worker, request, taskDescriptor.sid, taskDescriptor.outgoingTransferDescriptor) : null;
    }

    /**
     * Update the outgoing transfer object with the latest transfer data.
     * @param latestTransferData The latest raw transfer data.
     * @param overwrite Boolean value to overwrite the object.
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
     * @param latestTransfersData The latest transfers data
     * @private
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
