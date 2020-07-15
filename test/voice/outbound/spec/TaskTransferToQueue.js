import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import OutboundCommonHelpers from '../../../util/OutboundCommonHelpers';
import { TRANSFER_MODE } from '../../../util/Constants';
import SyncClientInstance from '../../../util/SyncClientInstance';

const credentials = require('../../../env');
const chai = require('chai');
chai.use(require('sinon-chai'));
const assert = chai.assert;

const it = require('repeat-it');

describe('Task Transfer to Queue for Outbound Voice Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, null, null, { useSync: true });
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const outboundCommonHelpers = new OutboundCommonHelpers(envTwilio);
    let alice;
    let bob;
    const syncClient = new SyncClientInstance(bobToken);

    after(() => {
        syncClient.shutdown();
    });

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
        it(credentials.iterations)('should transfer task to Worker B in queue successfully', () => {
            return new Promise(async(resolve, reject) => {
                let bobReservation;
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);
                const taskSid = aliceReservation.task.sid;

                const syncMap = await syncClient._fetchSyncMap(taskSid);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                            true, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2, syncClient, syncMap);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                aliceReservation.on('wrapup', async() => {
                    bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                        reject(`Error in establishing conference for transferred worker on Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });

                bob.on('reservationCreated', async(bobRes) => {
                    bobReservation = bobRes;
                    try {
                        AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                            credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Transfer');
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Incoming Transfer');

                        // expect task assignment is reserved before accepting
                        assert.strictEqual(bobReservation.task.status, 'reserved', 'Transfer Task Assignment Status');
                    } catch (err) {
                        reject(`Failed to validate Reservation ${bobReservation.sid} and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    }

                    Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                        .then(() => resolve('Test for cold transfer to worker B successfully is finished'))
                        .catch(err => reject(`Error caught while wrapping and completing reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                    bobReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                'in-progress', 2, syncClient, syncMap);

                            envTwilio.terminateParticipantCall(taskSid, [credentials.supervisorNumber]);
                        } catch (err) {
                            reject(`Error caught after receiving Bob's reservation accepted event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        });
    });

    describe('#Cold Transfer with worker capacity > 1', () => {
        afterEach(() => {
            return envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, alice.sid, 'default', 1);
        });

        it(credentials.iterations)('should transfer back to Worker A if it is the only worker in queue', () => {
            let reservationCountWorkerA = 1;
            let syncMap;
            return new Promise(async(resolve, reject) => {
                alice.on('reservationCreated', async(aliceReservation) => {
                    try {
                        if (reservationCountWorkerA === 2) {
                            assert.strictEqual(aliceReservation.task.status, 'reserved', 'Task Status');
                            resolve('Test for transfer back to Worker A if it is the only worker in queue is finished');
                        }
                        outboundCommonHelpers.assertOnReservationCreated(alice);
                    } catch (err) {
                        reject(`Failed to validate Reservation ${aliceReservation.sid} and Task properties on reservation created event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            reservationCountWorkerA++;
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                                false, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2, syncClient, syncMap);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error in establishing conference for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    });
                });

                await envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, alice.sid, 'default', 2);
                const taskSid = await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);

                syncMap = await syncClient._fetchSyncMap(taskSid);
            });
        });
    });

    describe('#Failed Cold Transfer to Queue', () => {
        it(credentials.iterations)('should transfer task back to Worker A when Worker B rejects', () => {
            let reservationCountWorkerA = 1;
            return new Promise(async(resolve, reject) => {
                let bobReservation;
                let taskSid;
                let syncMap;

                alice.on('reservationCreated', async(aliceReservation) => {
                    reservationCountWorkerA++;
                    try {
                        if (reservationCountWorkerA === 2) {
                            assert.strictEqual(aliceReservation.task.status, 'reserved', 'Task Status');
                            resolve('Test for transfer task back to Worker A when Worker B rejects is finished');
                        }
                        await outboundCommonHelpers.assertOnReservationCreated(alice);
                    } catch (err) {
                        reject(`Failed to validate Reservation ${aliceReservation.sid} and Task properties on reservation created event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                                true, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2, syncClient, syncMap);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    await outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true)
                        .catch(err => reject(
                            `Error caught while wrapping and completing Alice's reservation for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`));

                    bob.on('reservationCreated', async(bobRes) => {
                        bobReservation = bobRes;
                        try {
                            AssertionUtils.verifyTransferProperties(bobReservation.transfer,
                                credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Transfer');
                            AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                                credentials.multiTaskAliceSid, credentials.multiTaskQueueSid, 'COLD', 'QUEUE', 'initiated', 'Incoming Transfer');
                            await bobReservation.reject().catch(err => reject(
                                `Error in rejecting Bob's reservation for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));
                        } catch (err) {
                            reject(`Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    aliceReservation.conference().catch(err => {
                        reject(`Error in establishing conference for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    });
                });

                taskSid = await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);
                syncMap = await syncClient._fetchSyncMap(taskSid);
            });
        });
    });

    describe('#Warm Transfer To a Queue', () => {
        it(credentials.iterations)('should complete successfully when worker B accept the 2nd transfer after worker A cancelling the 1st Transfer to Queue', () => {
            /**
             * 1. Alice makes 1st WARM transfers to Queue
             * 2. Alice cancels the 1st transfer before Bob accepts it
             * 3. Alice makes 2nd WARM transfers to Queue after cancelling the 1st transfer
             * 4. Bob accepts 2nd transfer with a conference instruction
             */

            let aliceTransferCount = 0;
            let bobReservationCount = 0;

            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);
                const taskSid = aliceReservation.task.sid;

                const syncMap = await syncClient._fetchSyncMap(taskSid);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.verifyConferenceProperties(aliceReservation.task.sid, 'in-progress', 2);
                        await envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid);

                        aliceReservation.task.on('transferInitiated', async(outgoingTransfer) => {
                            aliceTransferCount++;
                            try {
                                assert.strictEqual(outgoingTransfer.status, 'initiated', 'Outgoing Transfer Status');

                                await syncClient.waitForCustomerHoldStatus(syncMap, true);

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

                        // 1. Alice makes 1st WARM transfers to Queue
                        await aliceReservation.task.transfer(credentials.multiTaskQueueSid, { mode: TRANSFER_MODE.warm }).catch(err => {
                            reject(`Failed to make the 1st transfer reservationSid=${aliceReservation.sid}. ${err}`);
                        });

                        aliceReservation.task.transfers.outgoing.on('canceled', async(updatedTransfer) => {
                            try {
                                assert.equal(updatedTransfer.status, 'canceled');
                                // 3. Alice makes 2nd WARM transfers to Queue after cancelling the 1st transfer
                                await aliceReservation.task.transfer(credentials.multiTaskQueueSid, { mode: TRANSFER_MODE.warm });
                            } catch (err) {
                                reject(`Error while alice making the 2nd transfer to Bob. reservationSid=${aliceReservation}. Error: ${err}`);
                            }
                        });
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. sid=${aliceReservation}. Error: ${err}`);
                    }
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
                            credentials.multiTaskQueueSid, TRANSFER_MODE.warm, 'QUEUE',
                            'initiated', 'Transfer');
                        // assert the Task transfers object
                        AssertionUtils.verifyTransferProperties(bobReservation.task.transfers.incoming,
                            credentials.multiTaskAliceSid,
                            credentials.multiTaskQueueSid, TRANSFER_MODE.warm, 'QUEUE',
                            'initiated', 'Incoming Transfer');

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
        });
    });

    describe('#Back to Back Cold Transfer to Queue', () => {
        it(credentials.iterations)('should transfer task to queue having Worker B which transfers back to Queue with Worker A', () => {
            let reservationCountWorkerA = 1;

            return new Promise(async(resolve, reject) => {
                let syncMap;

                const taskSid = await alice.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);

                alice.on('reservationCreated', async(aliceReservation) => {
                    syncMap = await syncClient._fetchSyncMap(taskSid);

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
                        reject(`Failed to validate Reservation/Task/Transfer properties on reservation ${aliceReservation.sid} created event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }

                    aliceReservation.on('accepted', async() => {
                        try {
                            if (reservationCountWorkerA === 2) {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(aliceReservation, 'in-progress', 2, syncClient, syncMap);

                                // end
                                await envTwilio.terminateParticipantCall(taskSid, [credentials.customerNumber, credentials.workerNumber]);
                            } else {
                                await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskQueueSid,
                                    true, credentials.multiTaskBobSid, 'COLD', 'in-progress', 2, syncClient, syncMap);
                            }
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
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
                            reject(`Failed to validate Reservation ${bobReservation.sid} and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }

                        outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, true)
                            .catch(err => reject(`Error caught while wrapping and completing reservation 
                                for Outbound Task ${bobReservation.task.sid}. Error: ${err}`));

                        bobReservation.on('accepted', async() => {
                            try {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation,
                                    'in-progress', 2, syncClient, syncMap);

                                reservationCountWorkerA++;
                                await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(bobReservation, credentials.multiTaskQueueSid,
                                    true, credentials.multiTaskAliceSid, 'COLD', 'in-progress', 2, syncClient, syncMap);

                            } catch (err) {
                                reject(`Error caught after receiving reservation rejected event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                            }
                        });

                        bobReservation.conference().catch(err => {
                            reject(`Error in establishing conference for bob for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        });
                    });

                    if (reservationCountWorkerA === 1) {
                        aliceReservation.conference().catch(err => {
                            reject(`Error in establishing conference for alice 1 for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        });
                    } else {
                        aliceReservation.conference({ endConferenceOnExit: true }).catch(err => {
                            reject(`Error in establishing conference for alice 2 for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                        });
                    }
                });
            });
        });
    });
});

