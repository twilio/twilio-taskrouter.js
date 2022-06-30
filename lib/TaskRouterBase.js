import Configuration from './util/Configuration';
import Request from './util/Request';

export default class TaskRouterBase {
    constructor(jwt, options = {}) {
        if (new.target === TaskRouterBase) {
            throw new TypeError('You cannot instantiate TaskRouterBase directly');
        }

        this._config = new Configuration(jwt, options);
        this._request = new Request(this._config);

        this.jwt = jwt;
        this.accountSid = jwt.sub;
        this.workspaceSid = jwt.grants.task_router.workspace_sid;
        this.workerSid = jwt.grants.task_router.worker_sid;
        this.role = jwt.grants.task_router.role;
    }
}
