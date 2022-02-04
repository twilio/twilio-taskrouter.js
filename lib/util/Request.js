import _ from 'lodash';
import * as axios from 'axios';
import Configuration from './Configuration';
import { DEFAULT_HTTP_TIMEOUT } from './Constants';

const httpMethods = {
    GET: 'GET',
    POST: 'POST'
};
Object.freeze(httpMethods);

import * as packageJson from '../../package.json';
const CLIENT_VERSION = packageJson.version;

export default class Request {
    constructor(config) {
        if (!(config instanceof Configuration)) {
            throw new TypeError('Failed to initialize Request. <Configuration>config is a required parameter.');
        }

        this._config = config;
        this._postClient = axios.create({
            method: httpMethods.POST,
            timeout: DEFAULT_HTTP_TIMEOUT,
            headers: {
                clientVersion: CLIENT_VERSION
            }
        });
    }

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
            headers = Object.assign(headers, { 'If-Match': objectVersion });
        }

        return this._postClient.post(this._config.EB_SERVER, request, {
            headers
        }).then(response => {
            return Promise.resolve(response.data.payload);
        });
    }

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

    buildRequest(method, url, paramsJSON) {
        return JSON.stringify({
            url: url,
            method: method,
            params: paramsJSON,
            token: this._config.token
        });
    }
}
