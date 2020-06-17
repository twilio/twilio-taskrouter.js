import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import OutboundCommonHelpers from '../../../util/OutboundCommonHelpers';
import { pauseTestExecution } from '../../VoiceBase';
import { TRANSFER_MODE } from '../../../util/Constants';
const STATUS_CHECK_DELAY = 2000;

const credentials = require('../../../env');
const chai = require('chai');
chai.use(require('sinon-chai'));
const assert = chai.assert;

describe('Task Transfer to Queue for Outbound Voice Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const outboundCommonHelpers = new OutboundCommonHelpers(envTwilio);
    let alice;
    let bob;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            // Make Alice available
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            // bob stays offline
            bob = new Worker(bobToken, {
                connectActivitySid: credentials.multiTaskUpdateActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return outboundCommonHelpers.listenToWorkerReadyOrErrorEvent(alice);
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

    describe('#Cold Transfer to a Queue', () => {
        it('should transfer task to Worker B in queue successfully', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                            true, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                        .then(() => resolve('Test for cold transfer to worker B successfully is finished'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                'in-progress', 2);
                        } catch (err) {
                            reject(`Error caught after receiving Bob's reservation accepted event. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                        reject(`Error in establishing conference for transferred worker. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        }).timeout(60000);
    });

    describe('#Cold Transfer with worker capacity > 1', () => {
        afterEach(() => {
            return envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, alice.sid, 'default', 1);
        });

        it('should transfer back to Worker A if it is the only worker in queue', () => {
            let reservationCountWorkerA = 1;
            return new Promise(async(resolve, reject) => {
                await envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, alice.sid, 'default', 2);
                await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);

                alice.on('reservationCreated', async(aliceReservation) => {
                    try {
                        if (reservationCountWorkerA === 2) {
                            assert.strictEqual(aliceReservation.task.status, 'reserved', 'Task Status');
                            resolve('Test for transfer back to Worker A if it is the only worker in queue is finished');
                        }
                        outboundCommonHelpers.assertOnReservationCreated(alice);
                    } catch (err) {
                        reject(`Failed to validate Reservation and Task properties on reservation created event. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            reservationCountWorkerA++;
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                                false, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                        }
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });
            });
        });
    });

    describe('#Failed Cold Transfer to Queue', () => {
        it('should transfer task back to Worker A when Worker B rejects', () => {
            let reservationCountWorkerA = 1;
            return new Promise(async(resolve, reject) => {
                await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);

                alice.on('reservationCreated', async(aliceReservation) => {
                    try {
                        if (reservationCountWorkerA === 2) {
                            assert.strictEqual(aliceReservation.task.status, 'reserved', 'Task Status');
                            resolve('Test for transfer task back to Worker A when Worker B rejects is finished');
                        }
                        outboundCommonHelpers.assertOnReservationCreated(alice);
                    } catch (err) {
                        reject(`Failed to validate Reservation and Task properties on reservation created event. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                                true, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                        }
                    });

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true)
                        .catch(err => reject(`Error caught while wrapping and completing Alice's reservation. Error: ${err}`));

                    bob.on('reservationCreated', async(bobReservation) => {
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Incoming Transfer');
                        } catch (err) {
                            reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                        }

                        // Wait for wrapup event on aliceReservation before rejecting reservation for Worker B
                        await pauseTestExecution(STATUS_CHECK_DELAY);
                        bobReservation.reject()
                            .then(() => {
                                reservationCountWorkerA++;
                            })
                            .catch(err => reject(`Error in rejecting Bob's reservation. Error: ${err}`));
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });
            });
        });
    });

    describe('#Warm Transfer To a Queue', () => {
        it('should complete successfully when worker B accept the 2nd transfer after worker A cancelling the 1st Transfer', () => {
            let aliceTransferCount = 0;
            let bobReservationCount = 0;

            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.verifyConferenceProperties(aliceReservation.task.sid, 'in-progress', 2);
                        await envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid);

                        // alice making the 1st transfer
                        await aliceReservation.task.transfer(credentials.multiTaskQueueSid, { mode: TRANSFER_MODE.warm });

                        aliceReservation.task.on('transferInitiated', async(outgoingTransfer) => {
                            aliceTransferCount++;
                            try {
                                assert.strictEqual(outgoingTransfer.status, 'initiated', 'Outgoing Transfer Status');

                                await pauseTestExecution(STATUS_CHECK_DELAY);

                                const conference = await envTwilio.fetchConferenceByName(aliceReservation.task.sid);
                                const participantPropertiesMap = await envTwilio.fetchParticipantProperties(conference.sid);
                                assert.deepStrictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, true, 'Customer put on-hold value');

                                // alice cancelling the 1st transfer
                                if (aliceTransferCount === 1) {
                                    await outgoingTransfer.cancel();
                                }
                            } catch (err) {
                                reject(`Error while canceling transfer for alice. Error: ${err}`);
                            }
                        });

                        aliceReservation.task.transfers.outgoing.on('canceled', async(updatedTransfer) => {
                            try {
                                assert.equal(updatedTransfer.status, 'canceled');
                                // alice making the 2nd transfer after cancelling the 1st
                                await aliceReservation.task.transfer(credentials.multiTaskQueueSid, { mode: TRANSFER_MODE.warm });
                            } catch (err) {
                                reject(`Error while Alice making the 2nd transfer to Bob. Error: ${err}`);
                            }
                        });
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    bobReservationCount++;
                    bobReservation.on('accepted', async() => {
                        await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                          credentials.supervisorNumber, 'in-progress', 3);
                        if (bobReservationCount === 2) {
                            // Make sure Bob's second reservation is getting accepted
                            resolve('Test succeeded: should reassign task and send reservation.accepted event to an available worker on 2nd transfer' +
                                ' when transferee cancels the 1st transfer');
                        }
                    });

                    try {
                        // assert the Reservation transfer object
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid,
                            credentials.multiTaskQueueSid, TRANSFER_MODE.warm, 'QUEUE',
                            'initiated', 'Transfer');
                        // assert the Task transfers object
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid,
                            credentials.multiTaskQueueSid, TRANSFER_MODE.warm, 'QUEUE',
                            'initiated', 'Incoming Transfer');

                        if (bobReservationCount === 2) {
                            await bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                reject(`Error while establishing conference for alice. Error: ${err}`);
                            });
                        }
                    } catch (err) {
                        reject(
                          `Failed to validate Reservation and Transfer properties on Bob reservationCreated ResSid=${bobReservation.sid}. Error: ${err}`);
                    }
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        }).timeout(45000);
    });

    describe('#Back to Back Cold Transfer to Queue', () => {
        it('should transfer task to queue having Worker B which transfers back to Queue with Worker A', () => {
            let reservationCountWorkerA = 1;
            return new Promise(async(resolve, reject) => {
                await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);

                alice.on('reservationCreated', async(aliceReservation) => {
                    try {
                        if (reservationCountWorkerA === 2) {
                            AssertionUtils.verifyTransferProperties(aliceReservation.transfer,
                                credentials.multiTaskBobSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(aliceReservation.task.transfers.incoming,
                                credentials.multiTaskBobSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Incoming Transfer');
                        } else {
                            outboundCommonHelpers.assertOnReservationCreated(alice);
                        }
                    } catch (err) {
                        reject(`Failed to validate Reservation/Task/Transfer properties on reservation created event. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            if (reservationCountWorkerA === 2) {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(aliceReservation, 'in-progress', 2);
                            } else {
                                await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                                    true, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                            }
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                        }
                    });

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, reservationCountWorkerA === 1).then(() => {
                        if (reservationCountWorkerA === 2) {
                            resolve('Test for transfer task back to Worker A when Worker B rejects is finished');
                        }
                    }).catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                    bob.on('reservationCreated', async(bobReservation) => {
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Incoming Transfer');

                        } catch (err) {
                            reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                        }

                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, true)
                            .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                        bobReservation.on('accepted', async() => {
                            try {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                    'in-progress', 2);

                                reservationCountWorkerA++;
                                await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(bobReservation, credentials.multiTaskQueueSid,
                                    true, credentials.multiTaskAliceSid, 'COLD', 'in-progress', 2);

                            } catch (err) {
                                reject(`Error caught after receiving reservation rejected event. Error: ${err}`);
                            }
                        });

                        // Wait for wrapup event on aliceReservation before accepting reservation for Worker B
                        await pauseTestExecution(STATUS_CHECK_DELAY);
                        bobReservation.conference().catch(err => {
                            reject(`Error in establishing conference. Error: ${err}`);
                        });
                    });

                    if (reservationCountWorkerA === 2) {
                        // Wait for wrapup event on bobReservation before issuing conference instruction for Worker A
                        await pauseTestExecution(STATUS_CHECK_DELAY);
                        aliceReservation.conference({ endConferenceOnExit: true }).catch(err => {
                            reject(`Error in establishing conference. Error: ${err}`);
                        });
                    } else {
                        // if this is 1st accept request from worker A
                        aliceReservation.conference().catch(err => {
                            reject(`Error in establishing conference. Error: ${err}`);
                        });
                    }
                });
            });
        }).timeout(75000);
    });
});

