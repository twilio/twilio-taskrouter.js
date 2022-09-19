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
        it('@SixSigma - should populate .activities', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                region: credentials.region,
                edge: credentials.edge
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(multiTaskAlice.activities,
                    envTwilio.getErrorMessage('Task activities is null', credentials.accountSid, credentials.multiTaskAliceSid));

                assert.equal(multiTaskAlice.activities.size, credentials.multiTaskNumActivities,
                    envTwilio.getErrorMessage(`Task ${multiTaskAlice.sid} activities count mismatch`, credentials.accountSid, credentials.multiTaskAliceSid));

            });
        }).timeout(5000);

        it('@SixSigma - should populate .channels', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                region: credentials.region,
                edge: credentials.edge
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.isNotNull(multiTaskAlice.channels,
                    envTwilio.getErrorMessage('Task channels is null', credentials.accountSid, credentials.multiTaskAliceSid));

                assert.equal(multiTaskAlice.channels.size, credentials.multiTaskNumChannels,
                    envTwilio.getErrorMessage('Channels count mismatch', credentials.accountSid, credentials.multiTaskAliceSid));


                multiTaskAlice.channels.forEach(channel => {
                    assert.equal(channel.capacity, WorkerChannelCapacities[channel.taskChannelUniqueName].capacity,
                        envTwilio.getErrorMessage(`Channel ${channel.sid} capacity mismatch`, credentials.accountSid, credentials.multiTaskAliceSid));

                    assert.equal(channel.available, WorkerChannelCapacities[channel.taskChannelUniqueName].available,
                        envTwilio.getErrorMessage(`Channel ${channel.sid} availability mismatch`, credentials.accountSid, credentials.multiTaskAliceSid));

                });
            });
        }).timeout(5000);

        it('@SixSigma - should set the activity on connect if provided', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: credentials.region,
                edge: credentials.edge
            });

            return new Promise((resolve) => {
                multiTaskAlice.on('activityUpdated', resolve);
            }).then(() => {
                multiTaskAlice.activities.forEach(activity => {
                    if (activity.sid === credentials.multiTaskConnectActivitySid) {
                        assert.isTrue(activity.isCurrent,
                            envTwilio.getErrorMessage(`Task ${multiTaskAlice.sid} activity is not current and should be`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                        assert.equal(multiTaskAlice.activity, activity,
                            envTwilio.getErrorMessage(`Task ${multiTaskAlice.sid} activity mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    } else {
                        assert.isFalse(activity.isCurrent,
                            envTwilio.getErrorMessage(`Task ${multiTaskAlice.sid} activity is current and should not be`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    }
                });
            });
        }).timeout(5000);

        it('@SixSigma - should populate .reservations with 0 Reservations when none currently pending', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: credentials.region,
                edge: credentials.edge
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.equal(multiTaskAlice.reservations.size, 0,
                    envTwilio.getErrorMessage(`Task ${multiTaskAlice.sid} reservation size mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

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

        it('@SixSigma - should populate pending .reservations', async() => {
            await new Promise(r => setTimeout(r, 2000));
            multiTaskAlice = new Worker(aliceMultiToken, {
                region: credentials.region,
                edge: credentials.edge
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                assert.equal(multiTaskAlice.reservations.size, defaultChannelCapacity,
                    envTwilio.getErrorMessage(`Task ${multiTaskAlice.reservations.sid} reservation size mismatch`, credentials.accountSid, credentials.multiTaskAliceSid));

                multiTaskAlice.channels.forEach(channel => {
                    if (channel.name === defaultChannelName) {
                        assert.isFalse(channel.available,
                            envTwilio.getErrorMessage('Channel name mismatch', credentials.accountSid, credentials.multiTaskAliceSid));

                    }
                });
            });
        }).timeout(5000);
    });

    describe('Multi Task Worker creates Task', () => {
        it('@SixSigma - should be able to create a Task for self', () => {
            const multiTaskAlice = new Worker(aliceMultiToken, {
                region: credentials.region,
                edge: credentials.edge
            });

            return new Promise(resolve => {
                multiTaskAlice.on('ready', resolve);
            }).then(() => {
                return multiTaskAlice.createTask('customer', 'worker', credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid).then(createdTaskSid => {
                    assert.isTrue(createdTaskSid.startsWith('WT'),
                        envTwilio.getErrorMessage(`Task sid ${createdTaskSid} does not start with WT`, credentials.accountSid, credentials.multiTaskAliceSid));

                });
            });
        });
    });
});
