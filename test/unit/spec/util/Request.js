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
    const mockResponse = new Response(JSON.stringify({ payload: 'someData' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    stub.resolves(mockResponse);
  };

  const setUpErrorResponse = (stub, status, data) => {
    const mockResponse = new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
    stub.resolves(mockResponse);
  };

  const setUpNetworkError = (stub, error) => {
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
      stub = sandbox.stub(global, 'fetch');
      requestBody = request.buildRequest('POST', requestURL, requestParams);
    });

    it('adds default headers', () => {
      setUpSuccessfulResponse(stub);
      return request.post(requestURL, requestParams, API_V1).then(() => {
        sinon.assert.calledOnce(stub);
        const [url, options] = stub.firstCall.args;
        url.should.equal(config.EB_SERVER);
        options.body.should.equal(requestBody);
        options.headers.apiVersion.should.equal(API_V1);
      });
    });

    it('adds object version to If-Match header', () => {
      const configWithVersionCheck = new Configuration(token, {
        enableVersionCheck: true
      });

      const requestWithVersionCheck = new Request(configWithVersionCheck);
      const requestWithVersionCheckBody = requestWithVersionCheck.buildRequest('POST', requestURL, requestParams);

      setUpSuccessfulResponse(stub);
      const version = '1';

      return requestWithVersionCheck.post(requestURL, requestParams, API_V1, version).then(() => {
        sinon.assert.calledOnce(stub);
        const [url, options] = stub.firstCall.args;
        url.should.equal(config.EB_SERVER);
        options.body.should.equal(requestWithVersionCheckBody);
        options.headers['If-Match'].should.equal(version);
        options.headers.apiVersion.should.equal(API_V1);
      });
    });

    it('object version is not added to If-Match header by default', () => {
      setUpSuccessfulResponse(stub);
      const version = '1';

      return request.post(requestURL, requestParams, API_V1, version).then(() => {
        sinon.assert.calledOnce(stub);
        const [, options] = stub.firstCall.args;
        (options.headers['If-Match'] === undefined).should.be.true;
        options.headers.apiVersion.should.equal(API_V1);
      });
    });

    it('should throw request invalid error', async() => {
      setUpErrorResponse(stub, 400, { message: 'Invalid request' });
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Request failed with status code 400. Invalid request');
      }
    });

    it('should throw server error', async() => {
      setUpErrorResponse(stub, 500, { message: 'Unexpected server error' });
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Server responded with status code 500. Unexpected server error');
      }
    });

    it('should throw network error for TypeError', async() => {
      const error = new TypeError('fetch failed');
      setUpNetworkError(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Network error has occurred. fetch failed');
      }
    });

    it('should throw timeout error for AbortError', async() => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      setUpNetworkError(stub, error);
      const version = '1';

      try {
        await request.post(requestURL, requestParams, API_V1, version);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.name.should.equal('REQUEST_TIMEOUT_ERROR');
        thrownError.message.should.equal('Request timed out. The operation was aborted');
      }
    });

    it('should throw unknown error', async() => {
      const error = new Error('Something unexpected happened!');
      setUpNetworkError(stub, error);
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
      stub = sandbox.stub(global, 'fetch');
      requestBody = request.buildRequest('GET', requestURL, requestParams);
    });

    it('add default headers', () => {
      setUpSuccessfulResponse(stub);
      return request.get(requestURL, API_V1, requestParams).then(() => {
        sinon.assert.calledOnce(stub);
        const [url, options] = stub.firstCall.args;
        url.should.equal(config.EB_SERVER);
        options.body.should.equal(requestBody);
        options.headers.apiVersion.should.equal(API_V1);
      });
    });

    it('add empty params object if no params given', () => {
      setUpSuccessfulResponse(stub);
      requestBody = request.buildRequest('GET', requestURL, {});
      return request.get(requestURL, API_V1).then(() => {
        sinon.assert.calledOnce(stub);
        const [url, options] = stub.firstCall.args;
        url.should.equal(config.EB_SERVER);
        options.body.should.equal(requestBody);
        options.headers.apiVersion.should.equal(API_V1);
      });
    });

    it('should throw request invalid error', async() => {
      setUpErrorResponse(stub, 400, { message: 'Invalid request' });

      try {
        await request.get(requestURL, API_V1, requestParams);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Request failed with status code 400. Invalid request');
      }
    });

    it('should throw server error', async() => {
      setUpErrorResponse(stub, 500, { message: 'Unexpected server error' });

      try {
        await request.get(requestURL, API_V1, requestParams);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Server responded with status code 500. Unexpected server error');
      }
    });

    it('should throw network error for TypeError', async() => {
      const error = new TypeError('fetch failed');
      setUpNetworkError(stub, error);

      try {
        await request.get(requestURL, API_V1, requestParams);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.message.should.equal('Network error has occurred. fetch failed');
      }
    });

    it('should throw timeout error for AbortError', async() => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      setUpNetworkError(stub, error);

      try {
        await request.get(requestURL, API_V1, requestParams);
        throw new Error('Expected an error to be thrown');
      } catch (thrownError) {
        thrownError.name.should.equal('REQUEST_TIMEOUT_ERROR');
        thrownError.message.should.equal('Request timed out. The operation was aborted');
      }
    });

    it('should throw unknown error', async() => {
      const error = new Error('Something unexpected happened!');
      setUpNetworkError(stub, error);

      try {
        await request.get(requestURL, API_V1, requestParams);
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
