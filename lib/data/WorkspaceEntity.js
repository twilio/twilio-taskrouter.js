import _ from 'lodash';
import { API_V1, DEFAULT_MAX_WORKERS, DEFAULT_PAGE_SIZE } from '../util/Constants';
import WorkerDescriptor from '../descriptors/WorkerDescriptor';
import TaskQueueDescriptor from '../descriptors/TaskQueueDescriptor';
import WorkerContainer from '../WorkerContainer';
import TaskQueue from '../TaskQueue';
import Paginator from '../util/Paginator';
import Logger from '../util/Logger';
import WorkspaceRoutes, { WORKER_LIST, TASKQUEUE_LIST } from '../util/WorkspaceRoutes';
import path from 'path';

/**
 * A data entity which represents a Workspace
 * @classdesc A collection representing the {@link Worker}s and {@link TaskQueue}s available to a Workspace.
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {import('Workspace').WorkspaceOptions} [options]
 * @property {Map<string, Worker>} Workers - The list of {@link Worker}s available to a {@link Workspace}
 * @property {Map<string, TaskQueue>} TaskQueues - The list of {@link TaskQueue}s available to a {@link Workspace}
 */
export default class WorkspaceEntity {
    /**
     * @param {string} workspaceSid - The sid of workspace
     * @param {import('../util/Request')} request - The {@link Request}
     * @param {import('Workspace').WorkspaceOptions | undefined} [options]
     */
    constructor(workspaceSid, request, options = {}) {
        /**
         * @private
         * @type {Map}
         */
        this._Workers = new Map();
        /**
         * @private
         * @type {Map}
         */
        this._TaskQueues = new Map();
        /**
         * @private
         * @type {WorkspaceRoutes}
         */
        this._routes = new WorkspaceRoutes(workspaceSid);
        /**
         * @private
         * @type {import('../util/Request')}
         */
        this._request = request;
        /**
         * @private
         * @type {import('../util/Logger')}
         */
        this._log =  new Logger(`WorkspaceEntity-${workspaceSid}`,  options.logLevel);
        /**
         * @private
         * @type {string}
         */
        this._pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

        if (!_.inRange(this._pageSize, 1, DEFAULT_PAGE_SIZE + 1)) {
            this._log.warn(
                'PageSize range for WorkspaceEntity must be between 1 and %d. Setting pageSize to default size=%d',
                DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE
            );

            this._pageSize = DEFAULT_PAGE_SIZE;
        }
    }

    /**
     * @returns {Map<string, Worker>}
     */
    get Workers() {
        return this._Workers;
    }

    /**
     * @returns {Map<string, TaskQueue>}
     */
    get TaskQueues() {
        return this._TaskQueues;
    }

    /**
     * @public
     * @param {string} workerSid
     * @returns {Promise<Worker>}
     */
    fetchWorker(workerSid) {
        const requestURL = path.join(this._routes.getRoute(WORKER_LIST).path, workerSid);

        return this._request.get(requestURL, API_V1).then(response => {
            return new WorkerContainer(new WorkerDescriptor(response));
        });
    }

    /**
     * Retrieve all the {@link Worker}s for the {@link Workspace}
     * @public
     * @param {import('Workspace').FetchWorkersParams} params
     * @returns {Promise<Map<string, Worker>>}
     */
    fetchWorkers(params) {
        this._Workers = new Map();
        const { MaxWorkers, ...otherParams } = params || {};

        return this._getAllWorkers(this._getWorkerPage(otherParams), MaxWorkers);
    }

    /**
     * @public
     * @param {string} queueSid
     * @returns {Promise<TaskQueue>}
     */
    fetchTaskQueue(queueSid) {
        const requestURL = path.join(this._routes.getRoute(TASKQUEUE_LIST).path, queueSid);

        return this._request.get(requestURL, API_V1).then(response => {
            return new TaskQueue(new TaskQueueDescriptor(response));
        });
    }

    /**
     * @public
     * @param {import('Workspace').FetchTaskQueuesParams} params
     * @returns {Promise<Map<string, TaskQueue>>}
     */
    fetchTaskQueues(params) {
        this._TaskQueues = new Map();

        return this._getAllTaskQueues(this._getTaskQueuePage(params));
    }

    /**
     * @private
     * @param {Paginator} page
     * @param {number} maxWorkers
     * @returns {Promise<Map<string, Worker>>}
     */
    _getAllWorkers(page, maxWorkers = DEFAULT_MAX_WORKERS) {
        return page.then(async(paginator) => {
            for (const worker of paginator.items) {
                if (this._Workers.size >= maxWorkers) {
                    break;
                }
                this._insertWorker(worker);
            }

            if (!paginator.hasNextPage) {
                return;
            }

            if (this._Workers.size >= maxWorkers) {
                return;
            }

            await this._getAllWorkers(paginator.nextPage(), maxWorkers);
        });
    }

    /**
     * Helper method to make a request to TaskRouter to fetch a particular page of {@link Workspace} objects
     * @private
     * @param {Object} args
     * @returns {Promise<Map<string, Worker>>}
     */
    _getWorkerPage(args) {
        args = args || {};

        const requestURL = this._routes.getRoute(WORKER_LIST).path;
        const requestParam = {
            PageSize: this._pageSize
        };

        const keys = [
          'AfterSid',
          'FriendlyName',
          'ActivitySid',
          'ActivityName',
          'Ordering',
          'TargetWorkersExpression',
          'NextToken'
        ];
        keys.forEach(key => {
            if (args[key]) {
                requestParam[key] = args[key];
            }
        });

        return this._request.get(requestURL, API_V1, requestParam).then(response => {
            const { Ordering, ...otherParams } = requestParam;
            const nextTokenKey = Ordering ? 'NextToken' : 'AfterSid';

            return new Paginator(
                response.contents.map(x => new WorkerDescriptor(x)),
                nextToken => this._getWorkerPage({ ...otherParams, Ordering, [nextTokenKey]: nextToken }),
                Ordering ? response.meta.next_token : response.after_sid
            );
        });
    }

    /**
     * @private
     * @param {WorkerDescriptor} descriptor
     */
    _insertWorker(descriptor) {
        const sid = descriptor.sid;
        this._log.trace('_insertWorker(sid=%s, data=%s)', sid, JSON.stringify(descriptor));

        try {
            this._Workers.set(sid, new WorkerContainer(descriptor));
        } catch (err) {
            this._log.error('Unable to create a Worker for sid=%s. Skipping insert into Worker map. Error: %s', sid, err);
        }
    }

    /**
     * @private
     * @param {Paginator} page
     * @returns {Promise<Map<string, TaskQueue>>}
     */
    async _getAllTaskQueues(page) {
        return page.then(async paginator => {
            paginator.items.forEach(item => this._insertTaskQueue(item));

            if (!paginator.hasNextPage) {
                return;
            }

            await this._getAllTaskQueues(paginator.nextPage());
        });
    }

    /**
     * Helper method to make a request to TaskRouter to fetch a particular page of {@link Workspace} objects
     * @private
     * @param {Object} args
     * @returns {Promise<Map<string, TaskQueue>>}
     */
    _getTaskQueuePage(args) {
        args = args || {};

        const requestURL = this._routes.getRoute(TASKQUEUE_LIST).path;
        const requestParam = {
            PageSize: this._pageSize
        };

        const keys = ['AfterSid', 'FriendlyName', 'Ordering', 'NextToken'];
        keys.forEach(key => {
            if (args[key]) {
                requestParam[key] = args[key];
            }
        });


        return this._request.get(requestURL, API_V1, requestParam).then(response => {
            const { Ordering, ...otherParams } = requestParam;
            const nextTokenKey = Ordering ? 'NextToken' : 'AfterSid';

            return new Paginator(
                response.contents.map(x => new TaskQueueDescriptor(x)),
                nextToken => this._getTaskQueuePage({ ...otherParams, Ordering, [nextTokenKey]: nextToken }),
                Ordering ? response.meta.next_token : response.after_sid
            );
        });
    }

    /**
     * @private
     * @param {TaskQueueDescriptor} descriptor
     */
    _insertTaskQueue(descriptor) {
        const sid = descriptor.sid;
        this._log.trace('_insertTaskQueue(sid=%s, data=%s', sid, JSON.stringify(descriptor));

        try {
            this._TaskQueues.set(sid, new TaskQueue(descriptor));
        } catch (err) {
            this._log.error('Unable to create a TaskQueue for sid=%s. Skipping insert into TaskQueue map. Error: %s', sid, err);
        }
    }
}
