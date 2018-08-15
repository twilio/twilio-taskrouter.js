import { WorkerChannelCapacities } from '../../mock/WorkerChannelCapacities';
import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

const chai = require('chai');
const assert = chai.assert;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('NonMuliTask Worker Client', () => {
    const bobToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

    before(() => {
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid);
    });

    after(() => {
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid).then(() => {
            return Promise.all([
                envTwilio.updateWorkerActivity(credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid, credentials.nonMultiTaskUpdateActivitySid),  // busy
                envTwilio.updateWorkerActivity(credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskBobSid, credentials.nonMultiTaskUpdateActivitySid)     // busy
            ]);
        });
    });

    describe('initialization of Non Multi Task Worker', () => {
        before(() => {
            return envTwilio.updateWorkerActivity(credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskBobSid, credentials.nonMultiTaskUpdateActivitySid);
        });

        it('should populate .activities', () => {
            const bob = new Worker(bobToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(resolve => {
                bob.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(bob.activities);
                assert.equal(bob.activities.size, credentials.nonMultiTaskNumActivities);
            });
        }).timeout(5000);

        it('should populate .channels', () => {
            const bob = new Worker(bobToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(resolve => {
                bob.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(bob.channels);
                assert.equal(bob.channels.size, credentials.multiTaskNumChannels);

                bob.channels.forEach(channel => {
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity);
                    assert.equal(channel.available, WorkerChannelCapacities[channel.taskChannelUniqueName].available);
                });
            });
        }).timeout(5000);

        it('should set the activity on connect if provided', () => {
            const bob = new Worker(bobToken, {
                connectActivitySid: credentials.nonMultiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(resolve => {
                bob.on('activityUpdated', resolve);
            }).then(() => {
                bob.activities.forEach(activity => {
                    if (activity.sid === credentials.nonMultiTaskConnectActivitySid) {
                        assert.isTrue(activity.isCurrent);
                        assert.equal(bob.activity, activity);
                    } else {
                        assert.isFalse(activity.isCurrent);
                    }
                });
            });
        }).timeout(5000);

        it('should populate .reservations with 0 Reservations when none currently pending', () => {
            const bob = new Worker(bobToken, {
                connectActivitySid: credentials.nonMultiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(resolve => {
                bob.on('ready', resolve);
            }).then(() => {
                assert.equal(bob.reservations.size, 0);
            });
        }).timeout(5000);
    });

    describe('Non Multi Task Worker with pending Reservations', () => {
        before(() => {
            return envTwilio.updateWorkerActivity(credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskBobSid, credentials.nonMultiTaskConnectActivitySid).then(() => {
                const promises = [];
                for (let i = 0; i < 2; i++) {
                    promises.push(envTwilio.createTask(credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskWorkflowSid, '{}'));
                }
                return Promise.all(promises);
            });
        });

        it('should populate pending .reservations', async() => {
            await new Promise(r => setTimeout(r, 2000));
            const bob = new Worker(bobToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return new Promise(resolve => {
                bob.on('ready', resolve);
            }).then(() => {
                assert.equal(bob.reservations.size, 1);
            });
        }).timeout(5000);
    });
});
