import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import { twimletUrl } from '../../VoiceBase';
import SyncClientInstance from '../../../util/SyncClientInstance';
import { TRANSFER_MODE } from '../../../util/Constants';

const credentials = require('../../../env');

describe('Task Transfer to Worker with Inbound Voice Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
        credentials.multiTaskAliceSid, null, null, { useSync: true });
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
        credentials.multiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let alice;
    let bob;
    let aliceSyncClient;

    beforeEach(() => {
        aliceSyncClient = new SyncClientInstance(aliceToken);
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
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

    describe('#Inbound Cold Transfer to a Worker', () => {
        it('should complete inbound transfer to worker B successfully', () => {
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            bob = new Worker(bobToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(async(resolve, reject) => {
                alice.on('error', (err) => {
                    reject(`Error detected for Worker ${alice.sid}. Error: ${err}.`);
                });

                alice.on('ready', async() => {
                    try {
                        // mime the inbound call from customer to contact center
                        const call = await envTwilio.createCall(credentials.flexCCNumber, credentials.customerNumber, twimletUrl);
                        AssertionUtils.assertSid(call.sid, 'CA', 'Expected the create call sid to be: CA{32}');
                    } catch (error) {
                        reject(`Error in establishing voice call. Error: ${error}`);
                    }
                });

                alice.on('reservationCreated', async(aliceReservation) => {
                    let conferenceSid;
                    const taskSid = aliceReservation.task.sid;
                    const syncMap = await aliceSyncClient._fetchSyncMap(taskSid);

                    aliceReservation.on('accepted', async(acceptedReservation) => {
                        // check that there are 2 participants in the conference (customer and Alice)
                        conferenceSid = acceptedReservation.task.attributes.conference.sid;
                        const conference = await envTwilio.fetchConference(conferenceSid);
                        if (conference.status !== 'in-progress') {
                            reject(`Conference status invalid. Expected in-progress. Got ${conference.status}.`);
                        }

                        const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                        if (participants.length !== 2) {
                            reject(`Conference participant size invalid. Expected 2. Got ${participants.length}.`);
                        }

                        // alice initiates cold transfer to Bob
                        await aliceReservation.task.transfer(credentials.multiTaskBobSid, { mode: TRANSFER_MODE.cold });

                        await aliceSyncClient.waitForWorkerLeave(syncMap, credentials.multiTaskAliceSid).catch(err => {
                            reject(`Failed to catch Sync event for Alice ${credentials.multiTaskAliceSid} leaving the conference. ${err}`);
                        });
                    });

                    aliceReservation.on('wrapup', async() => {
                        await aliceReservation.complete();
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
                            if (bobReservation.task.status !== 'reserved') {
                                reject(`Transfer Task Assignment Status invalid. Expected reserved. Got ${bobReservation.task.status}`);
                            }
                        } catch (err) {
                            reject(`Failed to validate Reservation and Transfer properties on reservation created event for Outbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        }
                        bobReservation.on('accepted', async(bobAcceptedReservation) => {
                            // check that there are 2 participants in the conference (customer and Bob)
                            conferenceSid = bobAcceptedReservation.task.attributes.conference.sid;
                            const conference = await envTwilio.fetchConference(conferenceSid);
                            if (conference.status !== 'in-progress') {
                                reject(`Conference status invalid. Expected in-progress. Got ${conference.status}.`);
                            }

                            const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                            if (participants.length !== 2) {
                                reject(`Conference participant size invalid. Expected 2. Got ${participants.length}.`);
                            }
                            await aliceSyncClient.waitForWorkerLeave(syncMap, credentials.multiTaskBobSid).catch(err => {
                                reject(`Failed to catch Sync event for Bob ${credentials.multiTaskBobSid} leaving the conference. ${err}`);
                            });
                        });

                        bobReservation.on('wrapup', async() => {
                            // check that the participants have left the conference
                            conferenceSid = bobReservation.task.attributes.conference.sid;
                            const conference = await envTwilio.fetchConference(conferenceSid);
                            if (conference.status !== 'completed') {
                                reject(`Conference status invalid. Expected completed. Got ${conference.status}.`);
                            }
                            const participants = await envTwilio.fetchConferenceParticipants(conferenceSid);
                            if (participants.length !== 0) {
                                reject(`Conference participant size invalid. Expected 0. Got ${participants.length}.`);
                            }
                            await bobReservation.complete();
                            resolve('Inbound Transfer to Worker test finished.');
                        });

                        // issue the conference instruction for alice
                        bobReservation.conference({ endConferenceOnExit: true,
                            record: 'true',
                            recordingChannels: 'dual',
                            recordingStatusCallbackMethod: 'POST',
                            conferenceRecordingStatusCallbackMethod: 'POST' }).catch(err => {
                            reject(`Error in establishing conference for Inbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        });
                    });

                    // issue the conference instruction for alice
                    aliceReservation.conference({
                        endConferenceOnExit: false,
                        record: 'true',
                        recordingChannels: 'dual',
                        recordingStatusCallbackMethod: 'POST',
                        conferenceRecordingStatusCallbackMethod: 'POST'
                    }).catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });
            });
        }).timeout(50000);
    });
});
