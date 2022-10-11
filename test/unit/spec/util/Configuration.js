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

    it('should set environment option if passed in', () => {
      const options = {
        logLevel: 'error'
      };

      const config = new Configuration(token, options);

      assert.equal(config._logLevel, 'error');
    });

    it('region should append to ebServer and wsServer', () => {
        const options = {
          region: 'stage-us1'
        };

        const config = new Configuration(token, options);

        assert.equal(config.EB_SERVER, 'https://event-bridge.stage-us1.twilio.com/v1/wschannels');
        assert.equal(config.WS_SERVER, 'wss://event-bridge.stage-us1.twilio.com/v1/wschannels');
    });

    it('should use environment default if options not provided', () => {
      const config = new Configuration(token);

      assert.equal(config.EB_SERVER, 'https://event-bridge.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.twilio.com/v1/wschannels');
    });

    it('region should not append to ebServer and wsServer if provided falsy', () => {
      const options = {
        region: undefined
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.twilio.com/v1/wschannels');
    });

    it('edge should append to ebServer and wsServer', () => {
      const options = {
        edge: 'sydney'
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.sydney.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.sydney.twilio.com/v1/wschannels');
    });

    it('edge should not append to ebServer and wsServer if provided falsy', () => {
      const options = {
        edge: undefined
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.twilio.com/v1/wschannels');
    });

    it('region and edge should append to ebServer and wsServer', () => {
      const options = {
        region: 'stage-us1',
        edge: 'sydney'
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.sydney.stage-us1.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.sydney.stage-us1.twilio.com/v1/wschannels');
    });

    it('region and edge should not append to ebServer and wsServer if provided falsy', () => {
      const options = {
        region: undefined,
        edge: undefined
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.twilio.com/v1/wschannels');
    });

    it('ebServer and wsServer values should be used if provided', () => {
      const options = {
        ebServer: 'https://event-bridge.dev-us1.twilio.com/v1/wschannels',
        wsServer: 'wss://event-bridge.dev-us1.twilio.com/v1/wschannels'
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.dev-us1.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.dev-us1.twilio.com/v1/wschannels');
    });

    it('region and edge should not be used if ebServer and wsServer values are provided', () => {
      const options = {
        ebServer: 'https://event-bridge.dev-us1.twilio.com/v1/wschannels',
        wsServer: 'wss://event-bridge.dev-us1.twilio.com/v1/wschannels',
        region: 'stage-us1',
        edge: 'sydney'
      };

      const config = new Configuration(token, options);

      assert.equal(config.EB_SERVER, 'https://event-bridge.dev-us1.twilio.com/v1/wschannels');
      assert.equal(config.WS_SERVER, 'wss://event-bridge.dev-us1.twilio.com/v1/wschannels');
    });
  });

  describe('#updateToken', () => {
    it('should throw an error if the token is missing', () => {
      (() => {
        const config = new Configuration(token);
        config.updateToken();
      }).should.throw(/a new Twilio token must be passed in/);
    });

    it('should update the token value', () => {
      const config = new Configuration(token);

      assert.equal(config.token, token);

      config.updateToken(updatedToken);
      assert.equal(config.token, updatedToken);
    });
  });
});
