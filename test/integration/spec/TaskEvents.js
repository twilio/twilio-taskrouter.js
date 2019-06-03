const chai = require('chai');
chai.should();
const assert = chai.assert;
const expect = chai.expect;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');
import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

describe('TaskEvents', () => {
    const multiTaskAliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let alice;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            alice = new Worker(multiTaskAliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`,
                logLevel: 'error'
            });
            // Make sure Bob remains offline before creating a task
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskBobSid,
                credentials.multiTaskUpdateActivitySid
            ).then(() => envTwilio.createTask(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskWorkflowSid,
                '{ "selected_language": "es" }'
            ));
        });
    });

    afterEach(() => {
        alice.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.multiTaskWorkspaceSid,
                credentials.multiTaskAliceSid,
                credentials.multiTaskUpdateActivitySid
            );
        });
    });

    describe('#Task Updated', () => {
        it('should get the updated event on the task.', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation);
                });
            }).then(reservation => {
                assert.equal(alice.reservations.size, 1);

                // Update the task
                return envTwilio.updateTask(credentials.multiTaskWorkspaceSid, reservation.task.sid, '{"selected_language": "en"}').then(() => {
                    // Expect the update event on the task
                    return new Promise(resolve => {
                        reservation.task.on('updated', updatedTask => {
                            resolve([updatedTask, reservation]);
                        });
                    });
                });
            }).then(taskResArr => {
                assert.equal(taskResArr[0], taskResArr[1].task);
                assert.equal(taskResArr[0].sid.substring(0, 2), 'WT');
                assert.equal(taskResArr[0].taskChannelUniqueName, 'default');
                assert.equal(taskResArr[0].status, 'reserved');
                assert.equal(taskResArr[0].queueSid.substring(0, 2), 'WQ');
                expect(taskResArr[0].attributes).to.deep.equal({
                    'selected_language': 'en'
                });
                assert.equal(taskResArr[0].workflowSid, credentials.multiTaskWorkflowSid);
                // Make sure the task update does not remove the reservation from the worker's reservation list
                assert.equal(alice.reservations.size, 1);
                done();
            }).catch(done);
        }).timeout(10000);
    });

    describe('#Task Canceled', () => {
        it('should get the canceled event on the task.', done => {
            new Promise(resolve => alice.on('reservationCreated', reservation => resolve(reservation)))
                .then(reservation => {
                    assert.equal(alice.reservations.size, 1);

                    const cancelTaskEventListener = new Promise(resolve => {
                        reservation.task.on('canceled', canceledTask => {
                            resolve(canceledTask);
                        });
                    });

                    return envTwilio.cancelTask(credentials.multiTaskWorkspaceSid, reservation.task.sid, 'Time to go home').then(() => Promise.all([cancelTaskEventListener, reservation]));
                })
                .then(taskResArr => {
                    assert.equal(taskResArr[0], taskResArr[1].task);
                    assert.equal(taskResArr[0].sid.substring(0, 2), 'WT');
                    assert.equal(taskResArr[0].taskChannelUniqueName, 'default');
                    assert.equal(taskResArr[0].status, 'canceled');
                    assert.equal(taskResArr[0].queueSid.substring(0, 2), 'WQ');
                    assert.equal(taskResArr[0].reason, 'Time to go home');
                    expect(taskResArr[0].attributes).to.deep.equal({
                        'selected_language': 'es'
                    });
                    assert.equal(taskResArr[0].workflowSid, credentials.multiTaskWorkflowSid);
                    done();
                }).catch(done);
        }).timeout(10000);
    });

    describe('#Task Wrapup', () => {
        it('should get the wrapup event on the task.', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation);
                });
            }).then(reservation => {
                assert.equal(alice.reservations.size, 1);

                // Accept the reservation and complete the task
                return reservation.accept()
                    .then(acceptedReservation => acceptedReservation.task.wrapUp({
                        reason: 'Wrapping Task'
                    }))
                    .then(() => {
                    // Expect the completed event on the task
                    return new Promise(resolve => {
                        reservation.task.on('wrapup', wrapupTask => {
                            assert.equal(reservation.task, wrapupTask);
                            resolve([wrapupTask, reservation]);
                        });
                    });
                });
            }).then(taskResArr => {
                assert.equal(taskResArr[0], taskResArr[1].task);
                assert.equal(taskResArr[0].sid.substring(0, 2), 'WT');
                assert.equal(taskResArr[0].taskChannelUniqueName, 'default');
                assert.equal(taskResArr[0].status, 'wrapping');
                assert.equal(taskResArr[0].queueSid.substring(0, 2), 'WQ');
                assert.equal(taskResArr[0].reason, 'Wrapping Task');
                expect(taskResArr[0].attributes).to.deep.equal({
                    'selected_language': 'es'
                });
                assert.equal(taskResArr[0].workflowSid, credentials.multiTaskWorkflowSid);
                // Make sure the task wrapup does not remove the reservation from the worker's reservation list
                assert.equal(alice.reservations.size, 1);
                done();
            }).catch(done);
        }).timeout(10000);
    });

    describe('#setAttributes(newAttributes)', () => {
        it('should set the attributes of the Task', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation.task);
                });
            }).then(task => {
                const newAttributes = {
                    languages: ['en']
                };
                return task.setAttributes(newAttributes)
                    .then(updatedTask => {
                        expect(task).to.equal(updatedTask);
                        expect(task.attributes).to.deep.equal(newAttributes);
                        done();
                    });
            }).catch(done);
        }).timeout(5000);

        it('should return an error if unable to set the attributes', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation.task);
                });
            }).then(task => {
                (() => {
                    task.setAttributes();
                }).should.throw(/attributes is a required parameter/);
                done();
            }).catch(done);
        }).timeout(5000);
    });

    describe('#Task Completed', () => {
        it('should get the completed event on the task.', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => resolve(reservation));
            }).then(reservation => {
                assert.equal(alice.reservations.size, 1);
                // Accept the reservation and complete the task
                return reservation.accept()
                    .then(acceptedReservation => acceptedReservation.task.complete('Completing Task'))
                    .then(completedTask => {
                        // Expect the completed event on the task
                        return new Promise(resolve => {
                            completedTask.on('completed', ct => {
                                assert.equal(reservation.task, ct);
                                resolve([ct, reservation]);
                            });
                        });
                    });

            }).then(taskResArr => {
                assert.equal(taskResArr[0], taskResArr[1].task);
                assert.equal(taskResArr[0].sid.substring(0, 2), 'WT');
                assert.equal(taskResArr[0].taskChannelUniqueName, 'default');
                assert.equal(taskResArr[0].status, 'completed');
                assert.equal(taskResArr[0].queueSid.substring(0, 2), 'WQ');
                assert.equal(taskResArr[0].reason, 'Completing Task');
                expect(taskResArr[0].attributes).to.deep.equal({
                    'selected_language': 'es'
                });
                assert.equal(taskResArr[0].workflowSid, credentials.multiTaskWorkflowSid);

                // Do not assert on reservations.size, because eventually (or before depending on order)
                // reservation.completed event will clear the map.
                done();
            }).catch(done);
        }).timeout(10000);
    });
});
