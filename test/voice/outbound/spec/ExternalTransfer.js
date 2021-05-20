import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { getAccessToken } from '../../../util/MakeAccessToken';
import AssertionUtils from '../../../util/AssertionUtils';
import OutboundCommonHelpers from '../../../util/OutboundCommonHelpers';
import { confTwimlUrl } from '../../VoiceBase';
import SyncClientInstance from '../../../util/SyncClientInstance';

const credentials = require('../../../env');
const chai = require('chai');
chai.use(require('sinon-chai'));

describe('External Transfer for Outbound Voice Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                      credentials.multiTaskAliceSid);
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                    credentials.multiTaskBobSid, null, null, { useSync: true });
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const outboundCommonHelpers = new OutboundCommonHelpers(envTwilio);
    let alice;
    let bob;
    let syncClient;

    before(() => {
        syncClient = new SyncClientInstance(bobToken);
    });

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
            return Promise.all([envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid,
                                                               credentials.multiTaskBobSid, credentials.multiTaskUpdateActivitySid),
                                envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid,
                                                               credentials.multiTaskAliceSid, credentials.multiTaskUpdateActivitySid)]);
        });
    });

    describe('#Warm transfer to an external number', () => {
        it('should complete warm transfer to an external number successfully', () => {
            return new Promise(async(resolve, reject) => {
                const aliceReservation = await outboundCommonHelpers.createTaskAndAssertOnResCreated(alice);
                const taskSid = aliceReservation.task.sid;

                const syncMap = await syncClient._fetchSyncMap(taskSid);

                aliceReservation.on('accepted', async() => {
                    try {
                        await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 2);

                        try {
                            // mime the outbound transfer call from contact center to external number (supervisor number)
                            let twimlUrl = confTwimlUrl.replace('taskSid', taskSid);

                            syncMap.on('itemAdded', async(args) => {
                                const foundEvent = syncClient.isExternalCallJoin(args);
                                if (foundEvent) {
                                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 3);

                                    try {
                                        // end agent alice's call to simulate agent leaving
                                        envTwilio.terminateParticipantCall(taskSid, [credentials.workerNumber]);
                                    } catch (err) {
                                        reject(`Something went wrong when terminating alice's call. Error: ${err}`);
                                    }

                                    await syncClient.waitForWorkerLeave(syncMap, aliceReservation.workerSid).catch(err => {
                                        reject(`Failed to fetch agent alice leave event for ${aliceReservation.workerSid}. ${err}`);
                                    });

                                    await outboundCommonHelpers.verifyConferenceProperties(taskSid, 'in-progress', 2);

                                    resolve('Test to verify agent can add external transferee and then leave the conference.');
                                }
                            });

                            let call = await envTwilio.createCall(credentials.supervisorNumber, credentials.flexCCNumber, twimlUrl);
                            AssertionUtils.assertSid(call.sid, 'CA', 'Expected the create call sid to be: CA{32}');
                        } catch (error) {
                            reject(`Error in establishing external voice call. Error: ${error}`);
                        }
                    } catch (err) {
                        reject(`Error caught after receiving reservation accepted event. Error: ${err}`);
                    }
                });

                aliceReservation.conference().catch(err => {
                    reject(`Error while establishing conference for alice. Error: ${err}`);
                });
            });
        });
    });
});
