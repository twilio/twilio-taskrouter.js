import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

const chai = require('chai');
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');
const ACCESS_TOKEN_EXPIRATION_TIME = 15; // seconds
const TOKEN_EXPIRATION_BUFFER_TIME = 5; // seconds
const TEST_TIMEOUT = 15000; // milliseconds

describe('EventBridgeSignaling', () => {
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
    let alice;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            const token = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, ACCESS_TOKEN_EXPIRATION_TIME);
            alice = new Worker(token, {
                closeExistingSessions: true,
                region: buildRegionForEventBridge(credentials.region),
                logLevel: 'error',
            });
        });
    });

    afterEach(() => {
        alice.removeAllListeners();
    });

    describe('Worker on token expiration', () => {
        it('should not reconnect', done => {
            alice.on('tokenExpired', () => {
                assert.isFalse(alice._signaling.reconnect,
                    envTwilio.getErrorMessage('Connect mismatch on expired token', credentials.accountSid, credentials.multiTaskAliceSid));

                done();
            });
        }).timeout(TEST_TIMEOUT);
    });

    describe('Worker on token update after expiration and disconnect', () => {
        it('@SixSigma - should create a new websocket connection', done => {
            let readyCount = 0;

            alice.on('tokenExpired', () => {
                assert.isFalse(alice._signaling.reconnect,
                    envTwilio.getErrorMessage('Connect mismatch on expired token', credentials.accountSid, credentials.multiTaskAliceSid));

                alice.disconnect(); // simulate a disconnect event after token expiration
            });

            alice.on('disconnected', event => {
                assert.equal(event.message, 'SDK Disconnect',
                    envTwilio.getErrorMessage('Connect mismatch on SDK disconnect', credentials.accountSid, credentials.multiTaskAliceSid));

                // update token after disconnecting
                const newToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, ACCESS_TOKEN_EXPIRATION_TIME + 5);
                alice.updateToken(newToken);
                assert.isTrue(alice._signaling.reconnect,
                    envTwilio.getErrorMessage('Connect mismatch on updated token', credentials.accountSid, credentials.multiTaskAliceSid));

            });

            alice.on('ready', () => {
                readyCount++;
                if (readyCount === 2) {
                    assert.isTrue(alice._signaling.reconnect,
                        envTwilio.getErrorMessage('Connect mismatch after ready', credentials.accountSid, credentials.multiTaskAliceSid));

                    done();     // updating token after disconnecting should have brought us here to a new ready state
                }
            });
        }).timeout(TEST_TIMEOUT);
    });

    describe('Worker on token update', () => {
        it('should not fire a token expiration event on the old token', done => {

            alice.on('tokenExpired', () => {
                done(new Error('Token should not have expired after updateToken().'));
            });

            alice.on('ready', () => {
                const newTimeout = ACCESS_TOKEN_EXPIRATION_TIME + 5;
                const newToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, newTimeout);
                alice._signaling.tokenLifetime = newTimeout * 1000;
                alice.updateToken(newToken);

                // Signaling emits tokenExpired before actual JWT expiry by TOKEN_EXPIRATION_BUFFER_TIME.
                // Wait just past the old token's pre-expiry point, but before the new token's pre-expiry point.
                const waitForOldTokenExpirationEvent =
                    (ACCESS_TOKEN_EXPIRATION_TIME - TOKEN_EXPIRATION_BUFFER_TIME + 1) * 1000;

                return new Promise(resolve => setTimeout(resolve, waitForOldTokenExpirationEvent)).then(done).catch(done);
            });
        }).timeout(((ACCESS_TOKEN_EXPIRATION_TIME + 5) * 1000 ) + TEST_TIMEOUT);
    });

    it('should trigger tokenUpdated event on token update', done => {
        alice.on('tokenUpdated', () => {
            done();
        });

        alice.on('ready', () => {
            const newTimeout = ACCESS_TOKEN_EXPIRATION_TIME + 5;
            const newToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, newTimeout);
            alice._signaling.tokenLifetime = newTimeout * 1000;
            alice.updateToken(newToken);
        });
    }).timeout(TEST_TIMEOUT);
});
