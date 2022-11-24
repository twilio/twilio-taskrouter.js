import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

const chai = require('chai');
const assert = chai.assert;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('OutgoingTransfer', () => {
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
    const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const bobToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);
    const conferenceSid = 'CF11111111111111111111111111111111';
    const region = buildRegionForEventBridge(credentials.region);
    const edge = credentials.edge;
    let alice;
    let bob;

    function cleanupEnv() {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid)
            .then(envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, credentials.multiTaskUpdateActivitySid))
            .then(envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskUpdateActivitySid));
    }

    const createTaskForAlicePromise = () => {
        return envTwilio.createTask(
            credentials.multiTaskWorkspaceSid,
            credentials.multiTaskWorkflowSid,
            JSON.stringify({
                to: 'client:alice',
                conference: { sid: conferenceSid }
            })
        );
    };

    beforeEach(() => {
        alice = new Worker(aliceToken, {
            connectActivitySid: credentials.multiTaskConnectActivitySid,
            region,
            edge,
            logLevel: 'error'
        });

        // bob stays offline
        bob = new Worker(bobToken, {
            region,
            edge,
            logLevel: 'error'
        });
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(createTaskForAlicePromise);
    });

    afterEach(() => {
        return cleanupEnv().then(() => {
            alice.removeAllListeners();
            bob.removeAllListeners();
        });
    });

    describe.skip('when cancel() is called', () => {

        // ORCH-1783 filed for unreliable test
        it.skip('should cancel an ongoing transfer and update transfers object correctly', done => {
            return alice.on('reservationCreated', reservation => {
                // Make Bob available
                return envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid)
                    .then(() => reservation.accept())
                    .then(acceptedReservation => {
                        // Transfer the task
                        return acceptedReservation.task.transfer(credentials.multiTaskBobSid)
                            .then(transferredTask => {
                                assert.deepStrictEqual(acceptedReservation.task, transferredTask,
                                    envTwilio.getErrorMessage('Reservation task and transferred task mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                return transferredTask.transfers.outgoing.cancel()
                                    .then(canceledTransfer => {
                                        assert.equal(canceledTransfer.status, 'canceled',
                                            envTwilio.getErrorMessage('Reservation transfer status mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                        assert.deepStrictEqual(transferredTask.transfers.outgoing, canceledTransfer,
                                            envTwilio.getErrorMessage('Transfer task and canceled task mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                        acceptedReservation.task.transfers.outgoing.on('canceled', updatedTransfer => {
                                            assert.equal(updatedTransfer.status, 'canceled',
                                                envTwilio.getErrorMessage('Reservation transfer status mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                            assert.deepStrictEqual(updatedTransfer, acceptedReservation.task.transfers.outgoing,
                                                envTwilio.getErrorMessage('Updated task and accepted reservation task mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                            done();
                                        });
                                    });
                            });
                    }).catch(err => done(err));
            });
        }).timeout(10000);


        // ORCH-1797 filed for unreliable test
        it.skip('should cancel an ongoing transfer and update task object correctly', done => {
            return alice.on('reservationCreated', reservation => {
                // Make Bob available
                return envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid)
                    .then(() => reservation.accept())
                    .then(acceptedReservation => {
                        // Transfer the task
                        return acceptedReservation.task.transfer(credentials.multiTaskBobSid)
                            .then(transferredTask => {
                                return transferredTask.transfers.outgoing.cancel()
                                    .then(canceledTransfer => {
                                        assert.deepStrictEqual(transferredTask.transfers.outgoing, canceledTransfer,
                                            envTwilio.getErrorMessage('Transfer task and canceled task mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                        acceptedReservation.task.once('updated', updatedTask => {
                                            assert.equal(updatedTask.status, 'assigned',
                                                envTwilio.getErrorMessage('Transfer task status mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                            done();
                                        });
                                    });
                            });
                    }).catch(err => done(err));
            });
        }).timeout(10000);
    });

    describe('when cancel() called multiple times on the same object', () => {
        it('should throw an error when cancel is called after transfer has already been canceled', done => {
            return alice.on('reservationCreated', reservation => {
                // Make Bob available
                return envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid)
                    .then(() => reservation.accept())
                    .then(acceptedReservation => {
                        // Transfer the task
                        return acceptedReservation.task.transfer(credentials.multiTaskBobSid)
                            .then(transferredTask => {
                                return transferredTask.transfers.outgoing.cancel()
                                    .then(canceledTransfer => {
                                        assert.deepStrictEqual(transferredTask.transfers.outgoing, canceledTransfer,
                                            envTwilio.getErrorMessage('Transfer task and canceled task mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                        // canceling the same outgoing task again
                                        return transferredTask.transfers.outgoing.cancel().catch(err => {
                                            assert.equal(err.response.status, 400,
                                                envTwilio.getErrorMessage('400 not received when canceling same task twice', credentials.accountSid, credentials.multiTaskBobSid));

                                            assert.equal(err.response.statusText, `Transfer ${canceledTransfer.sid} is already canceled . Cannot cancel transfer.`,
                                                envTwilio.getErrorMessage('400 error message content mismatch', credentials.accountSid, credentials.multiTaskBobSid));

                                            done();
                                        });
                                    });
                            });
                    }).catch(err => done(err));
            });
        }).timeout(10000);
    });
});
