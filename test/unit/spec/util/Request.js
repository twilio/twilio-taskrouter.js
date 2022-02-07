const sinon = require('sinon');
import Request from '../../../../lib/util/Request';
import Configuration from '../../../../lib/util/Configuration';
import { API_V1 } from '../../../../lib/util/Constants';
import { token } from '../../../mock/Token';

describe('Request', () => {
  let sandbox;
  let config;
  const requestURL = 'Workspaces/WSxxx/Workers/WKxxx';
  const requestParams = {
    attributes: {
      languages: ['en']
    }
  };

  beforeEach(() => {
    config = new Configuration(token);
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should throw an error if configuration is invalid', () => {
      (() => {
        new Request({});
      }).should.throw(/<Configuration>config is a required parameter/);
    });
  });

  describe('post', () => {
    let request;
    let requestBody;
    let stub;

    beforeEach(() => {
      request = new Request(config);

      const mockResponse = {
        data: {
          payload: 'someData'
        }
      };

      // set up the stub to check the headers and also mock the response, instead of using axios
      stub = sandbox.stub(request._postClient, 'post').resolves(Promise.resolve(mockResponse));

      // build the expected request body
      requestBody = request.buildRequest('POST', requestURL, requestParams);
    });

    it('adds default headers', () => {
      return request.post(requestURL, requestParams, API_V1).then(() => {
        sinon.assert.calledWith(stub, config.EB_SERVER, requestBody, {
          headers: {
            apiVersion: API_V1
          }
        });
      });
    });

    it('adds object version to If-Match header', () => {
      const version = '1';

      return request.post(requestURL, requestParams, API_V1, version).then(() => {
        sinon.assert.calledWith(stub, config.EB_SERVER, requestBody, {
          headers: {
            'If-Match': version,
            'apiVersion': API_V1
          }
        });
      });
    });

    it('should throw an error if required parameters are missing', () => {
      (() => {
        request.post();
      }).should.throw(/<string>url is a required parameter/);

      (() => {
        request.post('abc');
      }).should.throw(/<object>paramsJSON is a required parameter/);

      (() => {
        request.post('abc', {});
      }).should.throw(/<string>apiVersion is a required parameter/);
    });
  });

  describe('get', () => {
    let request;
    let requestBody;
    let stub;

    beforeEach(() => {
      request = new Request(config);

      const mockResponse = {
        data: {
          payload: 'someData'
        }
      };

      // set up the stub to check the headers and also mock the response, instead of using axios
      stub = sandbox.stub(request._postClient, 'post').resolves(Promise.resolve(mockResponse));

      // build the expected request body
      requestBody = request.buildRequest('GET', requestURL, requestParams);
    });

    it('add default headers', () => {
      return request.get(requestURL, API_V1, requestParams).then(() => {
        sinon.assert.calledWith(stub, config.EB_SERVER, requestBody, {
          headers: {
            apiVersion: API_V1
          }
        });
      });
    });

    it('add empty params object if no params given', () => {
      requestBody = request.buildRequest('GET', requestURL, {});
      return request.get(requestURL, API_V1).then(() => {
        sinon.assert.calledWith(stub, config.EB_SERVER, requestBody, {
          headers: {
            apiVersion: API_V1
          }
        });
      });
    });

    it('should throw an error if required parameters are missing', () => {
      (() => {
        request.get();
      }).should.throw(/<string>url is a required parameter/);

      (() => {
        request.get('abc');
      }).should.throw(/<string>apiVersion is a required parameter/);

      (() => {
        request.get('abc', 'v1', 'def');
      }).should.throw(/<object>paramsJSON is a required parameter/);
    });
  });
});
