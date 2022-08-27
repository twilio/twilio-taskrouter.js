import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import AssertionUtils from '../../util/AssertionUtils';

const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;
chai.should();
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Task Transfer', function() {
  /* eslint-disable no-invalid-this */
  this.timeout(5000);
  /* eslint-enable */

  const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
  const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
  const bobToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);
  let alice;
  let bob;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: credentials.region,
                edge: credentials.edge,
                logLevel: 'error',
            });
            // bob stays offline
            bob = new Worker(bobToken, {
                connectActivitySid: credentials.multiTaskUpdateActivitySid,
                region: credentials.region,
                edge: credentials.edge,
                logLevel: 'error',
            });

            return envTwilio.createTask(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskWorkflowSid,
                JSON.stringify({
                                   to: 'client:alice',
                                   conference: { sid: 'CF11111111111111111111111111111111' }
                               })
            );
        });
    });

    afterEach(() => {
        alice.removeAllListeners();
        bob.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return Promise.all([
                envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskBobSid,
                credentials.multiTaskUpdateActivitySid),
                envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid)]);
        });
    });

    describe('Cancel Transfer for Worker B', () => {
        it.skip('should cancel the transfer and cause the reservation to cancel', done => {
            alice.on('reservationCreated', reservation => {
                // Make Bob available
                return envTwilio.updateWorkerActivity(
                    credentials.multiTaskWorkspaceSid,
                    credentials.multiTaskBobSid,
                    credentials.multiTaskConnectActivitySid
                ).then(() => reservation.accept()
                ).then(acceptedReservation => {
                    // Transfer the task, verify that transfer was initiated and have Bob reject
                    return Promise.all([
                                acceptedReservation.task.transfer(credentials.multiTaskBobSid),
                                new Promise(resolve => {
                                    acceptedReservation.task.on('transferInitiated', outgoingTransfer => {
                                        expect(outgoingTransfer.status).to.equal('initiated');
                                        outgoingTransfer.on('canceled', outgoingTransfer => {
                                            expect(outgoingTransfer.status).to.equal('canceled');
                                            resolve();
                                        });
                                    });
                                }),
                                new Promise(resolve => {
                                    bob.once('reservationCreated', transferReservation => {

                                        AssertionUtils.verifyTransferProperties(transferReservation.transfer,
                                            alice.sid, bob.sid, 'WARM', 'WORKER', 'initiated',
                                            `Transfer (account ${credentials.accountSid}, task ${transferReservation.task.sid})`);
                                        AssertionUtils.verifyTransferProperties(transferReservation.task.transfers.incoming,
                                            alice.sid, bob.sid, 'WARM', 'WORKER', 'initiated',
                                            `Incoming transfer (account ${credentials.accountSid}, task ${transferReservation.task.sid})`);

                                        transferReservation.once('canceled', () => {
                                            expect(transferReservation.status).equals('canceled');
                                            expect(transferReservation.task.transfers.incoming.status).equals('canceled');
                                            expect(transferReservation.task.status).equals('assigned');
                                            resolve();
                                        });

                                        // have alice cancel the reservation
                                        acceptedReservation.task.transfers.outgoing.cancel().then(canceledTransfer => {
                                            expect(canceledTransfer.status).equals('canceled');
                                        });
                                    });
                                })
                    ]).then(() => done()).catch(done);
                });
            });
        }).timeout(15000);
    });

    describe('#Failed Transfer to a worker', () => {
        it('should accept reservation, transfer the task and reject the warm transfer to worker', done => {
            alice.on('reservationCreated', reservation => {
                // Make Bob available
                return envTwilio.updateWorkerActivity(
                    credentials.multiTaskWorkspaceSid,
                    credentials.multiTaskBobSid,
                    credentials.multiTaskConnectActivitySid
                ).then(() => reservation.accept()
                ).then(acceptedReservation => {
                    // Transfer the task, verify that transfer was initiated and have Bob reject
                    return Promise.all([
                                acceptedReservation.task.transfer(credentials.multiTaskBobSid),
                                new Promise(resolve => {
                                    acceptedReservation.task.on('transferInitiated', outgoingTransfer => {
                                        expect(outgoingTransfer.status).to.equal('initiated');
                                        outgoingTransfer.on('failed', outgoingTransfer => {
                                            expect(outgoingTransfer.status).to.equal('failed');
                                            resolve();
                                        });
                                    });
                                }),
                                new Promise(resolve => {
                                    bob.once('reservationCreated', transferReservation => {
                                        AssertionUtils.verifyTransferProperties(transferReservation.transfer,
                                            alice.sid, bob.sid, 'WARM', 'WORKER', 'initiated',
                                            `Transfer (account ${credentials.accountSid}, task ${transferReservation.task.sid})`);
                                        AssertionUtils.verifyTransferProperties(transferReservation.task.transfers.incoming,
                                            alice.sid, bob.sid, 'WARM', 'WORKER', 'initiated',
                                            `Incoming transfer (account ${credentials.accountSid}, task ${transferReservation.task.sid})`);

                                        // expect task assignment is reserved before reject
                                        expect(transferReservation.task.status).equals('reserved');

                                        transferReservation.reject().then(() => {
                                            // verify that on rejecting the transfer reservation, the transfer object
                                            // is updated as well with the failed status
                                            transferReservation.once('rejected', rejectedReservation => {
                                                AssertionUtils.verifyTransferProperties(rejectedReservation.transfer,
                                                    alice.sid, bob.sid, 'WARM', 'WORKER', 'failed',
                                                    `Transfer (account ${credentials.accountSid}, task ${rejectedReservation.task.sid})`);
                                            });
                                        }).then(() => {
                                            acceptedReservation.task.once('updated', updatedTask => {
                                                expect(updatedTask.status).equals('assigned');
                                                resolve();
                                            });
                                        });
                                    });
                                })
                    ]).then(() => done());
                });
            });

        }).timeout(15000);
    });

    describe.skip('#Failed Attempt Transfer to a worker', () => {
        it('should accept reservation, transfer the task and reject the warm transfer to queue', done => {
            alice.on('reservationCreated', reservation => {
                // Make Bob available
                return envTwilio.updateWorkerActivity(
                    credentials.multiTaskWorkspaceSid,
                    credentials.multiTaskBobSid,
                    credentials.multiTaskConnectActivitySid)
                    .then(() => reservation.accept())
                    .then(acceptedReservation => {
                    // Transfer the task to queue, verify that transfer was initiated and have Bob reject
                    return Promise.all([
                                acceptedReservation.task.transfer(credentials.multiTaskQueueSid),
                                new Promise(resolve => {
                                    acceptedReservation.task.on('transferInitiated', outgoingTransfer => {
                                        expect(outgoingTransfer.status).to.equal('initiated');
                                        outgoingTransfer.on('attemptFailed', outgoingTransfer => {
                                            expect(outgoingTransfer.status).to.equal('initiated');
                                            resolve();
                                        });
                                    });
                                }),
                                new Promise(resolve => {
                                    bob.once('reservationCreated', transferReservation => {

                                        AssertionUtils.verifyTransferProperties(transferReservation.transfer,
                                            alice.sid, credentials.multiTaskQueueSid, 'WARM', 'QUEUE', 'initiated',
                                            `Transfer (account ${credentials.accountSid}, task ${transferReservation.task.sid})`);
                                        AssertionUtils.verifyTransferProperties(transferReservation.task.transfers.incoming,
                                            alice.sid, credentials.multiTaskQueueSid, 'WARM', 'QUEUE', 'initiated',
                                            `Transfer (account ${credentials.accountSid}, task ${transferReservation.task.sid})`);

                                         // expect task assignment is reserved before reject
                                         expect(transferReservation.task.status).equals('reserved');

                                        transferReservation.reject().then(() => {
                                            // verify that on rejecting the transfer reservation, the transfer object has a status of initiated
                                            transferReservation.once('rejected', rejectedReservation => {
                                                AssertionUtils.verifyTransferProperties(rejectedReservation.transfer,
                                                    alice.sid, credentials.multiTaskQueueSid, 'WARM', 'QUEUE', 'initiated',
                                                    `Transfer (account ${credentials.accountSid}, task ${rejectedReservation.task.sid})`);
                                            });
                                        }).then(() => {
                                            acceptedReservation.task.once('updated', updatedTask => {
                                                expect(updatedTask.status).equals('pending');
                                                resolve();
                                            });
                                        });
                                    });
                                })
                    ]).then(() => done()).catch(done);
                });
            });
        }).timeout(15000);
    });
});

