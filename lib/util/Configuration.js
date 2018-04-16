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
 *//**
 * @typedef {Object} Configuration.Options
 * @property {string} [ebServer] - the fully qualified URL to the desired EventBridge server
 * @property {string} [wsServer] - the fully qualified URL to the desired WebSocket server
 */
export default class Configuration {
    constructor(token, options = {}) {
        if (!_.isString(token)) {
            throw new TypeError('Failed to initialize Configuration. <string>token is a required parameter.');
        }

        // verify the token
        const jwt = tools.verifyJWT(token);
        const accountSid = jwt.sub;
        const workspaceSid = jwt.grants.task_router.workspace_sid;
        const workerSid = jwt.grants.task_router.worker_sid;

        this._logLevel = options.logLevel || 'error';
        this._log = new Logger(`Configuration-${workerSid}`, this._logLevel);

        this.token = token;
        this.accountSid = accountSid;
        this.workerSid = workerSid;
        this.workspaceSid = workspaceSid;
        this.EB_SERVER = this.formatUrl(options.ebServer) || `https://event-bridge.twilio.com/v1/wschannels/${accountSid}/${workerSid}`;
        this.WS_SERVER = this.formatUrl(options.wsServer) || `wss://event-bridge.twilio.com/v1/wschannels/${accountSid}/${workerSid}`;
    }

    /*
     * Interpolate context into url
     * supports {accountsid}, {workerSid} and {workspaceSid}
     * @param {string} url - to be formatted
     * @return {string} formatted url
     */
    formatUrl(url) {
        return !url ? false : url.replace('{workspaceSid}', this.workspaceSid)
            .replace('{workerSid}', this.workerSid)
            .replace('{accountSid}', this.accountSid);
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
}
