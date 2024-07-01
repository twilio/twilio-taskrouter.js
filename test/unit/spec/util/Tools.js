const tools = require('../../../../lib/util/Tools');
import isString from 'lodash/isString';
import chai from 'chai';
const expect = chai.expect;

describe('Tools', () => {
  describe('#validateOptions', () => {
    it('should throw an error if invalid type is provided', () => {
      (() => {
        tools.validateOptions(
          { foo: new Date() },
          { foo: (val) => isString(val) }
        );
      }).should.throw(/does not meet the required type/);
    });
  });

  describe('getStatusCodeFromError', () => {
     ['err string', {}, { response: {} }, []].forEach(err => {
       it(`should return undefined if error is ${JSON.stringify(err)}`, ()=> {
         // eslint-disable-next-line no-undefined
         expect(tools.getStatusCodeFromError(err)).to.equal(undefined);
       });
     });

     it('should return status code when error contains status code in error.response', ()=> {
       const err = {
         response: {
           status: 429
         }
       };
       expect(tools.getStatusCodeFromError(err)).to.equal(429);
     });
  });
});
