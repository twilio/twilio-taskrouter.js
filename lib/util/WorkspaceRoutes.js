import BaseRoutes from './BaseRoutes';
import { twilioErrors as Errors } from './Constants';
import path from 'path';

export const WORKER_LIST = 'workerList';
export const TASKQUEUE_LIST = 'taskQueueList';


export default class WorkspaceRoutes extends BaseRoutes {
    constructor(workspaceSid) {
        super();
        if (!workspaceSid) {
            throw Errors.INVALID_ARGUMENT.clone('Error instantiating WorkspaceRoutes class. <string>workspaceSid is required.');
        }

        this.workspaceSid = workspaceSid;
        this.routes = {
            [WORKER_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers')
            },
            [TASKQUEUE_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'TaskQueues')
            }
        };
    }
}
