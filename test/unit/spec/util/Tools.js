const tools = require('../../../../lib/util/Tools');
import _ from 'lodash';

describe('Tools', () => {
  describe('#validateOptions', () => {
    it('should throw an error if invalid type is provided', () => {
      (() => {
        tools.validateOptions(
          { foo: new Date() },
          { foo: (val) => _.isString(val) }
        );
      }).should.throw(/does not meet the required type/);
    });
  });
});
