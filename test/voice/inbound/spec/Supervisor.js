import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import Supervisor from '../../../../lib/Supervisor';

import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import { twimletUrl, pauseTestExecution } from '../../VoiceBase';

const chai = require('chai');
const assert = chai.assert;

const credentials = require('../../../env');
const STATUS_CHECK_DELAY = 3000;

describe('Supervisor with Inbound Voice Task', () => {
    const workerToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const supervisorToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, null, 'supervisor');

    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let worker;
    let supervisor;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
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

    describe('#supervise conference', () => {
        let conferenceSid;

        it('should issue a conference instruction on the Reservation', () => {
            // supervisor stays offline
            supervisor = new Supervisor(supervisorToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            worker = new Worker(workerToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(async(resolve, reject) => {
                worker.on('error', (err) => {
                    reject(`Error detected for Worker ${worker.sid}. Error: ${err}.`);
                });
                supervisor.on('error', (err) => {
                    reject(`Error detected for Superivsor ${supervisor.sid}. Error: ${err}.`);
                });

                worker.on('ready', async() => {
                    try {
                        // mime the inbound call from customer to contact center
                        const call = await envTwilio.createCall(credentials.flexCCNumber, credentials.customerNumber, twimletUrl);
                        AssertionUtils.assertSid(call.sid, 'CA', 'Expected the create call sid to be: CA{32}');
                    } catch (error) {
                        reject(`Error in establishing voice call. Error: ${error}`);
                    }
                });

                worker.on('reservationCreated', async(createdReservation) => {
                    createdReservation.on('accepted', async(acceptedReservation) => {
                        conferenceSid = acceptedReservation.task.attributes.conference.sid;
                        // check that there are 2 participants in the conference
                        const conference = await envTwilio.fetchConference(conferenceSid);
                        if (conference.status !== 'in-progress') {
                            reject(`Conference status invalid. Expected in-progress. Got ${conference.status}.`);
                        }

                        const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                        if (participants.length !== 2) {
                            reject(`Conference participant size invalid. Expected 2. Got ${participants.length}.`);
                        }

                        // turn the supervisor online
                        envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid).then(async() => {
                            // the supervisor should now begin monitoring
                            supervisor.monitor(acceptedReservation.task.sid, acceptedReservation.sid).catch(err => {
                                reject(`Failed to issue monitor request on Reservation ${acceptedReservation.sid}. Error: ${err}`);
                            });
                            // pause to ensure that the supervisor has connected to the conference
                            await pauseTestExecution(STATUS_CHECK_DELAY);
                            const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                            assert.strictEqual(participants.length, 3, 'Participant count (with supervisor) in conference');
                        }).catch(err => {
                            reject(`Error when using Supervisor ${supervisor.sid}. Error: ${err}`);
                        });
                    });

                    createdReservation.on('wrapup', async() => {
                        // check that the participants have left the conference
                        const conference = await envTwilio.fetchConference(conferenceSid);
                        if (conference.status !== 'completed') {
                            reject(`Conference status invalid. Expected completed. Got ${conference.status}.`);
                        }
                        const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                        if (participants.length !== 0) {
                            reject(`Conference participant size invalid. Expected 0. Got ${participants.length}.`);
                        }

                        resolve('Inbound Reservation Conference test finished.');
                    });

                    // issue conference instruction
                    createdReservation.conference({
                        endConferenceOnExit: true
                    }).catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });

                });
            });
        }).timeout(45000);
    });
});

