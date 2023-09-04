import _ from 'lodash';
import * as axios from 'axios';
import * as https from 'https';
import Configuration from './Configuration';
import { DEFAULT_HTTP_TIMEOUT } from './Constants';

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

        // Pinning version to TLS 1.2 to fix internal ssl errors that occurs with TLS 1.3
        const httpsAgent = new https.Agent({
            maxVersion: 'TLSv1.2',
            minVersion: 'TLSv1.2'
        });

        /**
         * @type {Configuration}
         * @private
         */
        this._config = config;
        /**
         * @private
         * @type {axios}
         */
        this._postClient = axios.create({
            method: httpMethods.POST,
            timeout: DEFAULT_HTTP_TIMEOUT,
            headers: {
                clientVersion: CLIENT_VERSION
            },
            httpsAgent
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

        if (!_.isObject(paramsJSON)) {
            throw new Error('Failed to make POST request. <object>paramsJSON is a required parameter.');
        }

        if (!apiVersion) {
            throw new Error('Failed to make POST request. <string>apiVersion is a required parameter.');
        }

        const request = this.buildRequest(httpMethods.POST, url, paramsJSON);
        let headers = { 'apiVersion': apiVersion };

        if (objectVersion) {
            // eslint-disable-next-line no-warning-comments
            // TODO FLEXSDK-2255: uncomment this code once the versioning bug is fixed
            // headers = Object.assign(headers, { 'If-Match': objectVersion });
        }

        return this._postClient.post(this._config.EB_SERVER, request, {
            headers
        }).then(response => {
            return Promise.resolve(response.data.payload);
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
        if (!_.isObject(paramsJSON)) {
            throw new Error('Failed to make GET request. <object>paramsJSON is a required parameter.');
        }

        const request = this.buildRequest(httpMethods.GET, url, paramsJSON);
        return this._postClient.post(this._config.EB_SERVER, request, {
            headers: {
                'apiVersion': apiVersion
            }
        }).then(response => {
            return Promise.resolve(response.data.payload);
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
}
