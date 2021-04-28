import EnvTwilio from '../../util/EnvTwilio';
import Supervisor from '../../../lib/Supervisor';
import Worker from '../../../lib/Worker';

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.should();
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Supervisor Client', function() {
  /* eslint-disable no-invalid-this */
  this.timeout(10000);
  /* eslint-enable */

  const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
  const superToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, null, 'supervisor');
  const workerToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);

  let reservation;
  let supervisor;
  let worker;
  beforeEach(done => {
    envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
      worker = new Worker(workerToken, {
        ebServer: `${credentials.ebServer}/v1/wschannels`,
        wsServer: `${credentials.wsServer}/v1/wschannels`,
        logLevel: 'error',
        connectActivitySid: credentials.multiTaskConnectActivitySid
      });

      supervisor = new Supervisor(superToken, {
        ebServer: `${credentials.ebServer}/v1/wschannels`,
        wsServer: `${credentials.wsServer}/v1/wschannels`,
        logLevel: 'error'
      });
      const createTask = envTwilio.createTask(credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid,
                                              JSON.stringify({
                                                               to: 'client:alice',
                                                               conference: { sid: 'CF11111111111111111111111111111111' }
                                                             }));

      return envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, credentials.multiTaskConnectActivitySid)
          .then(() => Promise.all([
                          envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid,
                                                         credentials.multiTaskAliceSid,
                                                         'default', 1),
                          envTwilio.updateWorkerCapacity(credentials.multiTaskWorkspaceSid,
                                                         credentials.multiTaskBobSid, 'default',
                                                         1),
                          createTask,
                          new Promise(resolve => supervisor.on('ready', () => resolve())),
                          new Promise(resolve => worker.on('ready', () => resolve()))
                      ]))
          .then(() => {
            reservation = Array.from(worker.reservations.values())[0];
            return reservation.accept();
      });
    }).then(() => done()).catch(done);
  });

  afterEach(() => {
    supervisor.removeAllListeners();
    worker.removeAllListeners();
    return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid)
        .then(() => envTwilio.updateWorkerActivity(
            credentials.multiTaskWorkspaceSid,
            credentials.multiTaskAliceSid,
            credentials.multiTaskUpdateActivitySid
        )).then(() => envTwilio.updateWorkerActivity(
            credentials.multiTaskWorkspaceSid,
            credentials.multiTaskBobSid,
            credentials.multiTaskUpdateActivitySid
        ));
  });

  // ORCH-1786 filed for unreliabe test
  it.skip('should get a 200 and resolve the Promise if all goes well', () => {
    return supervisor.monitor(reservation.task.sid, reservation.sid);
  });
});
