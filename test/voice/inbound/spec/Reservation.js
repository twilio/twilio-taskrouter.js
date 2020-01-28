import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import { twimletUrl } from '../../VoiceBase';

const chai = require('chai');
const assert = chai.assert;

const credentials = require('../../../env');

describe('Reservation with Inbound Voice Task', () => {
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
                worker.on('error', (err) => {
                    reject(`Error detected for Worker ${worker.sid}. Error: ${err}.`);
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
                    let conferenceSid;

                    createdReservation.on('accepted', async(acceptedReservation) => {
                        conferenceSid = acceptedReservation.task.attributes.conference.sid;
                        // check that there are 2 participants in the conference
                        const conference = await envTwilio.fetchConference(conferenceSid);
                        assert.strictEqual(conference.status, 'in-progress', 'Conference status');

                        const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                        assert.strictEqual(participants.length, 2, 'Participant count in conference');
                    });

                    createdReservation.on('wrapup', async() => {
                        // check that the participants have left the conference
                        const conference = await envTwilio.fetchConference(conferenceSid);
                        assert.strictEqual(conference.status, 'completed', 'Conference status');

                        const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                        assert.strictEqual(participants.length, 0, 'Participant count in conference');

                        resolve('Inbound Reservation Conference test finished.');
                    });

                    // issue the conference instruction
                    createdReservation.conference().catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });
            });
        });
    });
});

