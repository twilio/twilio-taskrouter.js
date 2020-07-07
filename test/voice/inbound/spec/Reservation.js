import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import { twimletUrl } from '../../VoiceBase';

const credentials = require('../../../env');

const it = require('repeat-it');

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
        it(credentials.iterations)('should issue a conference instruction on the Reservation', () => {
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
                        if (conference.status !== 'in-progress') {
                            reject(`Conference status invalid. Expected in-progress. Got ${conference.status}.`);
                        }

                        const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                        if (participants.length !== 2) {
                            reject(`Conference participant size invalid. Expected 2. Got ${participants.length}.`);
                        }
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

                    // issue the conference instruction
                    createdReservation.conference().catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });
            });
        });
    });
});

