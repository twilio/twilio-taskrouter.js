import Worker from '../../../lib/Worker';
import { WorkerChannelCapacities } from '../../mock/WorkerChannelCapacities';
import EnvTwilio from '../../util/EnvTwilio';

const chai = require('chai');
const assert = chai.assert;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Channel', () => {
    const aliceMultiToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

    before(() => {
        return Promise.all([
            envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid),
            envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid)
        ]);
    });

    after(() => {
        return Promise.all([
            envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid),
            envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid)
        ]);
    });

    describe('constructor', () => {
        it('should create specific channels in MultiTask mode', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels/{accountSid}/{workerSid}`,
                wsServer: `${credentials.wsServer}/v1/wschannels/{accountSid}/{workerSid}`
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(multiTaskAlice.channels);
                assert.equal(multiTaskAlice.channels.size, credentials.multiTaskNumChannels);

                multiTaskAlice.channels.forEach(channel => {
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity);
                    assert.equal(channel.available, WorkerChannelCapacities[channel.taskChannelUniqueName].available);
                });
            });
        }).timeout(5000);

        it('should create specific channels in NonMultiTask mode', () => {
            const alice = new Worker(aliceToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels/{accountSid}/{workerSid}`,
                wsServer: `${credentials.wsServer}/v1/wschannels/{accountSid}/{workerSid}`
            });

            return new Promise(resolve => {
                alice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(alice.channels);
                assert.equal(alice.channels.size, credentials.multiTaskNumChannels);

                alice.channels.forEach(channel => {
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity);
                    assert.isTrue(WorkerChannelCapacities[channel.taskChannelUniqueName].available);
                });
            });
        }).timeout(5000);
    });
});
