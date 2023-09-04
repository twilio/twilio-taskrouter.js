import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.should();
const assert = chai.assert;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Worker Presence Client', () => {
    const bobToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);

    describe('should disconnect', () => {
        let bob;
        before(() => {
            bob = new Worker(bobToken, {
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
                logLevel: 'info',
                connectActivitySid: credentials.multiTaskConnectActivitySid
            });
        });

        after(() => {
            bob.removeAllListeners();
        });

        it('disconnect should turn a worker offline', () => {
            return envTwilio.fetchWorkspace(credentials.multiTaskWorkspaceSid).then(workspace => {
                return new Promise(resolve => {
                    // only a valid test for flex workspaces
                    if (workspace.friendlyName !== 'Flex Task Assignment') {
                        console.log('Not a Flex account, Skipping Test');
                        resolve();
                    }
                    bob.on('ready', async() => {
                        const worker = await envTwilio.fetchWorker(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);
                        console.log('current worker activity: ', worker.activityName);
                        bob.disconnect();
                    });

                    bob.on('disconnected', async() => {
                        // wait for disconnect to trigger offline event
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const updatedWorker = await envTwilio.fetchWorker(credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);
                        console.log('worker activity after disconnect: ', updatedWorker.activityName);
                        assert.equal(updatedWorker.activityName, 'Offline');
                        resolve();
                    });

                });
            });
        });
    });
});
