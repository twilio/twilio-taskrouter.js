import Worker from '../../../lib/Worker';
import { WorkerChannelCapacities } from '../../mock/WorkerChannelCapacities';
import AssertionUtils from '../../util/AssertionUtils';
import EnvTwilio from '../../util/EnvTwilio';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

const chai = require('chai');
const assert = chai.assert;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Channel', () => {
    const aliceMultiToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);

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
        it('@SixSigma - should create specific channels in MultiTask mode', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(multiTaskAlice.channels);

                AssertionUtils.retryAssertion(() => {
                    assert.equal(multiTaskAlice.channels.size, credentials.multiTaskNumChannels);
                }, 100, 100);

                multiTaskAlice.channels.forEach(channel => {
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity);
                    assert.equal(channel.available, WorkerChannelCapacities[channel.taskChannelUniqueName].available);
                });
            });
        }).timeout(5000);
    });
});
