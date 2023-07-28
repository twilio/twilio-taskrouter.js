export default class ActivitiesEntity {
    constructor(worker: typeof import("../Worker"), request: typeof import("../util/Request"), options?: Activities.Options | undefined);
    private _activities;
    private _log;
    private _request;
    private _worker;
    private _pageSize;
    get activities(): Map<string, Activity>;
    public fetchActivities(): Promise<Map<string, Activity>>;
    private _getAllActivities;
    private _getPage;
    private _insertActivity;
}
export namespace Activities {
    type Options = {
        pageSize?: number | undefined;
    };
}
import Activity from "../Activity";
