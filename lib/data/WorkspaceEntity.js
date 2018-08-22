import _ from 'lodash';
import { API_V1, DEFAULT_PAGE_SIZE } from '../util/Constants';
import WorkerDescriptor from '../descriptors/WorkerDescriptor';
import TaskQueueDescriptor from '../descriptors/TaskQueueDescriptor';
import WorkerContainer from '../WorkerContainer';
import TaskQueue from '../TaskQueue';
import Worker from '../Worker';
import { WORKER_LIST, TASKQUEUE_LIST } from '../util/Routes';
const Paginator = require('../util/Paginator');

/**
 * A data entity which represents a Workspace
 * @class
 * @classdesc A collection representing the {@link Worker}s and {@link TaskQueue}s available to a Workspace.
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {Options} [options]
 * @property {Map<string, Worker>} Workers - The list of {@link Worker}s available to a {@link Workspace}
 * @property {Map<string, TaskQueue>} TaskQueues - The list of {@link TaskQueue}s available to a {@link Workspace}
 *//**
 * @typedef {Object} Options
 * @property {number} [pageSize] - The page size to use when querying for data
 */
export default class WorkspaceEntity {
    constructor(worker, request, options = {}) {
        if (!(worker instanceof Worker)) {
            throw new TypeError('Failed to initialize WorkspacesEntity. <Worker>worker is a required parameter.');
        }

        this._Workers = new Map();
        this._TaskQueues = new Map();
        this._worker = worker;
        this._request = request;
        this._log = worker.getLogger(`WorkspaceEntity-${this._worker.workspaceSid}`);
        this._pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

        if (!_.inRange(this._pageSize, 1, DEFAULT_PAGE_SIZE + 1)) {
            this._log.warn(
                'PageSize range for WorkspaceEntity must be between 1 and %d. Setting pageSize to default size=%d',
                DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE
            );

            this._pageSize = DEFAULT_PAGE_SIZE;
        }
    }

    get Workers() {
        return this._Workers;
    }

    get TaskQueues() {
        return this._TaskQueues;
    }

    /**
     * Retrieve all the {@link Worker}s for the {@link Workspace}
     * @returns {Promise.<Void>}
     */
    fetchWorkers() {
        return this._getAllWorkers(this._getWorkerPage());
    }

    fetchTaskQueues() {
        return this._getAllTaskQueues(this._getTaskQueuePage());
    }

    _getAllWorkers(page) {
        return page.then(paginator => {
            paginator.items.forEach(worker => this._insertWorker(worker));

            if (!paginator.hasNextPage) {
                return;
            }

            this._getAllWorkers(paginator.nextPage());
        });
    }

    // Helper method to make a request to TaskRouter to fetch a particular page of {@link Workspace} objects
    _getWorkerPage(args) {
        args = args || {};

        const requestURL = this._worker.getRoutes().getRoute(WORKER_LIST).path;
        const requestParam = {
            PageSize: this._pageSize
        };

        if (args.AfterSid) {
            requestParam.AfterSid = args.AfterSid;
        }

        return this._request.get(requestURL, API_V1, requestParam).then(response => {
            return new Paginator(
                response.contents.map(x => new WorkerDescriptor(x)),
                nextToken => this._getPage({ AfterSid: nextToken }),
                response.after_sid
            );
        });
    }

    _insertWorker(descriptor) {
        const sid = descriptor.sid;
        this._log.trace('_insertWorker(sid=%s, data=%s)', sid, JSON.stringify(descriptor));

        try {
            this._Workers.set(sid, new WorkerContainer(descriptor));
        } catch (err) {
            this._log.error('Unable to create a Worker for sid=%s. Skipping insert into Worker map. Error: %s', sid, err);
        }
    }

    // task queue
    _getAllTaskQueues(page) {
        return page.then(paginator => {
            paginator.items.forEach(item => this._insertTaskQueue(item));

            if (!paginator.hasNextPage) {
                return;
            }

            this._getAllTaskQueues(paginator.nextPage());
        });
    }

    // Helper method to make a request to TaskRouter to fetch a particular page of {@link Workspace} objects
    _getTaskQueuePage(args) {
        args = args || {};

        const requestURL = this._worker.getRoute(TASKQUEUE_LIST).path;
        const requestParam = {
            PageSize: this._pageSize
        };

        if (args.AfterSid) {
            requestParam.AfterSid = args.AfterSid;
        }

        return this._request.get(requestURL, API_V1, requestParam).then(response => {
            return new Paginator(
                response.contents.map(x => new TaskQueueDescriptor(x)),
                nextToken => this._getPage({ AfterSid: nextToken }),
                response.after_sid
            );
        });
    }

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
