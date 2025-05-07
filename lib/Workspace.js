import WorkspaceEntity from './data/WorkspaceEntity';
import isString from 'lodash/isString';
import Request from './util/Request.js';
import Configuration from './util/Configuration.js';
import jwtDecode from 'jwt-decode';
import Logger from './util/Logger';
import './types.jsdoc';


/**
 * Construct a {@link Workspace}
 * @classdesc Create a {@link Workspace} client representing a TaskRouter Workspace
 * @param {string} jwt - The string token
 * @param {WorkspaceOptions} [options]
 * @param {string} [workspaceSid] - Sid of this Workspace, has to be provided if JWE token is passed
 * @throws Exception if workspaceSid is not passed with JWE token
 */
class Workspace {
    /**
     * @param {string} jwt - The string token
     * @param {WorkspaceOptions} [options]
     * @param {string} [workspaceSid] - Sid of this Workspace, has to be provided if JWE token is passed
     */
    constructor(jwt, options = {}, workspaceSid) {
        /**
         * @type {Configuration}
         * @private
         */
        this._config = new Configuration(jwt, options);
        /**
         * @type {Request}
         * @private
         */
        this._request = new Request(this._config);
        /**
         * @type {string}
         * @private
         */
        this._logLevel = options.logLevel || 'error';
        /**
         * @type {Logger}
         * @private
         */
        this._log = new Logger(`Workspace-${this._config.getLogIdentifier()}`, this._logLevel);
        /**
         * if workspaceSid is not provided, try to obtain it from token
         * @type {boolean}
         * @private
         */
        this.shouldDecodeToken = !workspaceSid;
        /**
         * @type {string}
         * @readonly
         */
        this.workspaceSid = workspaceSid;
        this._updateJWTProperties(jwt);
        /**
         * @type {WorkspaceEntity}
         * @private
         */
        this.workspaceEntity = new WorkspaceEntity(this.workspaceSid, this._request, options);
    }

    /**
     * @deprecated use {@link Workspace#fetchWorkerInfo}
     * @description Fetch worker of this {@link Workspace} by given sid
     * @param {string} workerSid - the sid of the worker to fetch
     * @returns {Promise<import('./Worker')>} - A worker with given sid
     */
    fetchWorker(workerSid) {
        return this.workspaceEntity.fetchWorker(workerSid);
    }

    /**
     * Fetch worker info of this {@link Workspace} by given sid
     * @param {string} workerSid  - the sid of the worker to fetch
     * @returns {Promise<WorkerInfo>} - A worker with given sid
     */
    fetchWorkerInfo(workerSid) {
        return this.workspaceEntity.fetchWorker(workerSid);
    }

    /**
     * @deprecated use {@link Workspace#fetchWorkersInfo}
     * @description Fetch workers of this {@link Workspace}
     * @param {FetchWorkersParams} [params]
     * @returns {Promise<Map<string, import('./Worker')>>} - A map with the workers
     */
    fetchWorkers(params) {
        return this.workspaceEntity.fetchWorkers(params).then(() => this.workspaceEntity.Workers);
    }

    /**
     * Fetch workers info of this {@link Workspace}
     * @param {FetchWorkerInfoParams} [params]
     * @returns {Promise<Map<string, WorkerInfo>>} - A map with the workers info
     */
    fetchWorkersInfo(params) {
        return this.workspaceEntity.fetchWorkers(params).then(() => this.workspaceEntity.Workers);
    }

    /**
     * Fetch task queue of this {@link Workspace} by given sid
     * @param {string} queueSid - the sid of the task queue to fetch
     * @returns {Promise<import('./TaskQueue')>} - A task queue with given sid
    */
    fetchTaskQueue(queueSid) {
        return this.workspaceEntity.fetchTaskQueue(queueSid);
    }

    /**
     * Fetch task queues of this {@link Workspace}
     * @param {FetchTaskQueuesParams} [params]
     * @returns {Promise<Map<string, import('./TaskQueue')>>} - A map with the task queues
     */
    fetchTaskQueues(params) {
        return this.workspaceEntity.fetchTaskQueues(params).then(() => this.workspaceEntity.TaskQueues);
    }

    /**
     * Fetch Task of this {@link Workspace} by given sid
     * @param {string} taskSid - the sid of the task to fetch
     * @returns {Promise<import('./Task')>} - A task with given sid
     */
    fetchTask(taskSid) {
        return this.workspaceEntity.fetchTask(taskSid);
    }

    /**
     * Update token
     * @param {string} newToken - The new token that should be used for authentication
     * @returns {void} - throws error if unable to update token
     */
    updateToken(newToken) {
        if (!isString(newToken)) {
            throw new TypeError('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
        }

        this._config.updateToken(newToken);
        this._updateJWTProperties(newToken);
    }

    /**
     * @private
     * @param {string} token
     */
    _updateJWTProperties(token) {
        if (!this.shouldDecodeToken) {
            return;
        }

        const jwt = jwtDecode(token);
        /**
         * @type {Object}
         * @private
         */
        this.jwt = jwt;
        /**
         * @type {string}
         * @private
         */
        this.accountSid = jwt.sub;
        /**
         * @type {string}
         */
        this.workspaceSid = jwt.grants.task_router.workspace_sid;
        /**
         * @type {string}
         * @private
         */
        this.workerSid = jwt.grants.task_router.worker_sid;
        /**
         * @type {string}
         * @private
         */
        this.role = jwt.grants.task_router.role;
    }
}

export default Workspace;

