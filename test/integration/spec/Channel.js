import Worker from '../../../lib/Worker';
import { WorkerChannelCapacities } from '../../mock/WorkerChannelCapacities';
import EnvTwilio from '../../util/EnvTwilio';

const chai = require('chai');
const assert = chai.assert;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Channel', () => {
    const aliceMultiToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

    before(() => {
        return Promise.all([
            envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid),
        ]);
    });

    after(() => {
        return Promise.all([
            envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid),
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
                assert.isNotNull(multiTaskAlice.channels);
                assert.equal(multiTaskAlice.channels.size, credentials.multiTaskNumChannels);

                multiTaskAlice.channels.forEach(channel => {
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity);
                    assert.equal(channel.available, WorkerChannelCapacities[channel.taskChannelUniqueName].available);
                });
            });
        }).timeout(5000);
    });
});
