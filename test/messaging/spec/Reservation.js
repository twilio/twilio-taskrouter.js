import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { getAccessToken } from '../../util/MakeAccessToken';
import MessagingHelpers from '../../util/MessagingHelpers';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

const credentials = require('../../env');

describe('Reservation with Messaging Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
        credentials.multiTaskAliceSid);
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
      credentials.multiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
    const messagingHelpers = new MessagingHelpers(envTwilio);
    let alice;
    let bob;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            envTwilio.deleteAllConversations();

            // make worker available
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge
            });

            // bob stays offline
            bob = new Worker(bobToken, {
                connectActivitySid: credentials.multiTaskUpdateActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge
            });

            return messagingHelpers.listenToWorkerReadyOrErrorEvent(alice);
        });
    });

    afterEach(() => {
        alice.removeAllListeners();
        bob.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        });
    });

    describe.skip('#conversation', () => {
        // ORCH-1742 filed for unreliable test
        it.skip('should create a conversation', () => {
            return new Promise(async(resolve, reject) => {
                await messagingHelpers.sendMessage();
                const aliceReservation = await messagingHelpers.assertOnReservationCreated(alice);

                aliceReservation.on('accepted', async() => {
                    await messagingHelpers.pauseTestExecution(5000);
                    aliceReservation.wrap();
                });

                messagingHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation).then(() => {
                    resolve('Conversation test finished.');
                }).catch(err => {
                    reject(`Failed to validate wraup & completed event Task for ${aliceReservation.task.sid}. Error: ${err}`);
                });

                aliceReservation.accept();
            });
        }).timeout(50000);
    });
});
