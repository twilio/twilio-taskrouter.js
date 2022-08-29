import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

const chai = require('chai');
const assert = chai.assert;

const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('EventBridgeSignaling', () => {
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);
    let alice;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            const token = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, 8);
            alice = new Worker(token, {
                closeExistingSessions: true,
                region: credentials.region,
                edge: credentials.edge,
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
        }).timeout(10000);
    });

    describe('Worker on token update after expiration and disconnect', () => {
        it('should create a new websocket connection', done => {
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
                const newToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, 20);
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
        }).timeout(15000);
    });

    describe('Worker on token update', () => {
        it('should not fire a token expiration event on the old token', done => {

            alice.on('tokenExpired', () => {
                done(new Error('Token should not have expired after updateToken().'));
            });

            alice.on('ready', () => {
                const newTimeout = 20;
                const newToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, newTimeout);
                alice._signaling.tokenLifetime = newTimeout * 1000;
                alice.updateToken(newToken);

                // wait for 8 seconds to see if the first token expired (if so, test fails with error)
                return new Promise(resolve => setTimeout(resolve, 8000)).then(done).catch(done);
            });
        }).timeout(10000);
    });
});
