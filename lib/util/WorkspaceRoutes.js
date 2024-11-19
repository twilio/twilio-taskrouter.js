import BaseRoutes from './BaseRoutes';
import { twilioErrors as Errors } from './Constants';
import path from 'path';

export const WORKER_LIST = 'workerList';
export const TASKQUEUE_LIST = 'taskQueueList';
export const TASK_LIST = 'taskList';

/**
 * @typedef WorkspaceRoutes.routeTypes
 * @type {{taskQueueList: {"path": string}, workerList: {"path": string}}}
 */

/**
 * Construct a custom {@link WorkspaceRoutes}
 * @extends {BaseRoutes}
 * @param {string} workspaceSid
 * @property {WorkspaceRoutes.routeTypes} routes
 */
export default class WorkspaceRoutes extends BaseRoutes {
    /**
     * @param {string} workspaceSid
     */
    constructor(workspaceSid) {
        super();
        if (!workspaceSid) {
            throw Errors.INVALID_ARGUMENT.clone('Error instantiating WorkspaceRoutes class. <string>workspaceSid is required.');
        }

        /**
         * @type {string}
         */
        this.workspaceSid = workspaceSid;
        /**
         * @type {WorkspaceRoutes.routeTypes}
         */
        this.routes = {
            [WORKER_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers')
            },
            [TASKQUEUE_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'TaskQueues')
            },
            [TASK_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Tasks')
            }
        };
    }
}
