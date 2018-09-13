import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

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
  let reservation;
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
        .then(() => envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, 'default', 0))
        .then(() => envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, credentials.multiTaskConnectActivitySid))
        .then(() => envTwilio.createTask(credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, JSON.stringify({
          to: 'client:alice',
          conference: { sid: 'CF11111111111111111111111111111111' }
        })));

      return Promise.all([
        new Promise(resolve => alice.on('ready', () => resolve())),
        new Promise(resolve => bob.on('ready', () => resolve())),
        createTask,
      ]).then(() => envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, 'default', 1))
        .then(() => {
          reservation = Array.from(alice.reservations.values())[0];
          return reservation.accept();
        });
      });
    });

  after(() => {
    alice.removeAllListeners();
    bob.removeAllListeners();
    return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
  });

  it('should get a 200 and resolve the Promise if all goes well', () => {
    return reservation.task.transfer(credentials.multiTaskBobSid);
  });
});
