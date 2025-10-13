import EnvTwilio from '../../../../util/EnvTwilio';
import Worker from '../../../../../lib/Worker';
import { getAccessToken } from '../../../../util/MakeAccessToken';
import AssertionUtils from '../../../../util/AssertionUtils';
import OutboundCommonHelpers from '../../../../util/OutboundCommonHelpers';
import CommonHelpers from '../../../../util/CommonHelpers';
import { pauseTestExecution } from '../../VoiceBase';
import { TRANSFER_MODE } from '../../../../util/Constants';
import SyncClientInstance from '../../../../util/SyncClientInstance';
import { buildRegionForEventBridge } from '../../../../integration_test_setup/IntegrationTestSetupUtils';

const STATUS_CHECK_DELAY = 1000;

const credentials = require('../../../../env');
const chai = require('chai');
chai.use(require('sinon-chai'));
const assert = chai.assert;
const expect = chai.expect;

describe('Task Transfer to Worker for Outbound Voice Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                      credentials.multiTaskAliceSid, null, null, { useSync: true });
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                    credentials.multiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
    const outboundCommonHelpers = new OutboundCommonHelpers(envTwilio);
    const commonHelpers = new CommonHelpers(envTwilio);
    let alice;
    let bob;
    let aliceSyncClient;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            // Make Alice available
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge
            });

            alice.on('ready', async() => {
                    alice.setAttributes({ 'contact_uri': credentials.workerNumber });
            });

            // bob stays offline
            bob = new Worker(bobToken, {
                connectActivitySid: credentials.multiTaskUpdateActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge
            });
            aliceSyncClient = new SyncClientInstance(aliceToken);
            return outboundCommonHelpers.listenToWorkerReadyOrErrorEvent(alice);
        });
    });

    afterEach(() => {
        alice.removeAllListeners();
        bob.removeAllListeners();
        aliceSyncClient.shutdown();
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
                        reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                                 outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                        .then(() => resolve('Test for cold transfer to worker B successfully is finished'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                'in-progress', 2);
                        } catch (err) {
                            reject(`Error caught after receiving Bob's reservation accepted event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                        reject(`Error in establishing conference for transferred worker on Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        }).timeout(50000);

        // ORCH-2243 filed to fix failures of other tests when this one is present
        it('should complete a transfer of an outbound call to worker B successfully with dual recording channels', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        try {
                            await commonHelpers.verifyDualChannelRecording(aliceReservation, credentials.workerNumber);
                        } catch (err) {
                            reject(`Error verifying dual channel recordings for ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  true,
                                                                                                  credentials.multiTaskBobSid,
                                                                                                  TRANSFER_MODE.cold, 'in-progress',
                                                                                                  2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    commonHelpers.verifyIncomingColdTransfer(bobReservation, reject);
                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                                outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                        .then(() => {
                            resolve('Test for cold transfer to worker B is finished');
                        })
                        .catch(err => reject(`Error caught while wrapping and completing reservation for Task ${bobReservation.task.sid}. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await commonHelpers.verifyDualChannelRecording(bobReservation, credentials.supervisorNumber);
                        } catch (err) {
                            reject(`Error verifying dual channel recordings for Bob ${bobReservation.task.sid}. Error: ${err}`);
                        }

                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation, 'in-progress', 2, 'outbound');
                        } catch (err) {
                            reject(`Error caught after receiving Bob's reservation accepted event for Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    // wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);

                    // issue the conference instruction for Bob (it will accept the reservation too)
                    bobReservation.conference({ endConferenceOnExit: true,
                        record: 'true',
                        recordingChannels: 'dual',
                        recordingStatusCallback: 'https://myapp.com/recording-events',
                        recordingStatusCallbackEvent: 'in-progress completed',
                        recordingStatusCallbackMethod: 'POST' }).catch(err => {
                        reject(`Error in establishing conference for Inbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });

                aliceReservation.conference({
                    endConferenceOnExit: false,
                    record: 'true',
                    recordingChannels: 'dual',
                    recordingStatusCallback: 'https://myapp.com/recording-events',
                    recordingStatusCallbackEvent: 'in-progress completed',
                    recordingStatusCallbackMethod: 'POST'
                }).catch(err => {
                    reject(`Error in establishing conference. Error: ${err}`);
                });
            });
        }).timeout(100000);

        // ORCH-1799 filed for unreliable test
        it.skip('should not fail even if Worker A tries to wrap up task before Worker B accepts', () => {
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
                        reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                                 outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                        .then(() => resolve(
                            'Test to verify no failure if Worker A tries to wrap up or complete task before Worker B accepts is finished.'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                'in-progress', 2);
                        } catch (err) {
                            reject(`Error caught after receiving Bob's reservation accepted event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                        reject(`Error in establishing conference for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        }).timeout(55000);
    });

    describe('#Failed Cold Transfer to a Worker', () => {
        it('should fail if transferee rejects', () => {
            let bobReservationCount = 0;
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
                        reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    bobReservationCount++;
                    if (bobReservationCount === 1) {
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                credentials.multiTaskAliceSid,
                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                credentials.multiTaskAliceSid,
                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                            // expect task assignment is reserved before rejecting
                            assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                        } catch (err) {
                            reject(
                                `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
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
                            reject(`Error caught after receiving reservation rejected event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before rejecting reservation for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.reject().catch(err => {
                        reject(`Error in rejecting Bob's reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference on alice for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        });

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
                            expect(err.toString()).contain('status code 400', 'Task transfer failure error code');
                            resolve('Test to fail initiating transfer when transferee is unavailable is finished.');
                        }
                    } catch (err) {
                        reject(
                            `Failed to validate Conference properties on Alice's reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        });

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
                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
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
                                `Failed to validate Conference properties on Bob's reservation canceled event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.conference({ endConferenceOnExit: true, to: '+11111111111' }).catch(err => {
                        reject(`Error in establishing conference for transferred worker on Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        });
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
                        reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    }

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true, 1)
                        .catch(err => reject(
                            `Error caught while wrapping and completing transferor's reservation for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`));

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
                                `Failed to validate Conference properties on Bob's reservation canceled event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });
                    // Do not issue the conference instruction for Worker B's reservation as we don't want it to accept
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        });
    });

    describe.skip('#Cold Transfer to a Worker when customer hangs up before worker accept', () => {
        // ORCH-1832 filed for unreliable test
        it.skip('should fail if customer hangs up before the transferee accepts', () => {
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
                        reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    }

                    aliceReservation.on('wrapup', async() => {
                        try {
                            assert.strictEqual(aliceReservation.task.status, 'reserved', 'Task status on Transferor Reservation reserved');
                            await aliceReservation.complete();
                        } catch (err) {
                            reject(`Error caught while wrapping transferor's reservation for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    aliceReservation.on('completed', async() => {
                        try {
                            assert.strictEqual(aliceReservation.task.status, 'reserved', 'Task status on Transferor Reservation reserved');
                        } catch (err) {
                            reject(`Error caught while completing transferor's reservation ${aliceReservation.sid} for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    try {
                        // end the customer leg
                        let participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(
                            aliceReservation.task.sid);
                        const customerCallSid = participantPropertiesMap.get(credentials.customerNumber).callSid;
                        await envTwilio.endCall(customerCallSid);

                    } catch (err) {
                        reject(`Something went wrong when terminating customer leg for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
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
                                `Failed to validate Conference properties on Bob's reservation canceled event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });
                    // Do not issue the conference instruction for Worker B's reservation as we don't want it to accept
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        });
    });

    describe('#Warm Transfer', () => {
        describe('should complete successfully', () => {
            it('when worker B accepts transfer reservation', () => {
                return new Promise(async(resolve, reject) => {
                    const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                    // Bring Bob online
                    await envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid);

                    aliceReservation.on('accepted', async() => {
                        try {
                            let syncMap = await aliceSyncClient._fetchSyncMap(aliceReservation.task.sid);
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransferWithSyncClient(
                                aliceReservation,
                                credentials.multiTaskBobSid,
                                true,
                                credentials.multiTaskBobSid,
                                TRANSFER_MODE.warm,
                                'in-progress',
                                2,
                                aliceSyncClient,
                                syncMap);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        bobReservation.on('accepted', async() => {
                            try {
                                // verify 3 participants after warm transfer completes
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                    'in-progress', 3);
                            } catch (err) {
                                reject(`Error caught after receiving Bob's reservation accepted event. Error: ${err}`);
                            }
                        });

                        // reservation wrap & complete listeners
                        Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                            outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                            .then(() => resolve('Test completed'))
                            .catch(err => reject(`Error caught while wrapping and completing reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Incoming Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                            // expect task assignment is reserved before accepting
                            assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');

                            bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                reject(`Error in establishing conference for transferred worker for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                            });
                        } catch (err) {
                            reject(
                                `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    });
                });
            }).timeout(55000);

            // ORCH-1781 filed for unreliable test
            it.skip('when Worker A tries to wrap up task before Worker B accepts reservation', () => {
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
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        bobReservation.on('accepted', async() => {
                            try {
                                // verify 3 participants after warm transfer completes
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                    'in-progress', 3);
                            } catch (err) {
                                reject(`Error caught after receiving Bob's reservation accepted event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                            }
                        });

                        // reservation wrap & complete listeners
                        Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                                     outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                            .then(() => resolve('Test for Worker A tries to wrap up task before Worker B accepts reservation completed.'))
                            .catch(err => reject(`Error caught while wrapping and completing reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                            // expect task assignment is reserved before accepting
                            assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                        } catch (err) {
                            reject(
                                `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }

                        bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                            reject(`Error in establishing conference for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        });
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    });
                });
            }).timeout(60000);

            // ORCH-1782 filed for unreliable test
            it.skip('when multiple transfers are made', () => {
                let reservationCountWorkerA = 1;
                return new Promise(async(resolve, reject) => {
                    await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);
                    alice.on('reservationCreated', async(aliceReservation) => {
                        try {
                            if (reservationCountWorkerA === 2) {
                                AssertionUtils.verifyTransferProperties(aliceReservation.transfer,
                                                                        credentials.multiTaskBobSid, credentials.multiTaskAliceSid, TRANSFER_MODE.warm, 'WORKER',
                                                                        'initiated', `Transfer (account ${credentials.accountSid}, task ${aliceReservation.task.sid})`);
                                AssertionUtils.verifyTransferProperties(aliceReservation.task.transfers.incoming,
                                                                        credentials.multiTaskBobSid, credentials.multiTaskAliceSid, TRANSFER_MODE.warm, 'WORKER',
                                                                        'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${aliceReservation.task.sid})`);
                            } else {
                                outboundCommonHelpers.assertOnReservationCreated(alice);
                            }
                        } catch (err) {
                            reject(`Failed to validate Reservation/Task/Transfer properties on reservation created event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }

                        aliceReservation.on('accepted', async() => {
                            try {
                                if (reservationCountWorkerA === 2) {
                                    await outboundCommonHelpers.assertOnTransfereeAccepted(aliceReservation, 'in-progress', 3);
                                } else {
                                    await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskBobSid,
                                                                                                              true, credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'in-progress', 2);
                                }
                            } catch (err) {
                                reject(`Error caught after receiving reservation ${aliceReservation.sid} accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                            }
                        });

                        if (reservationCountWorkerA === 2) {
                            outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, false, 0).then(() => resolve('Test for multiple WARM transfers finished.'))
                                .catch(err => reject(`Error caught while wrapping and completing Alice 2nd reservation for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`));

                            aliceReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                reject(`Error in establishing conference for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                            });
                        } else if (reservationCountWorkerA === 1) {
                            outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true)
                                .catch(err => reject(`Error caught while wrapping and completing Alice 1st reservation for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`));

                            aliceReservation.conference().catch(err => {
                                reject(`Error in establishing conference for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                            });
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid, credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid, credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                        } catch (err) {
                            reject(`Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }

                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, true, 1)
                            .catch(err => reject(`Error caught while wrapping and completing Bob reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                        bobReservation.on('accepted', async() => {
                            try {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
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
                                reject(`Error caught after receiving Bob reservation accepted event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                            }
                        });

                        bobReservation.conference().catch(err => {
                            reject(`Error in establishing conference for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        });
                    });
                });
            }).timeout(75000);

            it('when worker B accept the 2nd transfer after worker A cancelling the 1st Transfer to Worker', () => {
                /**
                 * 1. Alice makes 1st WARM transfers to Worker
                 * 2. Alice cancels the 1st transfer before Bob accepts it
                 * 3. Alice makes 2nd WARM transfers to Worker after cancelling the 1st transfer
                 * 4. Bob accepts 2nd transfer with a conference instruction
                 */
                let aliceTransferCount = 0;
                let bobReservationCount = 0;

                return new Promise(async(resolve, reject) => {
                    const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                    aliceReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.verifyConferenceProperties(aliceReservation.task.sid, 'in-progress', 2);
                            await envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid);

                            aliceReservation.task.on('transferInitiated', async(outgoingTransfer) => {
                                aliceTransferCount++;
                                try {
                                    assert.strictEqual(outgoingTransfer.status, 'initiated', 'Outgoing Transfer Status');

                                    await pauseTestExecution(STATUS_CHECK_DELAY);

                                    const conference = await envTwilio.fetchConferenceByName(aliceReservation.task.sid);
                                    const participantPropertiesMap = await envTwilio.fetchParticipantProperties(conference.sid);
                                    assert.deepStrictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, true, 'Customer put on-hold value');

                                    // 2. Alice cancels the 1st transfer before Bob accepts it
                                    if (aliceTransferCount === 1) {
                                        await outgoingTransfer.cancel();
                                    }
                                } catch (err) {
                                    reject(`Error while alice canceling 1st transfer. reservationSid=${aliceReservation.sid}. Error: ${err}`);
                                }
                            });

                            // 1. Alice makes 1st WARM transfers to Worker
                            await aliceReservation.task.transfer(credentials.multiTaskBobSid, { mode: TRANSFER_MODE.warm }).catch(err => {
                                reject(`Failed to make the 1st transfer. reservationSid=${aliceReservation.sid}. ${err}`);
                            });

                            aliceReservation.task.transfers.outgoing.on('canceled', async(updatedTransfer) => {
                                try {
                                    assert.equal(updatedTransfer.status, 'canceled');
                                    // 3. Alice makes 2nd WARM transfers to Worker after cancelling the 1st transfer
                                    await aliceReservation.task.transfer(credentials.multiTaskBobSid, { mode: TRANSFER_MODE.warm });
                                } catch (err) {
                                    reject(`Error while alice making the 2nd transfer to Bob. reservationSid=${aliceReservation}. Error: ${err}`);
                                }
                            });
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event. sid=${aliceReservation}. Error: ${err}`);                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        bobReservationCount++;
                        bobReservation.on('accepted', async() => {
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid, 'in-progress', 3);
                            if (bobReservationCount === 2) {
                                // Make sure Bob's second reservation is getting accepted
                                resolve('Test succeeded: should reassign task and send reservation.accepted event to an available worker on 2nd transfer' +
                                    ' when transferee cancels the 1st transfer');
                            } else {
                                reject(`Bob should not accept the 1st reservation sid=${bobReservation}`);
                            }
                        });

                        try {
                            // assert the Reservation transfer object
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                credentials.multiTaskAliceSid,
                                credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                            // assert the Task transfers object
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                credentials.multiTaskAliceSid,
                                credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                            if (bobReservationCount === 2) {
                                // 4. Bob accepts 2nd transfer with a conference instruction
                                await bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                    reject(`Error while establishing conference for bob. sid=${bobReservation.sid}. Error: ${err}`);
                                });
                            }
                        } catch (err) {
                            reject(
                              `Failed to validate Reservation and Transfer properties sid=${bobReservation.sid}. Error: ${err}`);
                        }
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error while establishing conference for alice. Error: ${err}`);
                    });
                });
            }).timeout(45000);
        });

        describe('should fail', () => {
            // ORCH-1787 filed for unreliable test
            it.skip('when Worker B rejects transfer reservation', () => {
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
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                    credentials.multiTaskAliceSid,
                                                                    credentials.multiTaskBobSid, TRANSFER_MODE.warm, 'WORKER',
                                                                    'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                            // expect task assignment is reserved before rejecting
                            assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                        } catch (err) {
                            reject(
                                `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
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
                                reject(`Error caught after receiving reservation rejected event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                            }
                        });

                        // Wait for wrap-up event on aliceReservation before rejecting reservation for Worker B
                        await pauseTestExecution(STATUS_CHECK_DELAY);
                        bobReservation.reject().catch(err => {
                            reject(`Error in rejecting Bob's reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        });
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    });
                });
            }).timeout(20000);
        });
    });

    describe.skip('#Back to Back Cold Transfer for Workers', () => {
        // ORCH-1800 filed for unreliable test
        it.skip('should transfer task Worker B and then transfers back Worker A', () => {
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
                                                                    'initiated', `Transfer (account ${credentials.accountSid}, task ${aliceReservation.task.sid})`);
                            AssertionUtils.verifyTransferProperties(aliceReservation.task.transfers.incoming,
                                                                    credentials.multiTaskBobSid,
                                                                    credentials.multiTaskAliceSid, TRANSFER_MODE.cold, 'WORKER',
                                                                    'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${aliceReservation.task.sid})`);
                            // Wait for wrapup event on bobReservation before issuing conference instruction for Worker
                            // A
                            await pauseTestExecution(STATUS_CHECK_DELAY);
                            aliceReservation.conference({ endConferenceOnExit: true }).catch(err => {
                                reject(`Error in establishing conference. Error: ${err}`);
                            });
                        }
                    } catch (err) {
                        reject(
                            `Failed to validate Reservation/Task/Transfer properties on reservation created event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            if (firstTransfer) {
                                await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(
                                    aliceReservation, credentials.multiTaskBobSid,
                                    true, credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'in-progress', 2);

                            } else {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(aliceReservation,
                                    'in-progress', 2);
                            }
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, firstTransfer)
                        .then(() => {
                            if (!firstTransfer) {
                                resolve('Test for transfer task back to Worker A when Worker B rejects is finished');
                            }
                        })
                        .catch(err => reject(`Error caught while wrapping and completing reservation for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`));
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                                                credentials.multiTaskAliceSid,
                                                                credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                                'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${bobReservation.task.sid})`);

                    } catch (err) {
                        reject(
                            `Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    }

                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, true)
                        .catch(
                            err => reject(`Error caught while wrapping and completing reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                'in-progress', 2);
                            // initiate a transfer back
                            firstTransfer = false;
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(
                                bobReservation, credentials.multiTaskAliceSid,
                                true, credentials.multiTaskAliceSid, TRANSFER_MODE.cold, 'in-progress', 2);

                        } catch (err) {
                            reject(`Error caught after receiving reservation rejected event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    // Wait for wrapup event on aliceReservation before accepting reservation for Worker B
                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    bobReservation.conference().catch(err => {
                        reject(`Error in establishing conference for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });
            });
        }).timeout(75000);
    });
});
