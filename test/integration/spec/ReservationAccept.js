import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import Task from '../../../lib/Task';
import { getAccessToken } from '../../util/MakeAccessToken';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const credentials = require('../../env');

describe('Reservation Accept', () => {
    const multiTaskAliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let worker;

    before(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            worker = new Worker(multiTaskAliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: credentials.region,
                edge: credentials.edge
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
        // ORCH-1796 file for unreliable test
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

                reservation.accept().then(async updatedReservation => {
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

                    await new Promise(resolve => {
                        reservation.on('accepted', acceptedReservation => {
                            resolve(acceptedReservation);
                        });
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
                }).catch(done);
            });
        }).timeout(15000);
    });

    describe('#receive a reservationCompleted event after deleting an accepted task', () => {
        let acceptedReservation;
        it('should accept the reservation', () => {
            const promises = [];
            // Register Listener
            promises.push(new Promise(resolve => {
                worker.on('reservationCreated', reservation => {
                    resolve(reservation);
                });
            }));
            // Create task
            promises.push(envTwilio.createTask(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskWorkflowSid,
                '{ "selected_language": "es" }'
            ));
            return Promise
                    .all(promises)
                    .then(results => {
                        assert.equal(results.length, 2,
                            envTwilio.getErrorMessage('Results count mismatch (not sure which results type is being counted)', credentials.accountSid, credentials.multiTaskConnectActivitySid));
                        let reservation = results[0];
                        return reservation
                                .accept()
                                .then(reservation => {
                                    acceptedReservation = reservation;
                                    // Verify reservation is reflected in internal state
                                    expect(1).to.equal(worker.reservations.size);
                                    // Assert that reservation by this sid exists
                                    assert.exists(worker.reservations.get(reservation.sid),
                                        envTwilio.getErrorMessage('Worker/reservation mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                                });
                    });
        }).timeout(5000);

        it('should delete the task and receive the completed event', done => {
            envTwilio.deleteTask(credentials.multiTaskWorkspaceSid, acceptedReservation.task.sid);
            acceptedReservation.on('completed', () => done());
            worker.removeAllListeners();
        }).timeout(5000);
    });

    describe('#accept reservation, complete task, wait for reservation completed', () => {
        it('should accept the reservation, complete the task and receive a reservationCompleted event', () => {
            const taskAndReservationCreated = [];
            // Register listener for worker
            taskAndReservationCreated.push(new Promise(resolve => {
                worker.on('reservationCreated', reservation => {
                    resolve(reservation);
                });
            }));

            // Create task
            taskAndReservationCreated.push(
                envTwilio.createTask(
                    credentials.multiTaskWorkspaceSid,
                    credentials.multiTaskWorkflowSid,
                    '{ "selected_language": "es" }'
                )
            );

            const reservationAccepted =
                    Promise
                        .all(taskAndReservationCreated)
                        .then(results => {
                            assert.equal(results.length, 2,
                                envTwilio.getErrorMessage('Created reservation count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                            let reservation = results[0];
                            return reservation
                                        .accept()
                                        .catch(err => {
                                            console.log('failed to accept reservation', err);
                                            throw err;
                                        });
                            }
                        );


            const completedReservation = async reservation => {
                await new Promise(resolve => {
                    reservation.on('accepted', acceptedReservation => {
                        resolve(acceptedReservation);
                    });
                });

                const taskAndReservationCompleted = [];

                taskAndReservationCompleted.push(new Promise(resolve => {
                    reservation.on('completed', completedReservation => {
                        resolve(completedReservation);
                    });
                }));

                taskAndReservationCompleted.push(
                    reservation.task.complete('Work is done')
                                    .catch(err => {
                                        console.log('failed to complete reservation', err);
                                        throw err;
                                    })
                );
                return Promise.all(taskAndReservationCompleted);
            };

            return reservationAccepted
                                    .then(completedReservation)
                                    .then(results => {
                                        assert.equal(results.length, 2,
                                            envTwilio.getErrorMessage('Completed results count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                                        let reservation = results[0];
                                        expect(reservation.task.reason).to.equal('Work is done');
                                        expect(reservation.task.status).to.equal('completed');
                                        expect(0).to.equal(worker.reservations.size);
                                    });
        }).timeout(5000);
    });
});
