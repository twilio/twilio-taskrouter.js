import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import Task from '../../../lib/Task';
import { getAccessToken } from '../../util/MakeAccessToken';
import { expect } from 'chai';

const credentials = require('../../env');

describe('Reservation Accept', () => {
    const multiTaskAliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let worker;

    before(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            worker = new Worker(multiTaskAliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`
            });

            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            ).catch(err => {
                console.log('Failed to update worker activity', err);
                throw err;
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

    describe('#accept reservation, wrapup and complete the task', () => {
        it('should accept the reservation, wrapup and complete the task', done => {
            envTwilio.createTask(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskWorkflowSid,
                '{ "selected_language": "es" }'
            );
            worker.on('reservationCreated', reservation => {
                expect(worker.reservations.size).to.equal(1);
                expect(reservation.status).to.equal('pending');
                expect(reservation.sid.substring(0, 2)).to.equal('WR');
                expect(reservation.task.sid.substring(0, 2)).to.equal('WT');
                expect(reservation.task.taskChannelUniqueName).to.equal('default');

                reservation.accept().then(updatedReservation => {
                    expect(reservation).to.equal(updatedReservation);
                    expect(reservation.status).equal('accepted');
                    expect(updatedReservation.status).equal('accepted');

                    expect(updatedReservation.task).to.be.an.instanceOf(Task);
                    expect(updatedReservation.task.sid.substring(0, 2)).to.equal('WT');

                    // This still shows "assigned" status, since the POST only returns a Reservation object not a Task object
                    // Needs to rely on the task.updated event in order to have the Task data also updated
                    // ideally we'd be returning a ReservationTask object
                    // expect(updatedReservation.task.status).to.equal('assigned');
                    expect(updatedReservation.task.status).to.equal('reserved');
                    expect(updatedReservation.task.attributes).to.deep.equal({
                        'selected_language': 'es'
                    });

                    return updatedReservation.task.wrapUp({
                        reason: 'Work is almost finished'
                    });
                }).then(wrappedUpTask => {
                    expect(wrappedUpTask.status).to.equal('wrapping');
                    expect(wrappedUpTask.reason).to.equal('Work is almost finished');
                    return wrappedUpTask.complete('Work is done');
                }).then(completedTask => {
                    expect(completedTask.status).to.equal('completed');
                    expect(completedTask.reason).to.equal('Work is done');
                    worker.removeAllListeners();
                    done();
                }).catch(err => {
                    console.log('failed to accept and complete task', err);
                    throw err;
                });
            });
        }).timeout(5000);
    });

    describe('#receive a reservationCompleted event after deleting an accepted task', () => {
        let acceptedReservation;
        it('should accept the reservation', done => {
            envTwilio.createTask(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskWorkflowSid,
                '{ "selected_language": "es" }'
            );

            expect(1).to.equal(worker.reservations.size);
            worker.on('reservationCreated', async reservation => {
                acceptedReservation = await reservation.accept().catch(err => {
                    console.log('failed to accept reservation', err);
                    throw err;
                });

                expect(1).to.equal(worker.reservations.size);
                done();
            });
        });

        it('should delete the task and receive the completed event', done => {
            envTwilio.deleteTask(credentials.multiTaskWorkspaceSid, acceptedReservation.task.sid);
            acceptedReservation.on('completed', () => done());
            worker.removeAllListeners();
        });
    }).timeout(5000);

    describe('#accept reservation, complete task, wait for reservation completed', () => {
        it('should accept the reservation, complete the task and receive a reservationCompleted event', done => {
            envTwilio.createTask(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskWorkflowSid,
                '{ "selected_language": "es" }'
            );

            worker.on('reservationCreated', async reservation => {
                const acceptedReservation = await reservation.accept().catch(err => {
                    console.log('failed to accept reservation', err);
                    throw err;
                });

                acceptedReservation.task.complete('Work is done').catch(err => {
                    console.log('failed to complete reservation', err);
                    throw err;
                });

                acceptedReservation.on('completed', completedReservation => {
                    expect(completedReservation.task.reason).to.equal('Work is done');
                    expect(completedReservation.task.status).to.equal('completed');
                    done();
                });
            });
        }).timeout(5000);

        it('should have deleted the reservation', () => {
            expect(0).to.equal(worker.reservations.size);
        });
    });
});
