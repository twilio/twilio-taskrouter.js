import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('ActivityRejectReservations', () => {

    const multiTaskToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let multiTaskWorker;
    let defaultChannelName = 'default';
    let defaultChannelCapacity = 3;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid)
            .then(() => {
                return envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, defaultChannelName, defaultChannelCapacity).then(() => {
                    envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, credentials.multiTaskUpdateActivitySid).then(() => {
                        const promises = [];
                        for (let i = 0; i < 3; i++) {
                            promises.push(envTwilio.createTask(credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, '{}'));
                        }
                        return Promise.all(promises);
                    });
                });
            });

    });

    afterEach(() => {
         return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid);
            }).then(() => {
                return envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, defaultChannelName, 1);
            });
    });

    describe('successful update with reject pending reservations', () => {
        it('should reject the pending reservations for the Worker when the flag is set to true, and update the activity', async() => {
            multiTaskWorker = new Worker(multiTaskToken,  {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            let connectActivity;
            let updateActivity;
            const createdReservations = [];

            return new Promise(resolve => {
                multiTaskWorker.on('reservationCreated', reservation => {
                    createdReservations.push(reservation);

                    if (createdReservations.length === 3) {
                        resolve(createdReservations);
                    }
                });
            }).then(async() => {
                const promises = [];
                multiTaskWorker.reservations.forEach(reservation => {
                    assert.equal(reservation.status, 'pending');
                    assert.equal(reservation.sid.substring(0, 2), 'WR');
                    assert.equal(reservation.task.sid.substring(0, 2), 'WT');
                    assert.equal(reservation.task.taskChannelUniqueName, 'default');
                    promises.push(new Promise(resolve => {
                        reservation.on('rejected', data => {
                            resolve(data);
                        });
                    }));
                });

                multiTaskWorker.activities.forEach(activity => {
                    if (activity.sid === credentials.multiTaskConnectActivitySid) {
                        connectActivity = activity;
                    }
                    if (activity.sid === credentials.multiTaskUpdateActivitySid) {
                        updateActivity = activity;
                    }
                });

                assert.equal(multiTaskWorker.reservations.size, defaultChannelCapacity);

                const options = { rejectPendingReservations: true };
                const updatedActivity = await updateActivity.setAsCurrent(options);
                expect(multiTaskWorker.activity).to.deep.equal(updatedActivity);
                multiTaskWorker.channels.forEach( channel => {
                    if (channel.name === defaultChannelName) {
                        assert.isFalse(channel.available);
                    }
                });
                assert.isTrue(updatedActivity.isCurrent);
                assert.isFalse(connectActivity.isCurrent);
                return Promise.all(promises).then(() => {
                    multiTaskWorker.reservations.forEach(reservation => {
                        expect(reservation.status).equal('rejected');
                    });
                });
            });

        }).timeout(5000);
    });

    describe('unsuccessful update with reject pending reservations', () => {
        it('should not reject the pending reservations for the Worker when the flag is set to true, and the activity is unavailable', async() => {
            multiTaskWorker = new Worker(multiTaskToken,  {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            const createdReservations = [];
            let availableUpdateActivity;

            return new Promise(resolve => {
                multiTaskWorker.on('reservationCreated', reservation => {
                    createdReservations.push(reservation);

                    if (createdReservations.length === 3) {
                        resolve(createdReservations);
                    }
                });
            }).then(async() => {
                multiTaskWorker.reservations.forEach(reservation => {
                    assert.equal(reservation.status, 'pending');
                    assert.equal(reservation.sid.substring(0, 2), 'WR');
                    assert.equal(reservation.task.sid.substring(0, 2), 'WT');
                    assert.equal(reservation.task.taskChannelUniqueName, 'default');
                });
                multiTaskWorker.activities.forEach(activity => {
                    if (activity.sid === credentials.multiTaskConnectActivitySid) {
                        availableUpdateActivity = activity;
                    }
                });

                assert.equal(multiTaskWorker.reservations.size, defaultChannelCapacity);
                const options = { rejectPendingReservations: true };
                expect(() => availableUpdateActivity.setAsCurrent(options)).to.throw(
                    'Unable to reject pending reservations when updating to an Available activity state.');
            });

        }).timeout(5000);
    });
});
