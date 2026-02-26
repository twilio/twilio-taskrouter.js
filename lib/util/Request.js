import isObject from 'lodash/isObject';
import Configuration from './Configuration';
import Logger from './Logger';
import { DEFAULT_HTTP_TIMEOUT, twilioErrors as Errors } from './Constants';

const httpMethods = {
    GET: 'GET',
    POST: 'POST'
};
Object.freeze(httpMethods);

import * as packageJson from '../../package.json';
const CLIENT_VERSION = packageJson.version;

/**
 * Construct a custom {@link Request}
 * @param {Object} config
 */
export default class Request {
    /**
     * @param {Object} config
     */
    constructor(config) {
        if (!(config instanceof Configuration)) {
            throw new TypeError('Failed to initialize Request. <Configuration>config is a required parameter.');
        }

        /**
         * @type {Configuration}
         * @private
         */
        this._config = config;

        this._log = new Logger(`Request-${this._config.getLogIdentifier()}`, this._config._logLevel);
    }

    /**
     * @private
     * @param {string} url
     * @param {string} body
     * @param {Object} headers
     * @return {Promise}
     */
    _post(url, body, headers) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_HTTP_TIMEOUT);

        return fetch(url, {
            method: 'POST',
            headers: { clientVersion: CLIENT_VERSION, ...headers },
            body,
            signal: controller.signal
        }).then(async(response) => {
            clearTimeout(timeoutId);
            const data = await response.json();
            if (!response.ok) {
                const error = new Error();
                error.response = { status: response.status, data };
                throw error;
            }
            return data;
        }).catch((error) => {
            clearTimeout(timeoutId);
            throw error;
        });
    }


    /**
     * @public
     * @param {string} url
     * @param {Object} paramsJSON
     * @param {string} apiVersion
     * @param {string} objectVersion
     * @return {Promise}
     */
    post(url, paramsJSON, apiVersion, objectVersion) {
        if (!url) {
            throw new Error('Failed to make POST request. <string>url is a required parameter.');
        }

        if (!isObject(paramsJSON)) {
            throw new Error('Failed to make POST request. <object>paramsJSON is a required parameter.');
        }

        if (!apiVersion) {
            throw new Error('Failed to make POST request. <string>apiVersion is a required parameter.');
        }

        const request = this.buildRequest(httpMethods.POST, url, paramsJSON);
        let headers = { 'apiVersion': apiVersion };

        if (this._config.enableVersionCheck && objectVersion) {
            headers = Object.assign(headers, { 'If-Match': objectVersion });
        }

        return this._post(this._config.EB_SERVER, request, headers).then(data => {
            return data.payload;
        }).catch((error) => {
          this.handleError(error);
        });
    }

    /**
     * @public
     * @param {string} url
     * @param {string} apiVersion
     * @param {Object} paramsJSON
     * @return {Promise}
     */
    get(url, apiVersion, paramsJSON) {
        if (!url) {
            throw new Error('Failed to make GET request. <string>url is a required parameter.');
        }

        if (!apiVersion) {
            throw new Error('Failed to make GET request. <string>apiVersion is a required parameter.');
        }

        paramsJSON = paramsJSON || {};
        if (!isObject(paramsJSON)) {
            throw new Error('Failed to make GET request. <object>paramsJSON is a required parameter.');
        }

        const request = this.buildRequest(httpMethods.GET, url, paramsJSON);
        return this._post(this._config.EB_SERVER, request, {
            'apiVersion': apiVersion
        }).then(data => {
            return data.payload;
        }).catch((error) => {
          this.handleError(error);
        });
    }

    /**
     * @private
     * @param {keyof httpMethods} method
     * @param {string} url
     * @param {Object} paramsJSON
     * @return {string}
     */
    buildRequest(method, url, paramsJSON) {
        return JSON.stringify({
            url: url,
            method: method,
            params: paramsJSON,
            token: this._config.token
        });
    }

    /**
     * @private
     * @param {Error} error
     * @return {void}
     */
    handleError(error) {
      if (error.response) {
        // Server responded with an error status code (e.g. 4xx or 5xx)
        if (error.response.status < 500) {
          this._log.error('Request failed with ', error.response.status, error.response.data.message);
          throw Errors.REQUEST_INVALID.clone(`Request failed with status code ${error.response.status}. ${error.response.data.message}`);
        }
        this._log.error('Server Error:', error.response.status, error.response.data.message);
        throw Errors.SERVER_ERROR.clone(`Server responded with status code ${error.response.status}. ${error.response.data.message}`);
      } else if (error.name === 'AbortError') {
        this._log.error('Timeout Error:', error.message);
        throw Errors.REQUEST_TIMEOUT_ERROR.clone(`Request timed out. ${error.message}`);
      } else if (error.name === 'TypeError') {
        this._log.error('Network Error:', error.message);
        throw Errors.NETWORK_ERROR.clone(`Network error has occurred. ${error.message}`);
      } else {
        this._log.error('Error:', error.message);
        throw Errors.UNKNOWN_ERROR.clone(`Error: ${error.message}`);
      }
  }
}
