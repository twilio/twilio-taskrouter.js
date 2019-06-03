import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

const chai = require('chai');
const assert = chai.assert;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('OutgoingTransfer', () => {
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const bobToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);
    const conferenceSid = 'CF11111111111111111111111111111111';
    const ebServerUrl = `${credentials.ebServer}/v1/wschannels`;
    const wsServerUrl = `${credentials.wsServer}/v1/wschannels`;
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
            ebServer: ebServerUrl,
            wsServer: wsServerUrl,
            logLevel: 'error'
        });

        // bob stays offline
        bob = new Worker(bobToken, {
            ebServer: ebServerUrl,
            wsServer: wsServerUrl,
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

    describe('when cancel() is called', () => {
        it('should cancel an ongoing transfer and update transfers object correctly', done => {
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
                                        assert.deepEqual(canceledTransfer, transferredTask.transfers.outgoing);
                                        acceptedReservation.task.transfers.outgoing.on('canceled', updatedTransfer => {
                                            assert.deepEqual(updatedTransfer, acceptedReservation.task.transfers.outgoing);
                                            done();
                                        });
                                    });
                            });
                    }).catch(err => done(err));
            });
        }).timeout(10000);

        it('should cancel an ongoing transfer and update task object correctly', done => {
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
                                        assert.deepEqual(canceledTransfer, transferredTask.transfers.outgoing);
                                        acceptedReservation.task.once('updated', updatedTask => {
                                            assert.equal(updatedTask.status, 'assigned');
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
                                        assert.deepEqual(canceledTransfer, transferredTask.transfers.outgoing);
                                        // canceling the same outgoing task again
                                        return transferredTask.transfers.outgoing.cancel().catch(err => {
                                            assert.equal(err.response.status, 400);
                                            assert.equal(err.response.statusText, `Transfer ${canceledTransfer.sid} is already canceled . Cannot cancel transfer.`);
                                            done();
                                        });
                                    });
                            });
                    }).catch(err => done(err));
            });
        }).timeout(10000);
    });
});
