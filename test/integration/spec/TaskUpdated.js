import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

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
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
    let alice;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            alice = new Worker(multiTaskAliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
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

        it('@SixSigma - should get the updated event on the task. #Task Updated', done => {
            new Promise(resolve => alice.on('ready', readyAlice => resolve(readyAlice)))
                .then(() => new Promise(resolve => {
                    // Update the task
                    alice.on('reservationCreated', reservation => {
                        resolve(reservation);
                    });
                    alice.createTask('customer', 'worker', credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);
                }))
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

        it('@SixSigma - should get the updated event on the outbound task. #OutboundTask Updated', done => {
            new Promise(resolve =>
                    // Verify Alice ready
                    alice.on('ready', readyAlice => {
                        resolve(readyAlice);
                    }))
                .then(() => new Promise(resolve => {
                    // Update the task
                    alice.on('reservationCreated', reservation => {
                        resolve(reservation);
                    });
                    alice.createTask('customer', 'worker', credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);
                }))
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

