import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { getAccessToken } from '../../util/MakeAccessToken';
import MessagingHelpers from '../../util/MessagingHelpers';


const credentials = require('../../env');

describe('Reservation with Messaging Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
        credentials.multiTaskAliceSid);
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
      credentials.multiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const messagingHelpers = new MessagingHelpers(envTwilio);
    let alice;
    let bob;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            envTwilio.deleteAllConversations();

            // make worker available
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

    describe('#conversation', () => {
        it('should create a conversation', () => {
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
