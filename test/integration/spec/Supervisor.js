import EnvTwilio from '../../util/EnvTwilio';
import Supervisor from '../../../lib/Supervisor';
import Worker from '../../../lib/Worker';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';
import { twilioErrors } from '../../../lib/util/Constants';

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.should();
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Supervisor Client', function() {
  /* eslint-disable no-invalid-this */
  this.timeout(10000);
  /* eslint-enable */

  const envTwilio = new EnvTwilio(
    credentials.accountSid,
    credentials.authToken,
    credentials.region
  );
  const superToken = JWT.getAccessToken(
    credentials.accountSid,
    credentials.multiTaskWorkspaceSid,
    credentials.multiTaskAliceSid,
    null,
    'supervisor'
  );
  const workerToken = JWT.getAccessToken(
    credentials.accountSid,
    credentials.multiTaskWorkspaceSid,
    credentials.multiTaskBobSid
  );

  let reservation;
  let supervisor;
  let worker;
  beforeEach(() => {
    return envTwilio
      .deleteAllTasks(credentials.multiTaskWorkspaceSid)
      .then(() => {
        worker = new Worker(workerToken, {
          region: buildRegionForEventBridge(credentials.region),
          edge: credentials.edge,
          logLevel: 'error',
          connectActivitySid: credentials.multiTaskConnectActivitySid,
        });

        supervisor = new Supervisor(superToken, {
          region: buildRegionForEventBridge(credentials.region),
          edge: credentials.edge,
          logLevel: 'error',
        });
         return Promise.all([
          new Promise((resolve) => supervisor.on('ready', () => resolve())),
          new Promise((resolve) => worker.on('ready', () => resolve())),
        ]);
      });
  });

  afterEach(() => {
    supervisor.removeAllListeners();
    worker.removeAllListeners();
    return envTwilio
      .deleteAllTasks(credentials.multiTaskWorkspaceSid)
      .then(() =>
        envTwilio.updateWorkerActivity(
          credentials.multiTaskWorkspaceSid,
          credentials.multiTaskAliceSid,
          credentials.multiTaskUpdateActivitySid
        )
      )
      .then(() =>
        envTwilio.updateWorkerActivity(
          credentials.multiTaskWorkspaceSid,
          credentials.multiTaskBobSid,
          credentials.multiTaskUpdateActivitySid
        )
      );
  });

  // ORCH-1786 filed for unreliabe test
  it.skip('should get a 200 and resolve the Promise if all goes well', () => {
    return supervisor.monitor(reservation.task.sid, reservation.sid);
  });

  describe('#setWorkerAttributes', () => {
    it('supervisor should set worker attributes', async() => {
      const newAttributes = { languages: ['en'], name: 'Ms. Alice' };
      const response = await supervisor.setWorkerAttributes(
        worker.sid,
        newAttributes
      );
      chai.expect(JSON.parse(response.attributes)).to.deep.equal(newAttributes);
    });

    it('should return an error if workerSid is not a string', async() => {
      chai.assert.throws(
        () => supervisor.setWorkerAttributes(123, 'invalid_attribute'),
        'Error setting worker attributes: <string>workerSid is a required parameter'
      );
    });

    it('should return an error if unable to set the attributes', async() => {
      chai.assert.throws(
        () => supervisor.setWorkerAttributes(worker.sid, 'invalid_attribute'),
        'Error setting worker attributes: <object>attributes is a required parameter'
      );
    });
  });

  describe('#setWorkerActivity', () => {
    it('supervisor should set worker activity', async() => {
      const response = await supervisor.setWorkerActivity(
        worker.sid,
        credentials.multiTaskUpdateActivitySid
      );
      chai
        .expect(response.activity_sid)
        .to.equal(credentials.multiTaskUpdateActivitySid);
    });

    it('should return an error if activitySid is not a string', async() => {
      chai.assert.throws(
        () => supervisor.setWorkerActivity(worker.sid, 123),
        'Error setting worker activity: <string>activitySid is a required parameter'
      );
    });

    it('should fail with 400 if activitySid is invalid', async() => {
      return supervisor
        .setWorkerActivity(worker.sid, 'invalid_activitySid')
        .catch((err) => {
          chai.expect(err.name).to.equal(twilioErrors.REQUEST_INVALID.name);
          chai.expect(err.message).to.contain('invalid_activitySid');
        });
    });

    it('should fail with 404 if worker_sid is invalid', async() => {
      return supervisor
        .setWorkerActivity(
          'invalid_workerSid',
          credentials.multiTaskUpdateActivitySid
        )
        .catch((err) => {
          chai.expect(err.name).to.equal(twilioErrors.REQUEST_INVALID.name);
          chai.expect(err.message).to.contain(404);
        });
    });

    it('should return an error if workerSid is not a string', async() => {
      chai.assert.throws(
        () =>
          supervisor.setWorkerActivity(
            123,
            credentials.multiTaskUpdateActivitySid
          ),
        'Error setting worker activity: <string>workerSid is a required parameter'
      );
    });
  });
});
