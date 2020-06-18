import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import OutboundCommonHelpers from '../../../util/OutboundCommonHelpers';
import { pauseTestExecution } from '../../VoiceBase';

const STATUS_CHECK_DELAY = 1000;
const credentials = require('../../../env');
const chai = require('chai');
chai.use(require('sinon-chai'));
const assert = chai.assert;

describe('Outbound Voice Task', () => {
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

    describe('#Outbound Task during Transfer', () => {
        it('should let worker A put worker B or herself on hold/unhold successfully', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskBobSid,
                            true, credentials.multiTaskBobSid, 'WARM', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation ${aliceReservation.sid} accepted event for Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    bobReservation.on('accepted', async() => {
                        try {
                            // Verify that there are 3 participant in conference (Alice, Bob and Customer)
                            await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid, 'in-progress', 3);

                            // Initially both Worker A and B are un-hold
                            let participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(aliceReservation.task.sid);
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.workerNumber).hold, false, 'Worker A put on-hold value');
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.supervisorNumber).hold, false, 'Worker B put on-hold value');

                            // Worker A puts worker B on hold
                            await aliceReservation.task.hold(credentials.multiTaskBobSid, true);

                            // Verify worker B is on hold in conference
                            await pauseTestExecution(STATUS_CHECK_DELAY);
                            participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(bobReservation.task.sid);
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.supervisorNumber).hold, true, 'Worker B put on-hold value');

                            // Worker A un-holds worker B
                            await aliceReservation.task.hold(credentials.multiTaskBobSid, false);

                            // Verify worker B is un-holded in conference
                            await pauseTestExecution(STATUS_CHECK_DELAY);
                            participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(bobReservation.task.sid);
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.supervisorNumber).hold, false, 'Worker B put on-hold value');

                            // Worker A puts herself on hold
                            await aliceReservation.task.hold(credentials.multiTaskAliceSid, true);

                            // Verify worker A is on hold in conference
                            await pauseTestExecution(STATUS_CHECK_DELAY);
                            participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(aliceReservation.task.sid);
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.workerNumber).hold, true, 'Worker A put on-hold value');

                            // Worker A un-holds herself
                            await aliceReservation.task.hold(credentials.multiTaskAliceSid, false);

                            // Verify worker A is un-holded in conference
                            await pauseTestExecution(STATUS_CHECK_DELAY);
                            participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(aliceReservation.task.sid);
                            assert.deepStrictEqual(participantPropertiesMap.get(credentials.workerNumber).hold, false, 'Worker A put on-hold value');

                            resolve('Outbound test to let worker A put worker B on hold is finished');
                        } catch (err) {
                            reject(`Failed to validate Task on-hold properties for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    // issue the conference instruction for Worker B's reservation
                    bobReservation.conference({ endConferenceOnExit: true }).catch(err => {
                        reject(`Error in establishing conference for transferred worker 
                            on Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                    });
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice on Outbound Task ${aliceReservation.task.sid}. Error: ${err}`);
                });
            });
        });

        it('should fail if worker A put worker B (and vice versa) on hold if they are not in same conference', async() => {
            await envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid);
            const aliceResPromise = new Promise((resolve, reject) => {
                outboundCommonHelpers.createTaskAndAssertOnResCreated(alice).then((aliceRes) => {
                    aliceRes.on('accepted', async() => {
                        try {
                            // Verify that there are 2 participant in conference (Alice and Customer)
                            await outboundCommonHelpers.verifyConferenceProperties(aliceRes.task.sid, 'in-progress', 2);
                            resolve(aliceRes);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${aliceRes.task.sid}. Error: ${err}`);
                        }
                    });
                    aliceRes.conference().catch(err => {
                        reject(`Error while establishing conference for alice on Outbound Task ${aliceRes.task.sid}. Error: ${err}`);
                    });
                });
            });

            const bobResPromise = new Promise((resolve, reject) => {
                outboundCommonHelpers.createTaskAndAssertOnResCreated(bob).then((bobRes) => {
                    bobRes.on('accepted', async() => {
                        try {
                            // Verify that there are 2 participant in conference (Bob and Customer)
                            await outboundCommonHelpers.verifyConferenceProperties(bobRes.task.sid, 'in-progress', 2);
                            resolve(bobRes);
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Outbound Task ${bobRes.task.sid}. Error: ${err}`);
                        }
                    });
                    bobRes.conference().catch(err => {
                        reject(`Error while establishing conference for bob on Outbound Task ${bobRes.task.sid}. Error: ${err}`);
                    });
                });
            });

            return new Promise(async(resolve, reject) => {
                try {
                    const [aliceReservation, bobReservation] = await Promise.all([aliceResPromise, bobResPromise]);

                    // Worker A tries to put worker B on hold
                    try {
                        await aliceReservation.task.hold(credentials.multiTaskBobSid, true);
                        reject('Failed to throw 400 on request to hold worker B');
                    } catch (err) {
                        assert.strictEqual(err.response.status, 400, 'Task on-hold request failure error code');
                    }

                    // Worker B tries to put worker A on hold
                    try {
                        await bobReservation.task.hold(credentials.multiTaskAliceSid, true);
                        reject('Failed to throw 400 on request to hold worker A');
                    } catch (err) {
                        assert.strictEqual(err.response.status, 400, 'Task on-hold request failure error code');
                    }
                    resolve('Outbound test fail if worker A put worker B (and vice versa) on hold if they are not in same conference');
                } catch (err) {
                    reject(`Error occurred while putting worker on hold. Error: ${err}`);
                }
            });
        });

        it('should fail when both worker A and worker B does not have accepted reservation', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation, credentials.multiTaskBobSid,
                            true, credentials.multiTaskBobSid, 'WARM', 'in-progress', 2);
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                bob.on('reservationCreated', async(bobReservation) => {
                    try {
                        // Verify Bob reservation is still pending
                        assert.strictEqual(bobReservation.status, 'pending', 'Worker B reservation status');

                        // Verify that there are 2 participant in conference (Alice and Customer)
                        await outboundCommonHelpers.verifyConferenceProperties(bobReservation.task.sid, 'in-progress', 2);

                        // Worker A tries to put worker B on hold
                        try {
                            await aliceReservation.task.hold(credentials.multiTaskBobSid, true);
                            reject('Failed to throw 400 on request to hold worker B');
                        } catch (err) {
                            assert.strictEqual(err.response.status, 400, 'Task on-hold request failure error code');
                        }

                        // Worker B tries to put worker A on hold
                        try {
                            await bobReservation.task.hold(credentials.multiTaskAliceSid, true);
                            reject('Failed to throw 400 on request to hold worker A');
                        } catch (err) {
                            assert.strictEqual(err.response.status, 400, 'Task on-hold request failure error code');
                            resolve('Outbound test to fail when worker A puts worker B (and vice-versa) on hold if reservation of worker B is pending');
                        }
                    } catch (err) {
                        reject(`Failed to validate Task on-hold properties. Error: ${err}`);
                    }
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        });
    });

    describe('#Create Task Validations', () => {
        it('should throw a validation error when using an incorrect workflow sid', () => {
            return new Promise(async(resolve, reject) => {
                // eslint-disable-next-line
                const expected = `Value \'${credentials.multiTaskWorkflowSid}z\' provided for` +
                                 ' WorkflowSid has an invalid format';
                try {

                    await alice.createTask(credentials.customerNumber, credentials.flexCCNumber,
                                           credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);

                    await alice.createTask(credentials.customerNumber, credentials.flexCCNumber,
                                           credentials.multiTaskWorkflowSid + 'z', credentials.multiTaskQueueSid);
                    reject('Invalid WorkflowSid should be rejected');
                } catch (err) {
                    assert.strictEqual(err.response.status, 400, 'expecting a bad request');
                    assert.strictEqual(err.response.statusText, expected,
                                       'Got a different validation failure than expected');
                    resolve('Test for validation error when using an incorrect workflowSid finished');
                }
            });
        }).timeout(5000);

        it('should throw a validation error when using an incorrect queue sid', () => {
            return new Promise(async(resolve, reject) => {
                try {
                    await alice.createTask(credentials.customerNumber, credentials.flexCCNumber,
                                           credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid + 'z');
                    reject('Invalid QueueSid should be rejected');
                } catch (err) {
                    assert.strictEqual(err.response.status, 400, 'expecting a bad request');
                    // taskrouter doesn't send a validation message here
                    resolve('Test for validation error when using an incorrect QueueSid finished');
                }
            });
        }).timeout(5000);
    });
});

