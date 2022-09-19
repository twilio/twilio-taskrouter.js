
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');
import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

describe('Reservation Reject', () => {
    const multiTaskAliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

    before(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, credentials.multiTaskUpdateActivitySid).then(() => {
                return envTwilio.createTask(
                    credentials.multiTaskWorkspaceSid,
                    credentials.multiTaskWorkflowSid,
                    '{ "selected_language": "es" }'
                );
            });
        });
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


    describe('#reject reservation', () => {
        it('@SixSigma - should reject the reservation', () => {
            const alice = new Worker(multiTaskAliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: credentials.region,
                edge: credentials.edge
            });

            return new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation);
                });
            }).then(reservation => {
                assert.equal(alice.reservations.size, 1,
                    envTwilio.getErrorMessage('Reservation size mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.equal(reservation.status, 'pending',
                    envTwilio.getErrorMessage('Reservation status mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.equal(reservation.task.taskChannelUniqueName, 'default',
                    envTwilio.getErrorMessage('Reservation channel unique name mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                const promises = [];
                promises.push(reservation.reject());
                promises.push(new Promise(resolve => {
                    reservation.on('rejected', data => {
                        resolve(data);
                    });
                }));
                // Wait for both the POST api and Websocket event before comparing
                // Reservation object
                return Promise.all(promises).then(results => {
                    assert.equal(results.length, 2,
                        envTwilio.getErrorMessage('POST API and WebSocket Reservation results count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    expect(results[0]).to.equal(results[1]);
                    expect(results[0].status).equal(results[1].status);
                    expect(results[1].status).equal('rejected');
                });
            });
        }).timeout(10000);
    });
});
