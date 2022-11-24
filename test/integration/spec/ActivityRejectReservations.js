import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('ActivityRejectReservations', () => {
    const multiTaskToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
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
        it('@SixSigma - should reject the pending reservations for the Worker when the flag is set to true, and update the activity', async() => {
            // this test fails sometimes with 412 errors, because it tries to update the activity sid with an older version during initialization,
            // adding this delay before initializing the worker so all background updates are applied, it will make sense to refactor this test to properly wait for events
            await new Promise(resolve => setTimeout(resolve, 2000));

            multiTaskWorker = new Worker(multiTaskToken,  {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
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
                    assert.equal(reservation.status, 'pending',
                        envTwilio.getErrorMessage('Reservation status mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    assert.equal(reservation.task.taskChannelUniqueName, 'default',
                        envTwilio.getErrorMessage('Reservation task channel name mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

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

                assert.equal(multiTaskWorker.reservations.size, defaultChannelCapacity,
                    envTwilio.getErrorMessage('Reservation size mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                const options = { rejectPendingReservations: true };
                const updatedActivity = await updateActivity.setAsCurrent(options);
                expect(multiTaskWorker.activity).to.deep.equal(updatedActivity);
                multiTaskWorker.channels.forEach( channel => {
                    if (channel.name === defaultChannelName) {
                        assert.isFalse(channel.available,
                            envTwilio.getErrorMessage('Channel state mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    }
                });
                assert.isTrue(updatedActivity.isCurrent,
                    envTwilio.getErrorMessage('Worker updated activity state mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.isFalse(connectActivity.isCurrent,
                    envTwilio.getErrorMessage('Worker connext activity state mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                return Promise.all(promises).then(() => {
                    multiTaskWorker.reservations.forEach(reservation => {
                        expect(reservation.status).equal('rejected');
                    });
                });
            });

        }).timeout(10000);
    });

    describe.skip('unsuccessful update with reject pending reservations', () => {

        // ORCH-1798 filed for unreliable test
        it.skip('should not reject the pending reservations for the Worker when the flag is set to true, and the activity is unavailable', async() => {
            multiTaskWorker = new Worker(multiTaskToken,  {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
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
            }).then(() => {
                multiTaskWorker.reservations.forEach(reservation => {
                    assert.equal(reservation.status, 'pending',
                        envTwilio.getErrorMessage('Reservation status mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    assert.equal(reservation.task.taskChannelUniqueName, 'default',
                        envTwilio.getErrorMessage('Reservation task channel name mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                });
                multiTaskWorker.activities.forEach(activity => {
                    if (activity.sid === credentials.multiTaskConnectActivitySid) {
                        availableUpdateActivity = activity;
                    }
                });

                assert.equal(multiTaskWorker.reservations.size, defaultChannelCapacity,
                    envTwilio.getErrorMessage('Reservation size mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                const options = { rejectPendingReservations: true };
                expect(() => availableUpdateActivity.setAsCurrent(options)).to.throw(
                    'Unable to reject pending reservations when updating to an Available activity state.');
            });

        }).timeout(5000);
    });
});
