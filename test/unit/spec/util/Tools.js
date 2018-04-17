import { badToken } from '../../../mock/Token';

const tools = require('../../../../lib/util/Tools');

describe('Tools', () => {
  describe('#verifyJWT(token)', () => {
    it('should throw an error if token parameter is missing', () => {
      (() => {
        tools.verifyJWT();
      }).should.throw(/token is a required parameter/);
    });

    it('should throw an error if unable to objectize the JWT', () => {
      (() => {
        tools.verifyJWT('abc');
      }).should.throw(/Twilio access token malformed/);
    });

    it('should throw an error if missing role field', () => {
      (() => {
        tools.verifyJWT(badToken);
      }).should.throw(/Twilio access token missing required 'role' parameter/);
    });
  });
});
