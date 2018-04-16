import { describe, it } from 'mocha';

const chai = require('chai');
const assert = chai.assert;

const TwilioError = require('../../../../lib/util/TwilioError');

describe('TwilioError', () => {
  describe('Constructor', () => {
    it('should set the name and message of the error', () => {

      const error = new TwilioError({ name: 'INVALID_REQUEST', message: 'The request is invalid.' });
      assert.equal(error.name, 'INVALID_REQUEST');
      assert.equal(error.message, 'The request is invalid.');

    });

    it('should set the message to be the custom message if provided', () => {
      const customMessage = 'The request is malformed.';

      const error = new TwilioError({ name: 'INVALID_REQUEST', message: 'The request is invalid.' }, customMessage);
      assert.equal(error.name, 'INVALID_REQUEST');
      assert.equal(error.message, customMessage);
    });
  });

  describe('#clone(customMessage)', () => {
    it('should create a new TwilioError with the same data, but overrides with a custom message', () => {
      const customMessage = 'The request is malformed.';
      const genericError = new TwilioError({ name: 'INVALID_REQUEST', message: 'The request is invalid.' });
      const customizedError = genericError.clone(customMessage);

      assert.equal(customizedError.name, genericError.name);
      assert.notEqual(customizedError.message, genericError.message);
      assert.equal(customizedError.message, customMessage);
    });
  });
});
