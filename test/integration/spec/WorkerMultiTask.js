import { WorkerChannelCapacities } from '../../mock/WorkerChannelCapacities';
import EnvTwilio from '../../util/EnvTwilio';

const chai = require('chai');
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');
import Worker from '../../../lib/Worker';

describe('MultiTask Worker Client', () => {
    const aliceMultiToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

    before(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
    });

    after(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        });
    });

    describe('initialization of Multi Task Worker', () => {
        it('should populate .activities', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels/{accountSid}/{workerSid}`,
                wsServer: `${credentials.wsServer}/v1/wschannels/{accountSid}/{workerSid}`
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(multiTaskAlice.activities);
                assert.equal(multiTaskAlice.activities.size, credentials.multiTaskNumActivities);
            });
        }).timeout(5000);

        it('should populate .channels', () => {
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

        it('should set the activity on connect if provided', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels/{accountSid}/{workerSid}`,
                wsServer: `${credentials.wsServer}/v1/wschannels/{accountSid}/{workerSid}`
            });

            return new Promise((resolve) => {
                multiTaskAlice.on('activityUpdated', resolve);
            }).then(() => {
                multiTaskAlice.activities.forEach(activity => {
                    if (activity.sid === credentials.multiTaskConnectActivitySid) {
                        assert.isTrue(activity.isCurrent);
                        assert.equal(multiTaskAlice.activity, activity);
                    } else {
                        assert.isFalse(activity.isCurrent);
                    }
                });
            });
        }).timeout(5000);

        it('should populate .reservations with 0 Reservations when none currently pending', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels/{accountSid}/{workerSid}`,
                wsServer: `${credentials.wsServer}/v1/wschannels/{accountSid}/{workerSid}`
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.equal(multiTaskAlice.reservations.size, 0);
            });
        }).timeout(5000);
    });

    describe('Multi Task Worker with pending Reservations', () => {
        let defaultChannelCapacity = 3;
        let defaultChannelName = 'default';
        let multiTaskAlice;

        before(() => {
            // turn the worker online & update capacity so that Reservations can be created
            return envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, defaultChannelName, defaultChannelCapacity).then(() => {
                envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, credentials.multiTaskConnectActivitySid).then(() => {
                    const promises = [];
                    for (let i = 0; i < 3; i++) {
                        promises.push(envTwilio.createTask(credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, '{}'));
                    }
                    return Promise.all(promises);
                });
            });
        });

        after(() => {
            return envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, defaultChannelName, 1);
        });

        it('should populate pending .reservations', () => {
            multiTaskAlice = new Worker(aliceMultiToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels/{accountSid}/{workerSid}`,
                wsServer: `${credentials.wsServer}/v1/wschannels/{accountSid}/{workerSid}`
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.equal(multiTaskAlice.reservations.size, defaultChannelCapacity);

                multiTaskAlice.channels.forEach(channel => {
                    if (channel.name === defaultChannelName) {
                        assert.isFalse(channel.available);
                    }
                });
            });
        }).timeout(5000);
    });
});
