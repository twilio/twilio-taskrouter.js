import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';
import Request from '../../../lib/util/Request';
import { API_V1 } from '../../../lib/util/Constants';
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.should();
const sinon = require('sinon');
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

// This is an integration test to test the retry logic with backoff for worker connectivity
describe('Worker Retry', () => {

    describe('For status codes with retries 0, 429, 500, 502, 503, 504', ()=> {
        const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
        const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);

        let alice;
        let sandbox;
        let message;

        beforeEach(() => {
            const requestURL = `Workspaces/${credentials.multiTaskWorkspaceSid}/Workers/${credentials.multiTaskAliceSid}`;
            const requestParams = { ActivitySid: credentials.multiTaskConnectActivitySid };

            sandbox = sinon.sandbox.create();
            const failedResponse = { response: { status: 429, statusText: 'failed on purpose' } } ;
            const requestStub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, sinon.match.any);
            // mocking the activity update request and making it fail, so retires are executed
            requestStub.rejects(failedResponse);
            message = /Retrying Update Worker Activity after backoff time: (\d+)ms for retryCount: (\d+)/;

        });

        afterEach(() => {
            alice.removeAllListeners();
            sandbox.restore();
            return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
        });

        it('should retry upto 3 times while updating worker activity', async() => {
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
                logLevel: 'info'
            });

            const infoLoggerSpy = sandbox.spy(alice._log, 'info');
            let totalDelayForRetries = 0;

            // waiting here, as the logs takes time as reties happen after each delay
            await new Promise((r)=> setTimeout(r, 10000));

            // checking _connectRetry was increased
            chai.expect(alice._connectRetry).to.equal(3);

            const matches = infoLoggerSpy.args.filter(args => message.test(args[0]));

            // checking only 3 retry messages were logged
            chai.expect(matches.length).to.equal(3);

            // assertions for first retry
            let [, actualTime, actualRetryCount] = matches[0][0].match(message);
            totalDelayForRetries += Number(actualTime);
            chai.expect(Number(actualRetryCount)).to.equal(1);
            chai.expect(Number(actualTime)).to.be.within(800, 900);

            // assertions for second retry
            [, actualTime, actualRetryCount] = matches[1][0].match(message);
            totalDelayForRetries += Number(actualTime);
            chai.expect(Number(actualRetryCount)).to.equal(2);
            chai.expect(Number(actualTime)).to.be.within(1200, 1300);

            // assertions for third retry
            [, actualTime, actualRetryCount] = matches[2][0].match(message);
            totalDelayForRetries += Number(actualTime);
            chai.expect(Number(actualRetryCount)).to.equal(3);
            chai.expect(Number(actualTime)).to.be.within(2800, 2900);

            // checking total delay that happened for all 3 reties
            chai.expect(totalDelayForRetries).to.be.within(4800, 5100);

        }).timeout(15000);

        it('connectRetry should get reset when new instance is created', async() => {
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
                logLevel: 'info'
            });

            // waiting here, as the logs takes time as reties happen after each delay
            await new Promise((r)=> setTimeout(r, 10000));

            // checking _connectRetry was increased
            chai.expect(alice._connectRetry).to.equal(3);

            // creating new instance
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
                logLevel: 'info'
            });

            // checking _connectRetry has reset
            // eslint-disable-next-line no-undefined
            chai.expect(alice._connectRetry).to.equal(undefined);

        }).timeout(15000);

    });

    describe('For non-retry status codes', ()=> {
        const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
        const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);

        let alice;
        let sandbox;
        let message;
        let failedResponse;
        beforeEach(() => {
            const requestURL = `Workspaces/${credentials.multiTaskWorkspaceSid}/Workers/${credentials.multiTaskAliceSid}`;
            const requestParams = { ActivitySid: credentials.multiTaskConnectActivitySid };

            sandbox = sinon.sandbox.create();
            failedResponse = { response: { status: 400, statusText: 'failed on purpose' } } ;
            const requestStub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, sinon.match.any);
            // mocking the activity update request and making it fail, so retires are executed
            requestStub.rejects(failedResponse);
            message = /Retrying Update Worker Activity after backoff time: (\d+)ms for retryCount: (\d+)/;

        });

        afterEach(() => {
            alice.removeAllListeners();
            sandbox.restore();
            return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);
        });

        it('should not retry while updating worker activity', async() => {
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge,
                logLevel: 'info'
            });

            const infoLoggerSpy = sandbox.spy(alice._log, 'info');
            // waiting here, as the logs takes time as reties happen after each delay
            await new Promise((r)=> setTimeout(r, 10000));
            const matches = infoLoggerSpy.args.filter(args => message.test(args[0]));

            // eslint-disable-next-line no-undefined
            chai.expect(alice._connectRetry).to.equal(undefined);
            // checking no retry messages were logged
            chai.expect(matches.length).to.equal(0);

        });

    });

});
