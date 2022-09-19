import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Activity', () => {

    const token = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let worker;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
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

    describe('#setAsCurrent', done => {
        it('@SixSigma - should set this connect activity on the Worker, and then update it', () => {
            worker = new Worker(token, {
                region: credentials.region,
                edge: credentials.edge,
                connectActivitySid: credentials.multiTaskConnectActivitySid
            });

            let connectActivity;
            let updateActivity;
            worker.on('activityUpdated', async connectWorker => {
                assert.isNotNull(worker.activities,
                    envTwilio.getErrorMessage('Worker activities list is null', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.equal(worker.activities.size, 4,
                    envTwilio.getErrorMessage('Worker activities count mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                    worker.activities.forEach(activity => {
                        if (activity.sid === credentials.multiTaskConnectActivitySid) {
                            connectActivity = activity;
                        }
                        if (activity.sid === credentials.multiTaskUpdateActivitySid) {
                            updateActivity = activity;
                        }
                    });

                    expect(worker.activity).to.deep.equal(connectWorker.activity);

                const updatedActivity = await updateActivity.setAsCurrent();
                expect(worker.activity).to.deep.equal(updateActivity);
                expect(worker.activity).to.deep.equal(updatedActivity);
                assert.isTrue(updateActivity.isCurrent,
                    envTwilio.getErrorMessage('Worker update activity state mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                assert.isFalse(connectActivity.isCurrent,
                    envTwilio.getErrorMessage('Worker connect activity state mismatch', credentials.accountSid, credentials.multiTaskConnectActivitySid));

                done();
            });
        }).timeout(5000);
    });
});
