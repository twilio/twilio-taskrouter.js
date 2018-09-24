import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import * as assert from 'assert';

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.should();
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Task Transfer', function() {
  /* eslint-disable no-invalid-this */
  this.timeout(5000);
  /* eslint-enable */

  const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
  const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
  const bobToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);

  let alice;
  let bob;
  let aliceReservation;
  let bobReservation;
  before(() => {
    return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
      alice = new Worker(aliceToken, {
        ebServer: `${credentials.ebServer}/v1/wschannels`,
        wsServer: `${credentials.wsServer}/v1/wschannels`,
        logLevel: 'error',
      });

      bob = new Worker(bobToken, {
        ebServer: `${credentials.ebServer}/v1/wschannels`,
        wsServer: `${credentials.wsServer}/v1/wschannels`,
        logLevel: 'error',
      });

      const createTask = envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, 'default', 1)
        .then(() => envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, 'default', 1))
        .then(() => envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, credentials.multiTaskConnectActivitySid))
        .then(() => envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskUpdateActivitySid))
        .then(() => envTwilio.createTask(credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, JSON.stringify({
          to: 'client:alice',
          conference: { sid: 'CF11111111111111111111111111111111' }
        })));

      return Promise.all([
        new Promise(resolve => alice.once('ready', () => resolve())),
        new Promise(resolve => bob.once('ready', () => resolve())),
      ]).then(() => envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid))
        .then(createTask)
        .then(() => {
          aliceReservation = Array.from(alice.reservations.values())[0];
          return aliceReservation.accept();
        });
    });
  });

  after(() => {
    alice.removeAllListeners();
    bob.removeAllListeners();
    return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid)
      .then(envTwilio.updateWorkerActivity(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskAliceSid,
        credentials.multiTaskUpdateActivitySid
      )).then(envTwilio.updateWorkerActivity(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskBobSid,
        credentials.multiTaskUpdateActivitySid
      ));
  });

  it('should get a 200, resolve and emit a transfer-initiated event if all goes well', () => {
    return Promise.all([
      aliceReservation.task.transfer(credentials.multiTaskBobSid),
      new Promise(resolve => { aliceReservation.task.once('transferInitiated', () => resolve()); }),
      new Promise(resolve => { bob.once('reservationCreated', () => resolve()); }),
    ]);
  });

  it('should create a Reservation containing a .transfer object for Bob', () => {
    bobReservation = Array.from(bob.reservations.values())[0];
    assert.equal(bobReservation.transfer.mode, 'WARM');
  });

  it('should update the task when Bob accepts', (done) => {
    bobReservation.once('rejected', () => {
      // Fake it til you make it! This isn't implemented yet, so we're triggering update manually.
      // (rrowland) Fix this when we have a way to transition transfer status.
      bobReservation._update({
        /* eslint-disable camelcase */
        account_sid: bobReservation.accountSid,
        date_created: bobReservation.dateCreated,
        date_updated: bobReservation.dateUpdated,
        reservation_status: bobReservation.reservationStatus,
        sid: bobReservation.sid,
        task: {
          addons: JSON.stringify(bobReservation.task.addons) || '{}',
          age: bobReservation.task.age,
          attributes: JSON.stringify(bobReservation.task.attributes) || '{}',
          date_created: bobReservation.task.dateCreated,
          date_updated: bobReservation.task.dateUpdated,
          priority: bobReservation.task.priority,
          queue_name: bobReservation.task.queueName,
          queue_sid: bobReservation.task.queueSid,
          reason: bobReservation.task.reason,
          sid: bobReservation.task.sid,
          assignment_status: bobReservation.task.status,
          task_channel_unique_name: bobReservation.task.taskChannelUniqueName,
          task_channel_sid: bobReservation.task.taskChannelSid,
          timeout: bobReservation.task.timeout,
          workflow_name: bobReservation.task.workflowName,
          workflow_sid: bobReservation.task.workflowSid,
        },
        reservation_timeout: bobReservation.reservationTimeout,
        worker_sid: bobReservation.workerSid,
        workspace_sid: bobReservation.workspaceSid,
        task_transfer: {
          date_created: bobReservation.transfer.dateCreated,
          date_updated: bobReservation.transfer.dateUpdated,
          initiating_reservation_sid: bobReservation.transfer.reservationSid,
          initiating_worker_sid: bobReservation.transfer.workerSid,
          sid: bobReservation.transfer.sid,
          transfer_mode: bobReservation.transfer.mode,
          transfer_status: 'COMPLETED',
          transfer_to: bobReservation.transfer.to,
          transfer_type: bobReservation.transfer.type,
        }
        /* eslint-enable camelcase */
      });

      assert.equal(bobReservation.transfer.status, 'COMPLETED');
      done();
    });

    bobReservation.reject();
  });
});
