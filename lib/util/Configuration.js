import Logger from './Logger';
import _ from 'lodash';

/**
 * Construct the {@link Configuration} for the {@link Worker}
 * @class
 * @classdesc The configuration settings
 * @param {string} token - The {@link Worker}'s token
 * @param {Configuration.Options} [options]
 * @property {string} token - The token
 * @property {string} workerSid - The sid of the {@link Worker}
 * @property {string} workspaceSid - The sid of the Workspace owning the {@link Worker}
 *
 * @typedef {Object} Configuration.Options
 * @property {string} region - the realm for connections (ex. "stage-us1")
 * @property {string} edge - the ingress for connections (ex. "sydney")
 */
export default class Configuration {
    constructor(token, options = {}) {
        if (!_.isString(token)) {
            throw new TypeError('Failed to initialize Configuration. <string>token is a required parameter.');
        }

        this.logIdentifier = options.logIdentifier || +new Date();
        this._logLevel = options.logLevel || 'error';
        this._log = new Logger(`Configuration-${this.logIdentifier}`, this._logLevel);

        this.token = token;

        let edgeAndRegionSlice = '';

        if (options.edge) {
            edgeAndRegionSlice += `.${options.edge}`;
        }
        if (options.region) {
            edgeAndRegionSlice += `.${options.region}`;
        }

        this.EB_SERVER = `https://event-bridge${edgeAndRegionSlice}.twilio.com/v1/wschannels`;
        this.WS_SERVER = `wss://event-bridge${edgeAndRegionSlice}.twilio.com/v1/wschannels`;

    }

    /**
     * Update the token
     * @param {string} newToken - The new token to be used
     */
    updateToken(newToken) {
        if (!_.isString(newToken)) {
            throw new TypeError('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
        }

        this.token = newToken;
    }

    getLogIdentifier() {
        return this.logIdentifier;
    }
}
