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
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(multiTaskAlice.channels,
                     envTwilio.getErrorMessage('Channel list is null', credentials.accountSid, credentials.multiTaskAliceSid));
                assert.equal(multiTaskAlice.channels.size, credentials.multiTaskNumChannels,
                     envTwilio.getErrorMessage('Channel count mismatch', credentials.accountSid, credentials.multiTaskAliceSid));

                var msg;
                multiTaskAlice.channels.forEach(channel => {
                    msg = `Channel ${WorkerChannelCapacities[channel.taskChannelUniqueName]} capacity mismatch`;
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity,
                        envTwilio.getErrorMessage(msg, credentials.accountSid, credentials.multiTaskAliceSid));

                    msg = `Channel ${WorkerChannelCapacities[channel.taskChannelUniqueName]} availability mismatch`;
                    assert.equal(channel.available, WorkerChannelCapacities[channel.taskChannelUniqueName].available,
                        envTwilio.getErrorMessage(msg, credentials.accountSid, credentials.multiTaskAliceSid));

                });
            });
        }).timeout(5000);

        it('should create specific channels in NonMultiTask mode', () => {

            const alice = new Worker(aliceToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(resolve => {
                alice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(alice.channels,
                    envTwilio.getErrorMessage('Channel list is null', credentials.accountSid, credentials.nonMultiTaskAliceSid));

                assert.equal(alice.channels.size, credentials.multiTaskNumChannels,
                    envTwilio.getErrorMessage('Channel count mismatch', credentials.accountSid, credentials.nonMultiTaskAliceSid));

                var msg;
                alice.channels.forEach(channel => {
                    msg = `Channel ${WorkerChannelCapacities[channel.taskChannelUniqueName]} capacity mismatch`;
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity,
                        envTwilio.getErrorMessage(msg, credentials.accountSid, credentials.nonMultiTaskAliceSid));

                    msg = `Channel ${WorkerChannelCapacities[channel.taskChannelUniqueName]} availability mismatch`;
                    assert.isTrue(WorkerChannelCapacities[channel.taskChannelUniqueName].available,
                        envTwilio.getErrorMessage(msg, credentials.accountSid, credentials.nonMultiTaskAliceSid));

                });
            });
        }).timeout(5000);
    });
});
