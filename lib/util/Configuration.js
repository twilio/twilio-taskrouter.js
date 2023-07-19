import Logger from './Logger';
import _ from 'lodash';

/**
 * @typedef {Object} Configuration.Options
 * @property {string} [region] - the realm for connections (ex. "stage-us1")
 * @property {string} [ebServer]
 * @property {string} [wsServer]
 * @property {string} [logIdentifier]
 * @property {string} [connectActivitySid=''] - The {@link Activity} state of the Worker upon connect
 * @property {boolean} [closeExistingSessions=false] - - Whether other open sessions of this {@link Worker}
 *   should be terminated
 * @property {string} [logLevel='error'] - The level of logging to enable
 *   ['error', 'warn', 'info', 'debug', 'trace', 'silent']
 */

/**
 * Construct the {@link Configuration} for the {@link Worker}
 * @classdesc The configuration settings
 * @param {string} token - The {@link Worker}'s token
 * @param {Configuration.Options} [options]
 * @property {string} token - The token
 * @property {string} workerSid - The sid of the {@link Worker}
 * @property {string} workspaceSid - The sid of the Workspace owning the {@link Worker}
 */
export default class Configuration {
    /**
     * @param {string} token - The {@link Worker}'s token
     * @param {Configuration.Options | undefined} [options]
     */
    constructor(token, options = {}) {
        if (!_.isString(token)) {
            throw new TypeError('Failed to initialize Configuration. <string>token is a required parameter.');
        }

        /**
         * @type {string}
         */
        this.logIdentifier = options.logIdentifier || +new Date();
        /**
         * @type {string}
         * @private
         */
        this._logLevel = options.logLevel;
        /**
         * @type {Logger}
         * @private
         */
        this._log = new Logger(`Configuration-${this.logIdentifier}`, this._logLevel);

        /**
         * @type {string}
         */
        this.token = token;
        /**
         * @type {string}
         */
        this.EB_SERVER = options.ebServer;
        /**
         * @type {string}
         */
        this.WS_SERVER = options.wsServer;

        if (options.ebServer || options.wsServer) {
            return this._log.warn('"ebServer" and "wsServer" parameter will be removed in next major version. ' +
                'You may start using "region" and "edge".');
        }

        let edgeAndRegionSlice = '';

        if (options.region && options.region !== 'us1') {
            edgeAndRegionSlice += `.${options.region}`;
        }

        this.EB_SERVER = `https://event-bridge${edgeAndRegionSlice}.twilio.com/v1/wschannels`;
        this.WS_SERVER = `wss://event-bridge${edgeAndRegionSlice}.twilio.com/v1/wschannels`;

    }

    /**
     * Update the token
     * @public
     * @param {string} newToken - The new token to be used
     */
    updateToken(newToken) {
        if (!_.isString(newToken)) {
            throw new TypeError('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
        }

        this.token = newToken;
    }

    /**
     * @public
     * @return {string}
     */
    getLogIdentifier() {
        return this.logIdentifier;
    }
}
