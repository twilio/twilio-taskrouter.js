import TransferDescriptor from './descriptors/TransferDescriptor';

/**
 * Construct a {@link Transfer}.
 * @class
 * @param {TransferDescriptor} descriptor - The data descriptor which describes this {@link Transfer}
 * @extends {TransferDescriptor}
 */
class Transfer {
    constructor(descriptor) {
        if (!(descriptor instanceof TransferDescriptor)) {
            throw new TypeError('Failed to instantiate Transfer. <TransferDescriptor>descriptor is a required parameter.');
        }

        Object.assign(this, descriptor);
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
