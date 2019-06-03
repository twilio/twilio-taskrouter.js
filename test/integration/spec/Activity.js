import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Activity', () => {

    const token = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let worker;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid);
    });

    afterEach(() => {
        worker.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid).then(() => {
            return envTwilio.updateWorkerActivity(
                credentials.nonMultiTaskWorkspaceSid,
                credentials.nonMultiTaskAliceSid,
                credentials.nonMultiTaskUpdateActivitySid
            );
        });
    });

    describe('#setAsCurrent', done => {
        it('should set this connect activity on the Worker, and then update it', () => {
            worker = new Worker(token, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`,
                connectActivitySid: credentials.nonMultiTaskConnectActivitySid
            });

            let connectActivity;
            let updateActivity;
            worker.on('activityUpdated', async connectWorker => {
                assert.isNotNull(worker.activities);
                assert.equal(worker.activities.size, 4);

                    worker.activities.forEach(activity => {
                        if (activity.sid === credentials.nonMultiTaskConnectActivitySid) {
                            connectActivity = activity;
                        }
                        if (activity.sid === credentials.nonMultiTaskUpdateActivitySid) {
                            updateActivity = activity;
                        }
                    });

                    expect(worker.activity).to.deep.equal(connectWorker.activity);

                const updatedActivity = await updateActivity.setAsCurrent();
                expect(worker.activity).to.deep.equal(updateActivity);
                expect(worker.activity).to.deep.equal(updatedActivity);
                assert.isTrue(updateActivity.isCurrent);
                assert.isFalse(connectActivity.isCurrent);
                done();
            });
        }).timeout(5000);
    });
});
