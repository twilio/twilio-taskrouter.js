import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import OutboundCommonHelpers from '../../../util/OutboundCommonHelpers';
import { pauseTestExecution } from '../../VoiceBase';
const STATUS_CHECK_DELAY = 2000;

const credentials = require('../../../env');
const chai = require('chai');
chai.use(require('sinon-chai'));
const assert = chai.assert;

describe('Task Transfer to Worker for Outbound Voice Task', () => {
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

    describe('#Cold Transfer to a Worker', () => {
        it('should complete transfer to worker B successfully', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, true,
                            credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1, 0),
                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 1, 0)])
                        .then(() => resolve('Test for cold transfer to worker B successfully is finished'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation, credentials.supervisorNumber,
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
        }).timeout(50000);

        it('should not fail even if Worker A tries to wrap up task before Worker B accepts', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        aliceReservation.task.on('transferInitiated', async() => {
                            try {
                                await aliceReservation.task.wrapUp({ reason: 'Alice trying to wrapup task.' });
                                reject('Failed to throw 400 on request to wrapup task');
                            } catch (err) {
                                // Verify it cannot complete task because it is not currently assigned
                                assert.strictEqual(err.response.status, 400, 'Task complete failure error code');
                            }
                        });

                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, true,
                            credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1, 0),
                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 1, 0)])
                        .then(() => resolve('Test to verify no failure if Worker A tries to wrap up or complete task before Worker B accepts is finished.'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation, credentials.supervisorNumber,
                                'in-progress', 2);
                        } catch (err) {
                            reject(`Error caught after receiving Bob's reservation accepted event. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        }).timeout(50000);
    });

    describe('#Failed Cold Transfer to a Worker', () => {
        it('should fail if transferee rejects', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, true,
                            credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before rejecting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    bobReservation.on('rejected', async() => {
                        try {
                            // check that there is only 1 participant in the conference as Bob rejected
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid, 'in-progress', 1);

                            // Verify customer is on-hold
                            const conference = await envTwilio.fetchConferenceByName(bobReservation.task.sid);
                            const participantPropertiesMap = await envTwilio.fetchParticipantProperties(conference.sid);
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, true, 'Customer put on-hold value');

                            // verify that on rejecting the transfer reservation, the transfer object is updated as well with the failed status
                            assert.strictEqual(bobReservation.transfer.status, 'failed', 'Transfer status');

                            resolve('Test for failure if transferee rejects is finished.');
                        } catch (err) {
                            reject(`Error caught after receiving reservation rejected event. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before rejecting reservation for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.reject().catch(err => {
                        reject(`Error in rejecting Bob's reservation. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        }).timeout(50000);

        it('should not initiate transfer when transferee is unavailable', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        // check that there are 2 participants in the conference
                        await outboundCommonHelpers.verifyConferenceProperties(aliceReservation.task.sid, 'in-progress', 2);

                        // Keeping Bob Unavailable, Initiate Transfer, verify that transfer was NOT initiated
                        try {
                            await aliceReservation.task.transfer(credentials.multiTaskBobSid, { mode: 'COLD' });
                        } catch (err) {
                            assert.strictEqual(err.response.status, 400, 'Task transfer failure error code');
                            resolve('Test to fail initiating transfer when transferee is unavailable is finished.');
                        }
                    } catch (err) {
                        reject(`Failed to validate Conference properties on Alice's reservation accepted event. Error: ${err}`);
                    }
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        }).timeout(50000);

        it('should fail if transferee issues a overriding conference(options) with invalid number', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, true,
                            credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    bobReservation.on('canceled', async() => {
                        try {
                            // check that there is only 1 participant in the conference as Bob's reservation got canceled
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid, 'in-progress', 1);

                            // verify that the transfer object is updated as well with the failed status
                            assert.strictEqual(bobReservation.transfer.status, 'failed', 'Transfer status');

                            // Verify canceled reason code is 13223 - Invalid phone number format
                            assert.strictEqual(bobReservation.canceledReasonCode, 13223, 'Canceled Reason Code');

                            resolve('Test to verify failure if transferee issues a overriding conference(options) with invalid number is finished.');
                        } catch (err) {
                            reject(`Failed to validate Conference properties on Bob's reservation canceled event. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.conference({ endConferenceOnExit: true, to: '+11111111111' }).catch(err => {
                        reject(`Error in establishing conference for transferred worker. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        }).timeout(50000);
    });

    describe('#Cold Transfer to a Worker whose reservation times out', () => {
        afterEach(() => {
            return envTwilio.updateWorkflowTaskReservationTimeout(credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, 120);
        });

        it('should fail if transferee does not accept reservation within time limit', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        envTwilio.updateWorkflowTaskReservationTimeout(credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, 10);
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, true,
                            credentials.multiTaskBobSid, 'COLD', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid, credentials.multiTaskBobSid, 'COLD', 'WORKER', 'initiated', 'Incoming Transfer');
                    } catch (err) {
                        reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1, 0)
                        .catch(err => reject(`Error caught while wrapping and completing transferor's reservation. Error: ${err}`));

                    bobReservation.on('timeout', async() => {
                        try {
                            // check that there is only 1 participant in the conference as Bob's reservation got canceled
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid, 'in-progress', 1);

                            assert.strictEqual(bobReservation.transfer.status, 'failed', 'Transfer status');

                            resolve('Test to verify failure if transferee does not accept reservation within time limit is finished.');
                        } catch (err) {
                            reject(`Failed to validate Conference properties on Bob's reservation canceled event. Error: ${err}`);
                        }
                    });
                    // Do not issue the conference instruction for Worker B's reservation as we don't want it to accept
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        }).timeout(50000);
    });
});

