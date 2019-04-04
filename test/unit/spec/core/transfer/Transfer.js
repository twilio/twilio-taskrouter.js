import AssertionUtils from '../../../../util/AssertionUtils';
import * as chai from 'chai';
import { acceptedReservationWithIncomingAndActiveOutgoingTransfer as mockIncomingInstance } from '../../../../mock/Reservations';
import IncomingTransfer from '../../../../../lib/core/transfer/IncomingTransfer';
import TransferDescriptor from '../../../../../lib/descriptors/TransferDescriptor';
import { TRANSFER_STATUS } from '../../../../../lib/util/Constants';
import Worker from '../../../../../lib/Worker';
import { token } from '../../../../mock/Token';
import { WorkerConfig } from '../../../../mock/WorkerConfig';
const assert = chai.assert;

describe('Transfer', () => {
    const worker = new Worker(token, WorkerConfig);
    const incomingTransferInstance = mockIncomingInstance.task_transfer;
    const incomingTransferDescriptor = new TransferDescriptor(incomingTransferInstance);

    describe('constructor', () => {
        it('should throw an error if transfer descriptor data is missing', () => {
            (() => {
                new IncomingTransfer(worker, null);
            }).should.throw(/descriptor is a required parameter/);
        });

        it('should set Transfer properties', () => {
            const incomingTransfer = new IncomingTransfer(worker, incomingTransferDescriptor);
            AssertionUtils.assertTransfer(incomingTransfer, incomingTransferInstance);
        });
    });

    describe('#_update', () => {
          let transfer;
          beforeEach(() => {
              transfer = new IncomingTransfer(worker, incomingTransferDescriptor);
          });

          it('should update the Transfer object', () => {
              const updatedTransferInstance = Object.create(mockIncomingInstance.task_transfer);
              /* eslint-disable camelcase */
              updatedTransferInstance.transfer_status = TRANSFER_STATUS.failed;
              /* eslint-enable camelcase */
              const result = transfer._update(updatedTransferInstance);
              assert.equal(result.status, TRANSFER_STATUS.failed);
          });
    });
});
