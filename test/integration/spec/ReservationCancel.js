import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { getAccessToken } from '../../util/MakeAccessToken';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const credentials = require('../../env');
const Twilio = require('twilio');

describe('Reservation Canceled', () => {
    const multiTaskAliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    const client = new Twilio(credentials.accountSid, credentials.authToken);
    let worker;

    before(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            worker = new Worker(multiTaskAliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });
        });
    });

    after(() => {
        worker.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        });
    });

    describe.skip('#create reservation, cancel the task and cancel reservation', () => {
        // ORCH-1775 filed for unreliable test
        it.skip('should accept the reservation', () => {
            envTwilio.createTask(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskWorkflowSid,
                '{ "selected_language": "es" }'
            );

            return new Promise(resolve => {
                worker.on('reservationCreated', reservation => {
                    expect(worker.reservations.size).to.equal(1);
                    expect(reservation.status).to.equal('pending');
                    expect(reservation.sid.substring(0, 2)).to.equal('WR');
                    expect(reservation.task.sid.substring(0, 2)).to.equal('WT');
                    expect(reservation.task.taskChannelUniqueName).to.equal('default');
                    resolve(reservation);
                });
            }).then(reservation => {
                return Promise.all([
                    reservation.on('canceled', canceledRes => {
                        expect(canceledRes.task.status).equal('canceled');
                        expect(canceledRes.status).equal('canceled');
                        assert.isFalse(canceledRes.hasOwnProperty('canceledReasonCode'),
                            envTwilio.getErrorMessage('Reservation state mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    }),
                    client.taskrouter.workspaces(credentials.multiTaskWorkspaceSid)
                        .tasks(reservation.task.sid)
                        .update({ assignmentStatus: 'canceled' })
                ]);
            });
        }).timeout(10000);
    });
});
