import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

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
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`,
                logLevel: 'error',
            });
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        }).then(() => {
            // bob stays offline
            bob = new Worker(bobToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`,
                logLevel: 'error',
            });
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskBobSid,
                credentials.multiTaskUpdateActivitySid
            );
        }).then(() => {
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
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        }).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskBobSid,
                credentials.multiTaskUpdateActivitySid
            );
        });
    });

    describe('Cancel Transfer for Worker B', () => {
        it('should cancel the transfer and cause the reservation to cancel', done => {

            return alice.on('reservationCreated', reservation => {
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
                                    acceptedReservation.task.on('transferInitiated', () => resolve());
                                }),
                                new Promise(resolve => {
                                    bob.once('reservationCreated', transferReservation => {

                                        verifyReservationHasTransfer(alice.sid, bob.sid, transferReservation);
                                        verifyTaskTransfersIncoming(alice.sid, bob.sid, transferReservation);

                                        // Verify that transfer object type
                                        expect(transferReservation.transfer.mode).equals('WARM');
                                        expect(transferReservation.transfer.type).equals('WORKER');

                                        // also verify task.transfers.incoming object transfer type
                                        expect(transferReservation.task.transfers.incoming.mode).equals('WARM');
                                        expect(transferReservation.task.transfers.incoming.type).equals('WORKER');

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
                                }),
                                new Promise(resolve => {
                                    acceptedReservation.task.on('transferCanceled', () => resolve());
                                }),

                    ]).then(() => done());
                });
            });
        }).timeout(15000);
    });

    describe('#Failed Transfer to a worker', () => {
        it('should accept reservation, transfer the task and reject the warm transfer to worker', done => {

            return alice.on('reservationCreated', reservation => {

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
                                    acceptedReservation.task.on('transferInitiated', () => resolve());
                                }),
                                new Promise(resolve => {
                                    bob.once('reservationCreated', transferReservation => {

                                        verifyReservationHasTransfer(alice.sid, bob.sid, transferReservation);
                                        verifyTaskTransfersIncoming(alice.sid, bob.sid, transferReservation);

                                        // Verify transfer object type
                                        expect(transferReservation.transfer.mode).equals('WARM');
                                        expect(transferReservation.transfer.type).equals('WORKER');

                                        // also verify task.transfers.incoming object transfer type
                                        expect(transferReservation.task.transfers.incoming.mode).equals('WARM');
                                        expect(transferReservation.task.transfers.incoming.type).equals('WORKER');

                                        // expect task assignment is reserved before reject
                                        expect(transferReservation.task.status).equals('reserved');

                                        transferReservation.reject().then(() => {
                                            // verify that on rejecting the transfer reservation, the transfer object
                                            // is updated as well with the failed status
                                            transferReservation.once('rejected', rejectedReservation => {
                                                expect(rejectedReservation.transfer.mode).equals('WARM');
                                                expect(rejectedReservation.transfer.to).equals(bob.sid);
                                                expect(rejectedReservation.transfer.workerSid).equals(alice.sid);
                                                expect(rejectedReservation.transfer.type).equals('WORKER');
                                                expect(rejectedReservation.transfer.reservationSid.substring(0, 2)).equals('WR');
                                                expect(rejectedReservation.transfer.sid.substring(0, 2)).equals('TT');
                                                expect(rejectedReservation.transfer.status).equals('failed');
                                            });
                                        }).then(() => {
                                            acceptedReservation.task.once('updated', updatedTask => {
                                                expect(updatedTask.status).equals('assigned');
                                                resolve();
                                            });
                                        });
                                    });
                                }),
                                new Promise(resolve => {
                                    acceptedReservation.task.on('transferFailed', () => resolve());
                                }),
                    ]).then(() => done());
                });
            });

        }).timeout(15000);
    });

    describe('#Failed Attempt Transfer to a worker', () => {
        it('should accept reservation, transfer the task and reject the warm transfer to queue', done => {

            return alice.on('reservationCreated', reservation => {

                // Make Bob available
                return envTwilio.updateWorkerActivity(
                    credentials.multiTaskWorkspaceSid,
                    credentials.multiTaskBobSid,
                    credentials.multiTaskConnectActivitySid
                ).then(() => reservation.accept()
                ).then(acceptedReservation => {
                    // Transfer the task to queue, verify that transfer was initiated and have Bob reject
                    return Promise.all([
                                acceptedReservation.task.transfer(credentials.multiTaskQueueSid),
                                new Promise(resolve => {
                                    acceptedReservation.task.on('transferInitiated', () => resolve());
                                }),
                                new Promise(resolve => {
                                    bob.once('reservationCreated', transferReservation => {

                                        verifyReservationHasTransfer(alice.sid, credentials.multiTaskQueueSid, transferReservation);
                                        verifyTaskTransfersIncoming(alice.sid, credentials.multiTaskQueueSid, transferReservation);

                                        // Verify transfer object type
                                        expect(transferReservation.transfer.mode).equals('WARM');
                                        expect(transferReservation.transfer.type).equals('QUEUE');

                                        // also verify task.transfers.incoming object transfer type
                                        expect(transferReservation.task.transfers.incoming.mode).equals('WARM');
                                        expect(transferReservation.task.transfers.incoming.type).equals('QUEUE');

                                         // expect task assignment is reserved before reject
                                         expect(transferReservation.task.status).equals('reserved');

                                        transferReservation.reject().then(() => {
                                            // verify that on rejecting the transfer reservation, the transfer object has a status of initiated
                                            transferReservation.once('rejected', rejectedReservation => {
                                                expect(rejectedReservation.transfer.mode).equals('WARM');
                                                expect(rejectedReservation.transfer.to).equals(credentials.multiTaskQueueSid);
                                                expect(rejectedReservation.transfer.workerSid).equals(alice.sid);
                                                expect(rejectedReservation.transfer.type).equals('QUEUE');
                                                expect(rejectedReservation.transfer.reservationSid.substring(0, 2)).equals('WR');
                                                expect(rejectedReservation.transfer.sid.substring(0, 2)).equals('TT');
                                                expect(rejectedReservation.transfer.status).equals('initiated');
                                                resolve();
                                            });
                                        }).then(() => {
                                            acceptedReservation.task.once('updated', updatedTask => {
                                                expect(updatedTask.status).equals('pending');
                                                resolve();
                                            });
                                        });
                                    });
                                }),
                                new Promise(resolve => {
                                    acceptedReservation.task.on('transferAttemptFailed', () => resolve());
                                }),

                    ]).then(() => done());
                });
            });

        }).timeout(15000);
    });

});

function verifyReservationHasTransfer(fromWorkerSid, toSid, transferReservation) {
    expect(transferReservation.transfer.reservationSid.substring(0, 2)).equals('WR');
    expect(transferReservation.transfer.sid.substring(0, 2)).equals('TT');
    expect(transferReservation.transfer.workerSid).equals(fromWorkerSid);
    expect(transferReservation.transfer.to).equals(toSid);
    expect(transferReservation.transfer.status).equals('initiated');
}

function verifyTaskTransfersIncoming(fromWorkerSid, toSid, transferReservation) {
    expect(transferReservation.task.transfers.incoming.reservationSid.substring(0, 2)).equals('WR');
    expect(transferReservation.task.transfers.incoming.sid.substring(0, 2)).equals('TT');
    expect(transferReservation.task.transfers.incoming.workerSid).equals(fromWorkerSid);
    expect(transferReservation.task.transfers.incoming.to).equals(toSid);
    expect(transferReservation.task.transfers.incoming.status).equals('initiated');
}
