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

describe('Task Transfer to Worker for Outbound Voice Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                      credentials.multiTaskAliceSid);
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                    credentials.multiTaskBobSid);
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
            return Promise.all([envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid,
                                                               credentials.multiTaskBobSid, credentials.multiTaskUpdateActivitySid),
                                envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid,
                                                               credentials.multiTaskAliceSid, credentials.multiTaskUpdateActivitySid)]);
        });
    });

    describe('#Cold Transfer to a Worker', () => {
        it('should complete transfer to worker B successfully', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  true,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  TRANSFER_MODE.cold, 'in-progress',
                                                                                                  2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1, 0),
                                 outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 1, 0)])
                        .then(() => resolve('Test for cold transfer to worker B successfully is finished'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                                                                   credentials.supervisorNumber,
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

                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  true,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  TRANSFER_MODE.cold, 'in-progress',
                                                                                                  2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1, 0),
                                 outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 1, 0)])
                        .then(() => resolve(
                            'Test to verify no failure if Worker A tries to wrap up or complete task before Worker B accepts is finished.'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                                                                   credentials.supervisorNumber,
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
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  true,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  TRANSFER_MODE.cold, 'in-progress',
                                                                                                  2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before rejecting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    bobReservation.on('rejected', async() => {
                        try {
                            // check that there is only 1 participant in the conference as Bob rejected
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid,
                                                                                   'in-progress', 1);

                            // Verify customer is on-hold
                            const conference = await envTwilio.fetchConferenceByName(bobReservation.task.sid);
                            const participantPropertiesMap = await envTwilio.fetchParticipantProperties(conference.sid);
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, true,
                                                   'Customer put on-hold value');

                            // verify that on rejecting the transfer reservation, the transfer object is updated as
                            // well with the failed status
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
                        await outboundCommonHelpers.verifyConferenceProperties(aliceReservation.task.sid, 'in-progress',
                                                                               2);

                        // Keeping Bob Unavailable, Initiate Transfer, verify that transfer was NOT initiated
                        try {
                            await aliceReservation.task.transfer(credentials.multiTaskBobSid, { mode: TRANSFER_MODE.cold });
                        } catch (err) {
                            assert.strictEqual(err.response.status, 400, 'Task transfer failure error code');
                            resolve('Test to fail initiating transfer when transferee is unavailable is finished.');
                        }
                    } catch (err) {
                        reject(
                            `Failed to validate Conference properties on Alice's reservation accepted event. Error: ${err}`);
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
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  true,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  TRANSFER_MODE.cold, 'in-progress',
                                                                                                  2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    bobReservation.on('canceled', async() => {
                        try {
                            // check that there is only 1 participant in the conference as Bob's reservation got
                            // canceled
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid,
                                                                                   'in-progress', 1);

                            // verify that the transfer object is updated as well with the failed status
                            assert.strictEqual(bobReservation.transfer.status, 'failed', 'Transfer status');

                            // Verify canceled reason code is 13223 - Invalid phone number format
                            assert.strictEqual(bobReservation.canceledReasonCode, 13223, 'Canceled Reason Code');

                            resolve(
                                'Test to verify failure if transferee issues a overriding conference(options) with invalid number is finished.');
                        } catch (err) {
                            reject(
                                `Failed to validate Conference properties on Bob's reservation canceled event. Error: ${err}`);
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
            return envTwilio.updateWorkflowTaskReservationTimeout(credentials.multiTaskWorkspaceSid,
                                                                  credentials.multiTaskWorkflowSid, 120);
        });

        it('should fail if transferee does not accept reservation within time limit', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        envTwilio.updateWorkflowTaskReservationTimeout(credentials.multiTaskWorkspaceSid,
                                                                       credentials.multiTaskWorkflowSid, 10);
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  true,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  TRANSFER_MODE.cold, 'in-progress',
                                                                                                  2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Incoming Transfer');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1, 0)
                        .catch(err => reject(
                            `Error caught while wrapping and completing transferor's reservation. Error: ${err}`));

                    bobReservation.on('timeout', async() => {
                        try {
                            // check that there is only 1 participant in the conference as Bob's reservation got
                            // canceled
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid,
                                                                                   'in-progress', 1);

                            assert.strictEqual(bobReservation.transfer.status, 'failed', 'Transfer status');

                            resolve(
                                'Test to verify failure if transferee does not accept reservation within time limit is finished.');
                        } catch (err) {
                            reject(
                                `Failed to validate Conference properties on Bob's reservation canceled event. Error: ${err}`);
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

    describe('#Cold Transfer to a Worker when customer hangs up before worker accept', () => {

        it('should fail if customer hangs up before the transferee accepts', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  true,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  TRANSFER_MODE.cold, 'in-progress',
                                                                                                  2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Incoming Transfer');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    await outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1, 0)
                        .catch(err => reject(
                            `Error caught while wrapping and completing transferor's reservation. Error: ${err}`));

                    try {
                        // end the customer leg
                        let participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(
                            aliceReservation.task.sid);
                        const customerCallSid = participantPropertiesMap.get(credentials.customerNumber).callSid;
                        await envTwilio.endCall(customerCallSid);

                    } catch (err) {
                        reject(`Something went wrong when terminating customer leg. Error: ${err}`);
                    }

                    bobReservation.on('canceled', async() => {
                        try {
                            // check that the conference status is now completed because both alice and customer have
                            // left
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid, 'completed',
                                                                                   0);

                            // TODO: the transfer status should have been failed (TR-704)
                            assert.strictEqual(bobReservation.transfer.status, 'initiated', 'Transfer status');

                            resolve('Test to verify customer hanging up before transfer success has finished.');
                        } catch (err) {
                            reject(
                                `Failed to validate Conference properties on Bob's reservation canceled event. Error: ${err}`);
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

    describe('#Warm Transfer', () => {
        describe('should complete successfully', () => {
            it('when worker B accepts transfer reservation', () => {
                return new Promise(async(resolve, reject) => {
                    const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                    aliceReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      true,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      TRANSFER_MODE.warm, 'in-progress',
                                                                                                      2);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        bobReservation.on('accepted', async() => {
                            try {
                                // verify 3 participants after warm transfer completes
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                                                                       credentials.supervisorNumber,
                                                                                       'in-progress', 3);
                            } catch (err) {
                                reject(`Error caught after receiving Bob's reservation accepted event. Error: ${err}`);
                            }
                        });

                        // reservation wrap & complete listeners
                        Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 2, 0),
                                     outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 1, 0)])
                            .then(() => resolve('Test completed'))
                            .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', 'Incoming Transfer');

                            // expect task assignment is reserved before accepting
                            assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');

                            bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                reject(`Error in establishing conference for transferred worker. Error: ${err}`);
                            });
                        } catch (err) {
                            reject(
                                `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                        }
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error while establishing conference for alice. Error: ${err}`);
                    });
                });
            }).timeout(50000);

            it('when Worker A tries to wrap up task before Worker B accepts reservation', () => {
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

                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      true,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      TRANSFER_MODE.warm, 'in-progress',
                                                                                                      2);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        bobReservation.on('accepted', async() => {
                            try {
                                // verify 3 participants after warm transfer completes
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                                                                       credentials.supervisorNumber,
                                                                                       'in-progress', 3);
                            } catch (err) {
                                reject(`Error caught after receiving Bob's reservation accepted event. Error: ${err}`);
                            }
                        });

                        // reservation wrap & complete listeners
                        Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 2, 0),
                                     outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 1, 0)])
                            .then(() => resolve('Test for Worker A tries to wrap up task before Worker B accepts reservation completed.'))
                            .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', 'Incoming Transfer');

                            // expect task assignment is reserved before accepting
                            assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                        } catch (err) {
                            reject(
                                `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                        }

                        bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                            reject(`Error in establishing conference. Error: ${err}`);
                        });
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error while establishing conference for alice. Error: ${err}`);
                    });
                });
            }).timeout(55000);

            it('when multiple transfers are made', () => {
                let reservationCountWorkerA = 1;
                return new Promise(async(resolve, reject) => {
                    await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);
                    alice.on('reservationCreated', async(aliceReservation) => {
                        try {
                            if (reservationCountWorkerA === 2) {
                                AssertionUtils.verifyTransferProperties(aliceReservation.transfer,
                                                                        credentials.multiTaskBobSid, credentials.multiTaskAliceSid, TRANSFER_MODE.warm, 'WORKER', 'initiated', 'Transfer');
                                AssertionUtils.verifyTransferProperties(aliceReservation.task.transfers.incoming,
                                                                        credentials.multiTaskBobSid, credentials.multiTaskAliceSid, TRANSFER_MODE.warm, 'WORKER', 'initiated', 'Incoming Transfer');
                            } else {
                                outboundCommonHelpers.assertOnReservationCreated(alice);
                            }
                        } catch (err) {
                            reject(`Failed to validate Reservation/Task/Transfer properties on reservation created event. Error: ${err}`);
                        }

                        aliceReservation.on('accepted', async() => {
                            try {
                                if (reservationCountWorkerA === 2) {
                                    await outboundCommonHelpers.assertOnTransfereeAccepted(aliceReservation, credentials.workerNumber, 'in-progress', 3);
                                } else {
                                    await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskBobSid,
                                                                                                              true, credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'in-progress', 2);
                                }
                            } catch (err) {
                                reject(`Error caught after receiving reservation ${aliceReservation.sid} accepted event. Error: ${err}`);
                            }
                        });

                        if (reservationCountWorkerA === 2) {
                            outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, false, 1, 0).then(() => resolve('Test for multiple WARM transfers finished.'))
                                .catch(err => reject(`Error caught while wrapping and completing Alice reservation. Error: ${err}`));

                            aliceReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                reject(`Error in establishing conference. Error: ${err}`);
                            });
                        } else if (reservationCountWorkerA === 1) {
                            outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 2, 0)
                                .catch(err => reject(`Error caught while wrapping and completing Alice reservation. Error: ${err}`));
                        }

                        if (reservationCountWorkerA === 1) {
                            // if this is 1st reservation accept request from worker A
                            aliceReservation.conference().catch(err => {
                                reject(`Error in establishing conference. Error: ${err}`);
                            });
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid, credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER', 'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid, credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER', 'initiated', 'Incoming Transfer');

                        } catch (err) {
                            reject(`Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                        }

                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, true, 1, 0)
                            .catch(err => reject(`Error caught while wrapping and completing Bob reservation. Error: ${err}`));

                        bobReservation.on('accepted', async() => {
                            try {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation, credentials.supervisorNumber,
                                                                                       'in-progress', 3);

                                // validate that the supervisor is on mute
                                let participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(bobReservation.task.sid);
                                const workerProperties = participantPropertiesMap.get(credentials.workerNumber);
                                await envTwilio.endCall(workerProperties.callSid);

                                reservationCountWorkerA++;
                                await pauseTestExecution(STATUS_CHECK_DELAY); // wait for current alice reservation to complete
                                await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(bobReservation, credentials.multiTaskAliceSid,
                                                                                                          true, credentials.multiTaskAliceSid, TRANSFER_MODE.warm, 'in-progress', 2);

                            } catch (err) {
                                reject(`Error caught after receiving Bob reservation accepted event. Error: ${err}`);
                            }
                        });

                        bobReservation.conference().catch(err => {
                            reject(`Error in establishing conference. Error: ${err}`);
                        });
                    });
                });
            }).timeout(60000);

            it('when worker B accept the 2nd transfer after worker A cancelling the 1st Transfer', () => {
                let aliceTransferCount = 0;
                let bobReservationCount = 0;

                return new Promise(async(resolve, reject) => {
                    const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                    aliceReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.verifyConferenceProperties(aliceReservation.task.sid, 'in-progress', 2);
                            await envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid);

                            // alice making the 1st transfer
                            await aliceReservation.task.transfer(credentials.multiTaskBobSid, { mode: TRANSFER_MODE.warm });

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
                                    await aliceReservation.task.transfer(credentials.multiTaskBobSid, { mode: TRANSFER_MODE.warm });
                                } catch (err) {
                                    console.log(err);
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
                                credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                'initiated', 'Transfer');
                            // assert the Task transfers object
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                credentials.multiTaskAliceSid,
                                credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
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
            }).timeout(15000);
        });

        describe('should fail', () => {
            it('when Worker B rejects transfer reservation', () => {
                return new Promise(async(resolve, reject) => {
                    const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                    aliceReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      true,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      TRANSFER_MODE.warm, 'in-progress',
                                                                                                      2);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', 'Incoming Transfer');

                            // expect task assignment is reserved before rejecting
                            assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                        } catch (err) {
                            reject(
                                `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                        }

                        bobReservation.on('rejected', async() => {
                            try {
                                // check that there are only 2 participants in the conference since Bob rejected
                                await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid,
                                                                                       'in-progress', 2);

                                // Verify customer is on-hold
                                const conference = await envTwilio.fetchConferenceByName(bobReservation.task.sid);
                                const participantPropertiesMap = await envTwilio.fetchParticipantProperties(conference.sid);
                                assert.deepStrictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, true,
                                                       'Customer put on-hold value');

                                // verify that on rejecting the transfer reservation, the transfer object is updated as
                                // well with the failed status
                                assert.strictEqual(bobReservation.transfer.status, 'failed', 'Transfer status');
                                assert.strictEqual(aliceReservation.task.transfers.outgoing.transferFailedReason,
                                                   'Transfer failed because the reservation was rejected',
                                                   'Transfer failed reason');
                                resolve('Test for failure if transferee rejects is finished.');
                            } catch (err) {
                                reject(`Error caught after receiving reservation rejected event. Error: ${err}`);
                            }
                        });

                        // Wait for wrap-up event on aliceReservation before rejecting reservation for Worker B
                        await pauseTestExecution(STATUS_CHECK_DELAY);
                        bobReservation.reject().catch(err => {
                            reject(`Error in rejecting Bob's reservation. Error: ${err}`);
                        });
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error while establishing conference for alice. Error: ${err}`);
                    });
                });
            }).timeout(20000);
        });
    });

    describe('#Back to Back Cold Transfer for Workers', () => {
        it('should transfer task Worker B and then transfers back Worker A', () => {
            let firstTransfer = true;
            return new Promise(async(resolve, reject) => {
                await alice.createTask(credentials.customerNumber, credentials.flexCCNumber,
                                       credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);

                alice.on('reservationCreated', async(aliceReservation) => {
                    try {
                        if (firstTransfer) {
                            outboundCommonHelpers.assertOnReservationCreated(alice);
                            // if this is 1st accept request from worker A
                            aliceReservation.conference().catch(err => {
                                reject(`Error in establishing conference. Error: ${err}`);
                            });
                        } else {
                            AssertionUtils.verifyTransferProperties(aliceReservation.transfer,
                                                                    credentials.multiTaskBobSid,
                                                                    credentials.multiTaskAliceSid, TRANSFER_MODE.cold, 'WORKER',
                                                                    'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(aliceReservation.task.transfers.incoming,
                                                                    credentials.multiTaskBobSid,
                                                                    credentials.multiTaskAliceSid, TRANSFER_MODE.cold, 'WORKER',
                                                                    'initiated', 'Incoming Transfer');
                            // Wait for wrapup event on bobReservation before issuing conference instruction for Worker
                            // A
                            await pauseTestExecution(STATUS_CHECK_DELAY);
                            aliceReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                reject(`Error in establishing conference. Error: ${err}`);
                            });
                        }
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation/Task/Transfer properties on reservation created event. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            if (firstTransfer) {
                                await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(
                                    aliceReservation, credentials.multiTaskBobSid,
                                    true, credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'in-progress', 2);

                            } else {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(aliceReservation,
                                                                                       credentials.workerNumber,
                                                                                       'in-progress', 2);
                            }
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                        }
                    });

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, firstTransfer, 1, 0)
                        .then(() => {
                            if (!firstTransfer) {
                                resolve('Test for transfer task back to Worker A when Worker B rejects is finished');
                            }
                        })
                        .catch(err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', 'Incoming Transfer');

                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event. Error: ${err}`);
                    }

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, true, 1, 0)
                        .catch(
                            err => reject(`Error caught while wrapping and completing reservation. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                                                                   credentials.supervisorNumber,
                                                                                   'in-progress', 2);
                            // initiate a transfer back
                            firstTransfer = false;
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(
                                bobReservation, credentials.multiTaskAliceSid,
                                true, credentials.multiTaskAliceSid, TRANSFER_MODE.cold, 'in-progress', 2);

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
            });
        }).timeout(75000);
    });

});

