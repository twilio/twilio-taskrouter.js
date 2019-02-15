import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { doesNotReject } from 'assert';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Activity', () => {

    const token = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let worker;

    before(() => {
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid);
    });

    after(() => {
        worker.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.nonMultiTaskWorkspaceSid,
                credentials.nonMultiTaskAliceSid,
                credentials.nonMultiTaskUpdateActivitySid
            );
        });
    });

    // describe('#setAsCurrent', () => {
    //     it('should set this connect activity on the Worker, and then update it', () => {
    //         worker = new Worker(token, {
    //             ebServer: `${credentials.ebServer}/v1/wschannels`,
    //             wsServer: `${credentials.wsServer}/v1/wschannels`,
    //             connectActivitySid: credentials.nonMultiTaskConnectActivitySid
    //         });

    //         let connectActivity;
    //         let updateActivity;
    //         return worker.on('activityUpdated', async connectWorker => {
    //             assert.isNotNull(worker.activities);
    //             assert.equal(worker.activities.size, 4);

    //                 worker.activities.forEach(activity => {
    //                     if (activity.sid === credentials.nonMultiTaskConnectActivitySid) {
    //                         connectActivity = activity;
    //                     }
    //                     if (activity.sid === credentials.nonMultiTaskUpdateActivitySid) {
    //                         updateActivity = activity;
    //                     }
    //                 });

    //                 expect(worker.activity).to.deep.equal(connectWorker.activity);

    //             const updatedActivity = await updateActivity.setAsCurrent();
    //             expect(worker.activity).to.deep.equal(updateActivity);
    //             expect(worker.activity).to.deep.equal(updatedActivity);
    //             assert.isTrue(updateActivity.isCurrent);
    //             assert.isFalse(connectActivity.isCurrent);
    //         });
    //     }).timeout(5000);
    // });

    describe('#setRejectPendingReservationsFlag', () => {
        it('should set reject the pending reservations for the Worker when the flag is set to true, and update the activity', () => {
            worker = new Worker(token,  {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`,
                connectActivitySid: credentials.nonMultiTaskConnectActivitySid
            });
            let connectActivity;
            let updateActivity;
            let reservations;

            return new Promise(resolve =>  {
                worker.on('reservationCreated', reservation => {
                    reservations.push(reservation)
                    if(worker.reservations.size = 2) {
                        return resolve(reservations)
                    }
                });
            }).then(async reservations => {
                // assert.equal(worker.reservation.size, 2);
                // reservations.forEach(reservation => {
                //     assert.equal(reservation.status, 'pending');
                //     assert.equal(reservation.sid.substring(0, 2), 'WR');
                //     assert.equal(reservation.task.sid.substring(0, 2), 'WT');
                //     assert.equal(reservation.task.taskChannelUniqueName, 'default');
                // })
                // worker.activities.forEach(activity => {
                //     if (activity.sid === credentials.nonMultiTaskConnectActivitySid) {
                //         connectActivity = activity;
                //     }
                //     if (activity.sid === credentials.nonMultiTaskUpdateActivitySid) {
                //         updateActivity = activity;
                //     }
                // });

                // expect(worker.activity).to.deep.equal(connectWorker.activity);

                // const updatedActivity = await updateActivity.setAsCurrent(true);
                // expect(worker.activity).to.deep.equal(updateActivity);
                // expect(worker.activity).to.deep.equal(updatedActivity);
                // assert.isTrue(updateActivity.isCurrent);
                // assert.isFalse(connectActivity.isCurrent);

                // reservations.forEach(reservation => {
                //     expect(reservation.status).equal('rejected');
                
                // });
                done();

                return reservations;
            })

        }).timeout(5000);
    })


});
