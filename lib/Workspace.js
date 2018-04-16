import TaskRouterBase from './TaskRouterBase.js';
import WorkspaceEntity from './data/WorkspaceEntity';

class Workspace extends TaskRouterBase {

    constructor(jwt, options = {}) {
        super(jwt, options);

        if (this.role.toLowerCase() !== 'admin') {
            throw new TypeError('A token with the "admin" role is required to use this functionality.');
        }

        this.workspaceEntity = new WorkspaceEntity(this._config, this._request, options);
    }

    fetchWorkers() {
       return this.workspaceEntity.fetchWorkers().then(() => this.workspaceEntity.Workers);
    }

    fetchTaskQueues() {
        return this.workspaceEntity.fetchTaskQueues().then(() => this.workspaceEntity.TaskQueues);
     }
}

export default Workspace;
