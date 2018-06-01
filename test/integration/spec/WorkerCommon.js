import Configuration from '../../../lib/util/Configuration';
import EnvTwilio from '../../util/EnvTwilio';
import Worker from '../../../lib/Worker';

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.should();
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Common Worker Client', () => {
    const aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);
    const bobToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

    let alice;
    before(() => {
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid).then(() => {
            alice = new Worker(aliceToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`,
                logLevel: 'error'
            });
        });
    });

    after(() => {
        alice.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.nonMultiTaskWorkspaceSid);
    });

    describe('constructor', () => {
        it('should create an instance of Client', () => {
            assert.instanceOf(alice, Worker);
        });

        it('should set correct log level', () => {
            assert.equal(alice._log.getLevel(), 'error');
        });

        it('should create an instance of Configuration', () => {
            assert.instanceOf(alice._config, Configuration);
        });
    });

    describe('#setAttributes(newAttributes)', () => {
        it('should set the attributes of the worker', () => {
            const newAttributes = { languages: ['en'], name: 'Ms. Alice' };

            return new Promise(resolve => {
                alice.on('ready', resolve);
            }).then(() => {
                return alice.setAttributes(newAttributes).then(updatedAlice => {
                    expect(alice).to.equal(updatedAlice);
                    expect(alice.attributes).to.deep.equal(newAttributes);
                });
            });
        }).timeout(5000);

        it('should return an error if unable to set the attributes', () => {
            (() => {
                alice.setAttributes('foo');
            }).should.throw(/attributes is a required parameter/);
        });
    });

    describe('#updateToken(newToken)', () => {
        it('should update the token on the Signaling instance', () => {
            const spy = sinon.spy();
            alice.on('tokenUpdated', spy);

            let updateAliceToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);
            alice.updateToken(updateAliceToken);
            assert.equal(alice._config.token, updateAliceToken);
            assert.isTrue(spy.calledOnce);
        }).timeout(5000);
    });

    describe('Two Worker clients in the same browser', () => {
        it('should not allow log levels across unique workers to be affected', () => {
            const bob = new Worker(bobToken, {
                ebServer: `${credentials.ebServer}/v1/wschannels`,
                wsServer: `${credentials.wsServer}/v1/wschannels`,
                logLevel: 'info'
            });

            assert.equal(alice._config._logLevel, 'error');
            assert.equal(bob._config._logLevel, 'info');

            assert.equal(alice._log.getLevel(), 'error');
            assert.equal(bob._log.getLevel(), 'info');
        });
    });
});
