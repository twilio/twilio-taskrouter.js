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

    describe('#Task Canceled', () => {
        it('should get the canceled event on the task.', done => {
            new Promise(resolve => alice.on('reservationCreated', reservation => resolve(reservation)))
                .then(reservation => {
                    assert.equal(alice.reservations.size, 1,
                        envTwilio.getErrorMessage('Reservation size count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    const cancelTaskEventListener = new Promise(resolve => {
                        reservation.task.on('canceled', canceledTask => {
                            resolve(canceledTask);
                        });
                    });

                    return envTwilio.cancelTask(credentials.multiTaskWorkspaceSid, reservation.task.sid, 'Time to go home').then(() => Promise.all([cancelTaskEventListener, reservation]));
                })
                .then(taskResArr => {
                    assert.equal(taskResArr[0], taskResArr[1].task);
                    assert.equal(taskResArr[0].taskChannelUniqueName, 'default',
                        envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} channel unique name mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    assert.equal(taskResArr[0].status, 'canceled',
                        envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} status  mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    assert.equal(taskResArr[0].reason, 'Time to go home',
                        envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} reason for status change mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    expect(taskResArr[0].attributes).to.deep.equal({
                        'selected_language': 'es'
                    });
                    assert.equal(taskResArr[0].workflowSid, credentials.multiTaskWorkflowSid,
                        envTwilio.getErrorMessage('Workflow sid mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    done();
                }).catch(done);
        }).timeout(10000);
    });

    describe.skip('#Task Wrapup', () => {
        // ORCH-1795 filed for unreliable test.
        it.skip('should get the wrapup event on the task.', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation);
                });
            }).then(reservation => {
                assert.equal(alice.reservations.size, 1,
                    envTwilio.getErrorMessage('Reservation size count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                // Accept the reservation and complete the task
                return reservation.accept()
                    .then(acceptedReservation => acceptedReservation.task.wrapUp({
                        reason: 'Wrapping Task'
                    }))
                    .then(() => {
                    // Expect the completed event on the task
                    return new Promise(resolve => {
                        reservation.task.on('wrapup', wrapupTask => {
                            assert.equal(reservation.task, wrapupTask,
                                envTwilio.getErrorMessage(`Task ${reservation.task.sid} status mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                            resolve([wrapupTask, reservation]);
                        });
                    });
                });
            }).then(taskResArr => {
                assert.equal(taskResArr[0], taskResArr[1].task);
                assert.equal(taskResArr[0].taskChannelUniqueName, 'default',
                    envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} channel unique name mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.equal(taskResArr[0].status, 'wrapping',
                    envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} status  mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.equal(taskResArr[0].reason, 'Wrapping Task',
                    envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} reason for status change mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                expect(taskResArr[0].attributes).to.deep.equal({
                    'selected_language': 'es'
                });
                assert.equal(taskResArr[0].workflowSid, credentials.multiTaskWorkflowSid,
                    envTwilio.getErrorMessage('Workflow sid mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                // Make sure the task wrapup does not remove the reservation from the worker's reservation list
                assert.equal(alice.reservations.size, 1,
                    envTwilio.getErrorMessage('Reservation size count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

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

    describe('Task versioning', () => {
        it('should update the version of the task', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => {
                    resolve(reservation.task);
                });
            }).then(task => {
                const oldVersion = task.version;
                const newAttributes = {
                    languages: ['en']
                };
                return task.setAttributes(newAttributes)
                    .then(updatedTask => {
                        expect(updatedTask.version).to.be.greaterThan(oldVersion);
                        done();
                    });
            }).catch(done);
        }).timeout(5000);
    });

    describe.skip('#Task Completed', () => {
        // ORCH-1784 filed for unreliable test
        it.skip('should get the completed event on the task.', done => {
            new Promise(resolve => {
                alice.on('reservationCreated', reservation => resolve(reservation));
            }).then(reservation => {
                assert.equal(alice.reservations.size, 1,
                    envTwilio.getErrorMessage('Reservation size count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                // Accept the reservation and complete the task
                return reservation.accept()
                    .then(acceptedReservation => acceptedReservation.task.complete('Completing Task'))
                    .then(completedTask => {
                        // Expect the completed event on the task
                        return new Promise(resolve => {
                            completedTask.on('completed', ct => {
                                assert.equal(reservation.task, ct,
                                    envTwilio.getErrorMessage(`Reservation task ${reservation.task.sid} does not equal complete task` + ct.sid,
                                              credentials.accountSid, credentials.multiTaskConnectActivitySid));

                                resolve([ct, reservation]);
                            });
                        });
                    });

            }).then(taskResArr => {
                assert.equal(taskResArr[0], taskResArr[1].task);
                assert.equal(taskResArr[0].taskChannelUniqueName, 'default',
                    envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} channel unique name mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.equal(taskResArr[0].status, 'completed',
                    envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} status  mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.equal(taskResArr[0].reason, 'Completing Task',
                    envTwilio.getErrorMessage(`Task ${taskResArr[0].sid} reason for status change mismatch`, credentials.accountSid, credentials.multiTaskConnectActivitySid));

                expect(taskResArr[0].attributes).to.deep.equal({
                    'selected_language': 'es'
                });
                assert.equal(taskResArr[0].workflowSid, credentials.multiTaskWorkflowSid,
                    envTwilio.getErrorMessage('Workflow sid mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                // Do not assert on reservations.size, because eventually (or before depending on order)
                // reservation.completed event will clear the map.
                done();
            }).catch(done);
        }).timeout(10000);
    });
});
