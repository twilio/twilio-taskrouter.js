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
                );
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

        it('should get the updated event on the task. #Task Updated', done => {
            Promise.resolve()
                .then(() => new Promise(resolve =>
                    // Verify Alice ready
                    alice.on('ready', readyAlice => {
                        resolve(readyAlice);
                    })))
                // Create task
                .then(() => alice.createTask('customer', 'worker', credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid))
                .then(() => new Promise(resolve =>
                    // Update the task
                    alice.on('reservationCreated', reservation => {
                        resolve(reservation);
                    })))
                .then((reservation) => new Promise(resolve => {
                    // Update task>reservation attr
                    reservation.task.on('updated', updatedTask => {
                        resolve([updatedTask, reservation]);
                    });
                    envTwilio.updateTask(credentials.multiTaskWorkspaceSid, reservation.task.sid, '{"selected_language": "en"}');
                }))
                .then((taskResArr) => {
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
                    assert.equal(taskResArr[0].routingTarget, alice.sid);
                    done();
                }).catch(done);
        }).timeout(10000);

        it('should get the updated event on the outbound task. #OutboundTask Updated', done => {
            Promise.resolve()
                .then(() => new Promise(resolve =>
                    // Verify Alice ready
                    alice.on('ready', readyAlice => {
                        resolve(readyAlice);
                    })))
                .then(() => alice.createTask('customer', 'worker', credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid))
                .then(() => new Promise(resolve =>
                    // Update the task
                    alice.on('reservationCreated', reservation => {
                        resolve(reservation);
                    })))
                .then((reservation) => new Promise(resolve => {
                    reservation.task.on('updated', updatedTask => {
                        resolve([updatedTask, reservation]);
                    });
                    envTwilio.updateTask(credentials.multiTaskWorkspaceSid, reservation.task.sid, '{"selected_language": "en"}');
                }))
                .then(taskResArr => {
                    assert.equal(taskResArr[0], taskResArr[1].task);
                    assert.equal(taskResArr[0].sid.substring(0, 2), 'WT');
                    assert.equal(taskResArr[0].taskChannelUniqueName, 'default');
                    assert.equal(taskResArr[0].status, 'reserved');
                    assert.equal(taskResArr[0].queueSid.substring(0, 2), 'WQ');
                    assert.equal(taskResArr[0].routingTarget, alice.sid);
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

});

