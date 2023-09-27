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

  const setUpSuccessfulResponse = (stub) => {
    const mockResponse = {
      data: {
        payload: 'someData'
      }
    };
    stub.resolves(Promise.resolve(mockResponse));
  };

  const setUpErrorResponse = (stub, error) => {
    stub.rejects(error);
  };

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

      // set up the stub to check the headers and also mock the response, instead of using axios
      stub = sandbox.stub(request._postClient, 'post');

      // build the expected request body
      requestBody = request.buildRequest('POST', requestURL, requestParams);
    });

    it('adds default headers', () => {
      setUpSuccessfulResponse(stub);
      return request.post(requestURL, requestParams, API_V1).then(() => {
        sinon.assert.calledWith(stub, config.EB_SERVER, requestBody, {
          headers: {
            apiVersion: API_V1
          }
        });
      });
    });

    // eslint-disable-next-line no-warning-comments
    // TODO FLEXSDK-2255: unskip this test once the versioning bug is fixed
    it.skip('adds object version to If-Match header', () => {
      setUpSuccessfulResponse(stub);
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

    it('should throw request invalid error', async() => {
      const error = new Error();
      error.response = {
        status: 400,
        data: {
          message: 'Invalid request'
        },
      };

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Request failed with status code 400. Invalid request');
      }
    });

    it('should throw server error', async() => {
      const error = new Error();
      error.response = {
        status: 500,
        data:
          {
            message: 'Unexpected server error'
          }
      };

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Server responded with status code 500. Unexpected server error');
      }
    });

    it('should throw network error', async() => {
      const error = new Error('Timeout');
      error.request = true;

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Network error has occurred. Timeout');
      }
    });

    it('should throw unknown error', async() => {
      const error = new Error('Something unexpected happened!');

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Error: Something unexpected happened!');
      }
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

      // set up the stub to check the headers and also mock the response, instead of using axios
      stub = sandbox.stub(request._postClient, 'post');

      // build the expected request body
      requestBody = request.buildRequest('GET', requestURL, requestParams);
    });

    it('add default headers', () => {
      setUpSuccessfulResponse(stub);
      return request.get(requestURL, API_V1, requestParams).then(() => {
        sinon.assert.calledWith(stub, config.EB_SERVER, requestBody, {
          headers: {
            apiVersion: API_V1
          }
        });
      });
    });

    it('add empty params object if no params given', () => {
      setUpSuccessfulResponse(stub);
      requestBody = request.buildRequest('GET', requestURL, {});
      return request.get(requestURL, API_V1).then(() => {
        sinon.assert.calledWith(stub, config.EB_SERVER, requestBody, {
          headers: {
            apiVersion: API_V1
          }
        });
      });
    });

    it('should throw request invalid error', async() => {
      const error = new Error();
      error.response = {
        status: 400,
        data:
          {
            message: 'Invalid request'
          }
      };

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Request failed with status code 400. Invalid request');
      }
    });

    it('should throw server error', async() => {
      const error = new Error();
      error.response = {
        status: 500,
        data:
          {
            message: 'Unexpected server error'
          }
      };

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Server responded with status code 500. Unexpected server error');
      }
    });

    it('should throw network error', async() => {
      const error = new Error('Timeout');
      error.request = true;

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Network error has occurred. Timeout');
      }
    });

    it('should throw unknown error', async() => {
      const error = new Error('Something unexpected happened!');

      setUpErrorResponse(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Error: Something unexpected happened!');
      }
    });

    it('should throw an error if required parameters are missing', () => {
      setUpSuccessfulResponse(stub);
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

