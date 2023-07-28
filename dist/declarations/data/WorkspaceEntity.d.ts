export default class WorkspaceEntity {
    constructor(workspaceSid: string, request: typeof import("../util/Request"), options?: import('Workspace').WorkspaceOptions | undefined);
    private _Workers;
    private _TaskQueues;
    private _routes;
    private _request;
    private _log;
    private _pageSize;
    get Workers(): Map<string, Worker>;
    get TaskQueues(): Map<string, TaskQueue>;
    public fetchWorker(workerSid: string): Promise<Worker>;
    public fetchWorkers(params: import('Workspace').FetchWorkersParams): Promise<Map<string, Worker>>;
    public fetchTaskQueue(queueSid: string): Promise<TaskQueue>;
    public fetchTaskQueues(params: import('Workspace').FetchTaskQueuesParams): Promise<Map<string, TaskQueue>>;
    private _getAllWorkers;
    private _getWorkerPage;
    private _insertWorker;
    private _getAllTaskQueues;
    private _getTaskQueuePage;
    private _insertTaskQueue;
}
import TaskQueue from "../TaskQueue";
