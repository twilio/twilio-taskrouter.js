import WorkspaceEntity from './data/WorkspaceEntity';
import _ from 'lodash';
import Request from './util/Request.js';
import Configuration from './util/Configuration.js';
import jwtDecode from 'jwt-decode';
import Logger from './util/Logger';


/**
 * Construct a {@link Workspace}
 * @class
 * @classdesc Create a {@link Workspace} client representing a TaskRouter Workspace
 * @param {string} jwt - The string token
 * @param {Workspace.Options} [options]
 * @param {string} workspaceSid - Sid of this Workspace, has to be provided if JWE token is passed
 * @throws Exception if workspaceSid is not passed with JWE token
 *//**
 * @typedef {Object} Workspace.Options
 * @property {string} region - the realm for connections (ex. "stage-us1")
 * @property {string} edge - the ingress for connections (ex. "sydney")
 * @property {string} pageSize - The number of items returned in each request
 * @property {string} [logLevel='error'] - The level of logging to enable
 *   ['error', 'warn', 'info', 'debug', 'trace', 'silent']
 */
class Workspace {

    constructor(jwt, options = {}, workspaceSid) {
        this._config = new Configuration(jwt, options);
        this._request = new Request(this._config);
        this._logLevel = options.logLevel || 'error';
        this._log = new Logger(`Workspace-${this._config.getLogIdentifier()}`, this._logLevel);

        // if workspaceSid is not provided, try to obtain it from token
        this.shouldDecodeToken = !workspaceSid;
        this.workspaceSid = workspaceSid;
        this._updateJWTProperties(jwt);

        this.workspaceEntity = new WorkspaceEntity(this.workspaceSid, this._request, options);
    }

    /**
     * Fetch worker of this {@link Workspace} by given sid
     * @param {string} workerSid - the sid of the worker to fetch
     * @returns {Promise<Worker>} - A worker with given sid
     */
    fetchWorker(workerSid) {
        return this.workspaceEntity.fetchWorker(workerSid);
    }

    /**
     * Fetch workers of this {@link Workspace}
     * @param {Workspace.FetchWorkersParams} [options]
     * @returns {Promise<Map<string, Worker>>} - A map with the workers
     *//**
     * @typedef {Object} Workspace.FetchWorkersParams
     * @property {string} [AfterSid=null]
     * @property {string} [FriendlyName=null]
     * @property {string} [ActivitySid=null]
     * @property {string} [ActivityName=null]
     * @property {string} [Ordering=null]
     * @property {string} [TargetWorkersExpression=null]
     * @property {number} [maxWorkers=null]
     */
    fetchWorkers(params) {
        return this.workspaceEntity.fetchWorkers(params).then(() => this.workspaceEntity.Workers);
    }

    /**
     * Fetch task queue of this {@link Workspace} by given sid
     * @param {string} queueSid - the sid of the task queue to fetch
     * @returns {Promise<TaskQueue>} - A task queue with given sid
    */
    fetchTaskQueue(queueSid) {
        return this.workspaceEntity.fetchTaskQueue(queueSid);
    }

    /**
     * Fetch task queues of this {@link Workspace}
     * @param {Workspace.FetchTaskQueuesParams} [options]
     * @returns {Promise<Map<string, TaskQueue>>} - A map with the task queues
     *//**
     * @typedef {Object} Workspace.FetchTaskQueuesParams
     * @property {string} [AfterSid=null]
     * @property {string} [FriendlyName=null]
     * @property {string} [Ordering=null]
     */
    fetchTaskQueues(params) {
        return this.workspaceEntity.fetchTaskQueues(params).then(() => this.workspaceEntity.TaskQueues);
    }

    /**
     * Update token
     * @param {string} newToken - The new token that should be used for authentication
     * @returns {void} - throws error if unable to update token
     */
    updateToken(newToken) {
        if (!_.isString(newToken)) {
            throw new TypeError('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
        }

        this._config.updateToken(newToken);
        this._updateJWTProperties(newToken);
    }

    _updateJWTProperties(token) {
        if (!this.shouldDecodeToken) {
            return;
        }

        const jwt = jwtDecode(token);
        this.jwt = jwt;
        this.accountSid = jwt.sub;
        this.workspaceSid = jwt.grants.task_router.workspace_sid;
        this.workerSid = jwt.grants.task_router.worker_sid;
        this.role = jwt.grants.task_router.role;
    }
}

export default Workspace;
