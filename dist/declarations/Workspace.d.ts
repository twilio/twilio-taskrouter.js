export default Workspace;
export type WorkspaceOptions = {
    region?: string | undefined;
    pageSize?: number | undefined;
    logLevel?: string | undefined;
};
export type FetchWorkersParams = {
    AfterSid?: string | undefined;
    FriendlyName?: string | undefined;
    ActivitySid?: string | undefined;
    ActivityName?: string | undefined;
    TargetWorkersExpression?: string | undefined;
    Ordering?: "DateStatusChanged:asc" | "DateStatusChanged:desc" | undefined;
    MaxWorkers?: number | undefined;
};
export type FetchTaskQueuesParams = {
    AfterSid?: string | undefined;
    FriendlyName?: string | undefined;
    Ordering?: "DateUpdated:asc" | "DateUpdated:desc" | undefined;
};
declare class Workspace {
    constructor(jwt: string, options?: WorkspaceOptions | undefined, workspaceSid?: string | undefined);
    private _config;
    private _request;
    private _logLevel;
    private _log;
    private shouldDecodeToken;
    readonly workspaceSid: string;
    private workspaceEntity;
    fetchWorker(workerSid: string): Promise<typeof import("./Worker")>;
    fetchWorkers(params?: FetchWorkersParams | undefined): Promise<Map<string, typeof import("./Worker")>>;
    fetchTaskQueue(queueSid: string): Promise<typeof import("./TaskQueue")>;
    fetchTaskQueues(params?: FetchTaskQueuesParams | undefined): Promise<Map<string, typeof import("./TaskQueue")>>;
    updateToken(newToken: string): void;
    private _updateJWTProperties;
    private jwt;
    private accountSid;
    private workerSid;
    private role;
}
