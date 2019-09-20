import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { getAccessToken } from '../../util/MakeAccessToken';

const chai = require('chai');
const expect = chai.expect;

const credentials = require('../../env');

describe('Reservation', () => {
  const multiTaskAliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
  const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
  let worker;

  beforeEach(() => {
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

  afterEach(() => {
    worker.removeAllListeners();
    return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
      return envTwilio.updateWorkerActivity(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskAliceSid,
        credentials.multiTaskUpdateActivitySid
      );
    });
  });

  describe('#complete reservation', () => {
    it('should complete the reservation', done => {
      envTwilio.createTask(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskWorkflowSid,
        '{ "selected_language": "es" }'
      );
      worker.on('reservationCreated', reservation => {
        reservation.accept().then(() => reservation.complete()).then(updatedReservation => {
          expect(reservation.status).equal('completed');
          expect(updatedReservation.status).equal('completed');
          expect(updatedReservation.task.routingTarget).equal(null);
          done();
        }).catch(done);
      });
    }).timeout(5000);
  });

  describe('#complete outbound task reservation', () => {
    let alice;

    beforeEach(() => {
      return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
        alice = new Worker(multiTaskAliceToken, {
          connectActivitySid: credentials.multiTaskConnectActivitySid,
          ebServer: `${credentials.ebServer}/v1/wschannels`,
          wsServer: `${credentials.wsServer}/v1/wschannels`
        });
        // Make sure Bob remains offline before creating a task
        return envTwilio.updateWorkerActivity(
            credentials.multiTaskWorkspaceSid,
            credentials.multiTaskBobSid,
            credentials.multiTaskUpdateActivitySid
        );
      }).then(() => new Promise(resolve => alice.on('ready', resolve)))
          .then(() => alice.createTask('customer', 'worker', credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid));
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

    it('should complete the outbound task reservation', done => {
      alice.on('reservationCreated', reservation => {
        reservation.accept().then(() => reservation.complete()).then(updatedReservation => {
          expect(reservation.status).equal('completed');
          expect(updatedReservation.status).equal('completed');
          expect(updatedReservation.task.routingTarget).equal(alice.sid);
          done();
        }).catch(done);
      });
    }).timeout(5000);
  });

  describe('#wrap reservation', () => {
    it('should wrap the reservation', done => {
      envTwilio.createTask(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskWorkflowSid,
        '{ "selected_language": "es" }'
      );
      worker.on('reservationCreated', reservation => {
        reservation.accept().then(() => reservation.wrap()).then(updatedReservation => {
          expect(reservation.status).equal('wrapping');
          expect(updatedReservation.status).equal('wrapping');
          done();
        }).catch(done);
      });
    }).timeout(5000);
  });
});
