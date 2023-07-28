export const WORKER_LIST: "workerList";
export const TASKQUEUE_LIST: "taskQueueList";
export default class WorkspaceRoutes extends BaseRoutes {
    constructor(workspaceSid: string);
    workspaceSid: string;
    routes: WorkspaceRoutes.routeTypes;
}
export namespace WorkspaceRoutes {
    type routeTypes = {
        taskQueueList: {
            "path": string;
        };
        workerList: {
            "path": string;
        };
    };
}
import BaseRoutes from "./BaseRoutes";
