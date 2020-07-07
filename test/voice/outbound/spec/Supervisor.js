import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import Supervisor from '../../../../lib/Supervisor';
import { getAccessToken } from '../../../util/MakeAccessToken';
import OutboundCommonHelpers from '../../../util/OutboundCommonHelpers';

import { pauseTestExecution } from '../../VoiceBase';

const chai = require('chai');
const assert = chai.assert;

const credentials = require('../../../env');
const STATUS_CHECK_DELAY = 3000;

const it = require('repeat-it');

describe('Supervisor Mode with Outbound Voice Task', () => {
    const workerToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const supervisorToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, null, 'supervisor', { useSync: true });

    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const outboundCommonHelpers = new OutboundCommonHelpers(envTwilio);
    let worker;
    let supervisor;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            // make worker and supervisor available
            worker = new Worker(workerToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            supervisor = new Supervisor(supervisorToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return Promise.all([outboundCommonHelpers.listenToWorkerReadyOrErrorEvent(worker),
                outboundCommonHelpers.listenToWorkerReadyOrErrorEvent(supervisor)]);
        });
    });

    afterEach(() => {
        supervisor.removeAllListeners();
        worker.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid)
            .then(() => envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            )).then(() => envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskBobSid,
                credentials.multiTaskUpdateActivitySid
            ));
    });

    it(credentials.iterations)('should allow a Supervisor to monitor a live conference/task successfully', () => {
        return new Promise(async(resolve, reject) => {
            // setup the conference call between worker and customer
            const workerReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(worker);
            const taskSid = workerReservation.task.sid;

            workerReservation.on('accepted', async() => {
                try {
                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 2);

                    // the supervisor should now monitor the conference
                    supervisor.monitor(taskSid, workerReservation.sid).catch(err => {
                        reject(`Failed to issue monitor request on Reservation ${workerReservation.sid}. ${err}`);
                    });

                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    // validate that there are 3 participants in the conference
                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 3);

                    // validate that the supervisor is on mute
                    let participantPropertiesMap = await envTwilio.fetchParticipantPropertiesByName(taskSid);
                    const supervisorProperties = participantPropertiesMap.get(credentials.supervisorNumber);
                    assert.isTrue(supervisorProperties.muted);

                    // if the supervisor leaves, the ongoging conference is unaffected
                    await envTwilio.endCall(supervisorProperties.callSid);
                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 2);
                    resolve('Test Case: Supervisor successfully able to monitor Conference passed.');

                } catch (err) {
                    reject(`Succesfully created and accepted the Outbound Task ${taskSid}, but failed to validate Conference properties. ${err}`);
                }
            });

            // accept the outbounnd task with conference instruction
            workerReservation.conference({
                endConferenceOnExit: true
            }).catch(err => {
                reject(`Error in establishing conference for Reservation ${workerReservation.sid} | Task ${taskSid}. Error: ${err}`);
            });
        });
    });

    it(credentials.iterations)('should allow a Supervisor to monitor a call regardless of Activity state', () => {
        return new Promise(async(resolve, reject) => {
            // setup the conference call between worker and customer
            const workerReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(worker);
            const taskSid = workerReservation.task.sid;

            workerReservation.on('accepted', async() => {
                try {
                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 2);

                    // turn the supervisor's activity off
                    await envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskUpdateActivitySid);
                    supervisor.monitor(taskSid, workerReservation.sid).catch(err => {
                        reject(`Failed to issue monitor request on Reservation ${workerReservation.sid}. ${err}`);
                    });

                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    // validate that there are 3 participants in the conference
                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 3);
                    resolve('Test Case: Supervisor successfully able to monitor Conference regardless of current Activity state passed.');

                } catch (err) {
                    reject(`Succesfully created and accepted the Outbound Task ${taskSid}, but failed to validate Conference properties. ${err}`);
                }
            });

            // accept the outbounnd task with conference instruction
            workerReservation.conference({
                endConferenceOnExit: true
            }).catch(err => {
                reject(`Error in establishing conference for Reservation ${workerReservation.sid} | Task ${taskSid}. Error: ${err}`);
            });
        });
    });

    it(credentials.iterations)('should allow a Supervisor to accept a Transfer irrespective if it is for a Conference it is already monitoring', () => {
        return new Promise(async(resolve, reject) => {
            // setup the conference call between worker and customer
            const workerReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(worker);
            const taskSid = workerReservation.task.sid;

            workerReservation.on('accepted', async() => {
                try {
                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 2);

                    // the supervisor should now monitor the conference
                    supervisor.monitor(taskSid, workerReservation.sid).catch(err => {
                        reject(`Failed to issue monitor request on Reservation ${workerReservation.sid}. ${err}`);
                    });

                    await pauseTestExecution(STATUS_CHECK_DELAY);
                    // validate that there are 3 participants in the conference
                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 3);

                    // transfer the call to the supervisor (the supervisor continues to monitor)
                    await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(workerReservation, credentials.multiTaskBobSid,
                        true, credentials.multiTaskBobSid, 'WARM', 'in-progress', 3);
                } catch (err) {
                    reject(`Succesfully created and accepted the Outbound Task ${taskSid}, but failed to validate Conference properties. ${err}`);
                }
            });

            // the supervisor should also accept with conference instruction
            supervisor.on('reservationCreated', async(supervisorReservation) => {
                supervisorReservation.conference().then(() => {
                    supervisorReservation.on('accepted', async() => {
                        try {
                            // validate there are 4 participants (2 of them the supervisor: one as monitor, one as active participant)
                            await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 4);
                            resolve('Test Case: Supervisor successfully able to monitor and be the transferee in a single Conference passed.');
                        } catch (err) {
                            reject(`Failed to verify Conference properties for ${taskSid} after Supervisor accepts transfer. ${err}.`);
                        }
                    });
                }).catch(err => {
                    reject(`Error in establishing conference for transferred worker. Error: ${err}`);
                });
            });

            // accept the outbound task with conference instruction
            workerReservation.conference({
                endConferenceOnExit: true
            }).catch(err => {
                reject(`Error in establishing conference for Reservation ${workerReservation.sid} | Task ${taskSid}. Error: ${err}`);
            });
        });
    });
});
