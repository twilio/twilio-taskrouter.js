import { describe, it, before, after } from 'mocha';

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
            envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        });
    });


    describe('#reject reservation', () => {
        it('should reject the reservation', () => {
            const alice = new Worker(multiTaskAliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels/{accountSid}/{workerSid}`,
                wsServer: `${credentials.wsServer}/v1/wschannels/{accountSid}/{workerSid}`
            });

            return new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation);
                });
            }).then(reservation => {
                assert.equal(alice.reservations.size, 1);
                assert.equal(reservation.status, 'pending');
                assert.equal(reservation.sid.substring(0, 2), 'WR');
                assert.equal(reservation.task.sid.substring(0, 2), 'WT');
                assert.equal(reservation.task.taskChannelUniqueName, 'default');
                return reservation.reject().then(updatedReservation => {
                    expect(reservation).to.equal(updatedReservation);
                    expect(reservation.status).equal('rejected');
                    expect(updatedReservation.status).equal('rejected');
                });
            });
        }).timeout(10000);
    });
});
