import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';

const chai = require('chai');
const assert = chai.assert;

const credentials = require('../../../env');

describe('Reservation with Outbound Voice Task', () => {
    const workerToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let worker;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
    });

    afterEach(() => {
        worker.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        });
    });

    describe('#conference reservation', () => {
        it('should issue a conference instruction on the Reservation', () => {
            worker = new Worker(workerToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(async(resolve, reject) => {
                let taskSid;

                worker.on('error', (err) => {
                    reject(`Error detected for Worker ${worker.sid}. Error: ${err}.`);
                });

                worker.on('ready', async() => {
                    // create task with routing target
                    taskSid = await worker.createTask(credentials.customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);
                });

                worker.on('reservationCreated', async(createdReservation) => {
                    let conferenceSid;
                    // check that the reservation's task is for the task we created for ourselves
                    if (taskSid !== createdReservation.task.sid) {
                        reject(`Did not receive a Reservation for the created Outbound Task ${taskSid}. Got a Reservation for ${createdReservation.task.sid} instead`);
                    }

                    createdReservation.on('accepted', async() => {
                        try {
                            // check that there are 2 participants in the conference
                            const conference = await envTwilio.fetchConferenceByName(taskSid);
                            conferenceSid = conference.sid;
                            assert.strictEqual(conference.status, 'in-progress', 'Conference status');

                            const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                            assert.strictEqual(participants.length, 2, 'Participant count in conference');
                        } catch (err) {
                            reject(`Failed to validate Conference properties for the Outbound Task. Error: ${err}`);
                        }
                    });

                    // ORCH-678: Uncomment this section after ORCH-678
                    createdReservation.on('wrapup', async() => {
                        // Uncomment after ORCH-678
                        // try {
                        //     // check that the participants have left the conference
                        //     const conference = await envTwilio.fetchConference(conferenceSid);
                        //     assert.strictEqual(conference.status, 'completed', 'Conference status');

                        //     const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                        //     assert.strictEqual(participants.length, 0, 'Participant count in conference');

                        // } catch (err) {
                        //     reject(`Failed to validate Conference properties when Agent leaves call. Error: ${err}`);
                        // }
                        resolve('Outbound Reservation Conference test finished.');
                    });

                    createdReservation.conference({
                        endConferenceOnExit: true
                    }).catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });
            });
        });
    });
});

