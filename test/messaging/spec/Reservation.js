import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { getAccessToken } from '../../util/MakeAccessToken';
import MessagingHelpers from '../../util/MessagingHelpers';


const credentials = require('../../env');

describe('Reservation with Messaging Task', () => {
    const workerToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const messagingHelpers = new MessagingHelpers(envTwilio);
    let worker;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            envTwilio.deleteAllConversations();

            // make worker available
            worker = new Worker(workerToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return messagingHelpers.listenToWorkerReadyOrErrorEvent(worker);
        });
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

    describe('#conversation', () => {
        it('should create a conversation', () => {
            return new Promise(async(resolve, reject) => {
                await messagingHelpers.sendMessage();
                const workerReservation = await messagingHelpers.assertOnReservationCreated(worker);

                workerReservation.on('accepted', async() => {
                    try {
                        await messagingHelpers.verifyConversationProperties(workerReservation.task.attributes.conversationSid, 'active', 2);
                    } catch (err) {
                        reject(`Failed to validate Conversation properties for ${workerReservation.task.sid}. Error: ${err}`);
                    }

                    workerReservation.wrap();
                });

                messagingHelpers.assertOnResWrapUpAndCompleteEvent(workerReservation).then(() => {
                    resolve('Conversation test finished.');
                }).catch(err => {
                    reject(`Failed to validate wraup & completed event Task for ${workerReservation.task.sid}. Error: ${err}`);
                });

                workerReservation.accept();
            });
        }).timeout(50000);
    });
});
