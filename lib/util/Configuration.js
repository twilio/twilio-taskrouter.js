import Logger from './Logger';
import _ from 'lodash';
const tools = require('./Tools');

/**
 * Construct the {@link Configuration} for the {@link Worker}
 * @class
 * @classdesc The configuration settings
 * @param {string} token - The {@link Worker}'s token
 * @param {Configuration.Options} [options]
 * @property {string} token - The token
 * @property {string} workerSid - The sid of the {@link Worker}
 * @property {string} workspaceSid - The sid of the Workspace owning the {@link Worker}
 * @property {string} EB_SERVER - The EventBridge URI
 * @property {string} WS_SERVER - The WebSocket URI
 *
 * @typedef {Object} Configuration.Options
 * @property {string} [ebServer] - the fully qualified URL to the desired EventBridge server
 * @property {string} [wsServer] - the fully qualified URL to the desired WebSocket server
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
        this.EB_SERVER = options.ebServer || 'https://event-bridge.twilio.com/v1/wschannels';
        this.WS_SERVER = options.wsServer || 'wss://event-bridge.twilio.com/v1/wschannels';
    }

    /**
     * Update the token
     * @param {string} newToken - The new token to be used
     */
    updateToken(newToken) {
        if (!_.isString(newToken)) {
            throw new TypeError('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
        }

        // verify the token
        try {
            tools.verifyJWT(newToken);
            this.token = newToken;
        } catch (err) {
            this._log.error('Failed to update the Twilio token. <string>newToken failed to be verified. Error: %s', err);
            throw err;
        }
    }

    getLogIdentifier() {
        return this.logIdentifier;
    }
}
