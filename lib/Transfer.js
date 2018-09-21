import TransferDescriptor from './descriptors/TransferDescriptor';

const fieldsToUpdate = [
    'dateUpdated',
    'status',
];

/**
 * Construct a {@link Transfer}.
 * @class
 * @param {TransferDescriptor} descriptor - The data descriptor which describes this {@link Transfer}
 * @extends {TransferDescriptor}
 */
class Transfer {
    constructor(worker, descriptor) {
        if (!(descriptor instanceof TransferDescriptor)) {
            throw new TypeError('Failed to instantiate Transfer. <TransferDescriptor>descriptor is a required parameter.');
        }

        this._log = worker.getLogger(`Task-${descriptor.sid}`);

        Object.assign(this, descriptor);
    }


    /**
     * Update this using the latest {@link Transfer} data
     * @param {Object} latestTransferData - The raw {@link Transfer} data
     * @private
     */
    _update(latestTransferData) {
        try {
            const updatedTransferDescriptor = new TransferDescriptor(latestTransferData);
            fieldsToUpdate.forEach(field => {
                this[field] = updatedTransferDescriptor[field];
            });
        } catch (err) {
            this._log.error(`Failed to update Transfer sid=${latestTransferData.sid}. Update aborted.`, err);
            throw new Error(`Failed to update Transfer sid=${latestTransferData.sid}. Update aborted. Error: ${err}.`);
        }

        return this;
    }
}

export const TransferProperties = [
    'date_created',
    'date_updated',
    'initiating_reservation_sid',
    'initiating_worker_sid',
    'sid',
    'transfer_mode',
    'transfer_to',
    'transfer_type',
    'transfer_status',
];

export default Transfer;
