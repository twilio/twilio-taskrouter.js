import AssertionUtils from '../../../../util/AssertionUtils';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { acceptedReservationWithActiveOutgoingTransfer as mockOutgoingInstance } from '../../../../mock/Reservations';
import { canceledTaskTransfer } from '../../../../mock/Transfers';
import { API_V2, TRANSFER_STATUS } from '../../../../../lib/util/Constants';
import Request from '../../../../../lib/util/Request';
import Configuration from '../../../../../lib/util/Configuration';
import OutgoingTransfer from '../../../../../lib/core/transfer/OutgoingTransfer';
import Routes from '../../../../../lib/util/Routes';
import { token } from '../../../../mock/Token';
import TransferDescriptor from '../../../../../lib/descriptors/TransferDescriptor';
import Worker from '../../../../../lib/Worker';
import { WorkerConfig } from '../../../../mock/WorkerConfig';
const assert = chai.assert;

describe('OutgoingTransfer', () => {
    const config = new Configuration(token);
    const worker = new Worker(token, WorkerConfig);
    const taskSid = 'WTxxx';
    const workspaceSid = 'WSxxx';
    const workerSid = 'WKxxx';
    const routes = new Routes(workspaceSid, workerSid);
    let sandbox;
    const outgoingTransferInstance = mockOutgoingInstance.active_outgoing_task_transfer;
    const outgoingTransferDescriptor = new TransferDescriptor(outgoingTransferInstance);

    beforeEach(() => {
        sandbox = sinon.sandbox.create().usingPromise(Promise);
        sandbox.stub(worker, 'getRoutes').returns(routes);
    });

    afterEach(() => sandbox.restore());

    describe('constructor', () => {
        it('should throw an error if transfer descriptor data is missing', () => {
            (() => {
                new OutgoingTransfer(worker, null);
            }).should.throw(/descriptor is a required parameter/);
        });

        it('should throw an error if taskSid is missing', () => {
            (() => {
                new OutgoingTransfer(worker, new Request(config), null, outgoingTransferDescriptor);
            }).should.throw(/taskSid is a required parameter/);
        });

        it('should set Transfer properties', () => {
            const outgoingTransfer = new OutgoingTransfer(worker, new Request(config), taskSid, outgoingTransferDescriptor);
            AssertionUtils.assertTransfer(outgoingTransfer, outgoingTransferInstance);
        });
    });

    describe('#cancel', () => {
        const requestURL = `Workspaces/${workspaceSid}/Workers/${workerSid}/Transfers/${outgoingTransferDescriptor.sid}`;
        const requestParams = {
            TaskSid: taskSid,
            TransferStatus: TRANSFER_STATUS.canceled
        };
        let outgoingTransfer;

        beforeEach(() => {
            outgoingTransfer = new OutgoingTransfer(worker, new Request(config), taskSid, outgoingTransferDescriptor);
        });

        it('should make a POST request and resolve', async() => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).resolves(canceledTaskTransfer);
            const result = await outgoingTransfer.cancel();
            AssertionUtils.assertTransfer(result, canceledTaskTransfer);
        });

        it('should throw an error if POST request fails', () => {
            const err = new Error('InternalServerError');
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).rejects(err);
            return outgoingTransfer.cancel().catch(e => {
                assert.deepEqual(e, err);
            });
        });

        it('should update transfer object only once when called multiple times', async() => {
            const err = new Error('Transfer is already canceled. Cannot cancel transfer');
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).resolves(canceledTaskTransfer).rejects(err);
            try {
             const result = await outgoingTransfer.cancel();
             AssertionUtils.assertTransfer(result, canceledTaskTransfer);
             // calling cancel again on the same object
             await outgoingTransfer.cancel();
            } catch (e) {
                assert.deepEqual(e, err);
            }
        });
    });
});
