import { token, updatedToken } from '../../../mock/Token';

const chai = require('chai');
const assert = chai.assert;
import Configuration from '../../../../lib/util/Configuration';

describe('Configuration', () => {
  describe('constructor', () => {

    it('should throw an error if the token is missing', () => {
      (() => {
        new Configuration();
      }).should.throw(/Failed to initialize Configuration/);
    });

    it('should throw an error if the token is malformed', () => {
      (() => {
        new Configuration('abc');
      }).should.throw(/Twilio access token malformed/);
    });

    it('should set environment option if passed in', () => {
      const options = {
        ebServer: 'https://event-bridge.dev-us1.twilio.com/v1/wschannels',
        wsServer: 'wss://event-bridge.dev-us1.twilio.com/v1/wschannels'
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.dev-us1.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.dev-us1.twilio.com/v1/wschannels');
    });

    it('should use environment default if options not provided', () => {
      const config = new Configuration(token);

      assert.equal(config.EB_SERVER, 'https://event-bridge.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.twilio.com/v1/wschannels');
    });
  });

  describe('#updateToken', () => {
    it('should throw an error if the token is missing', () => {
      (() => {
        const config = new Configuration(token);
        config.updateToken();
      }).should.throw(/a new Twilio token must be passed in/);
    });

    it('should throw an error if the token is malformed', () => {
      (() => {
        const config = new Configuration(token);
        config.updateToken('abc');
      }).should.throw(/Twilio access token malformed/);
    });

    it('should update the token value', () => {
      const config = new Configuration(token);

      assert.equal(config.token, token);

      config.updateToken(updatedToken);
      assert.equal(config.token, updatedToken);
    });
  });
});
