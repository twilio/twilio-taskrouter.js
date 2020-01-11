const Twilio = require('twilio');

export default class EnvTwilio {
    constructor(accountSid, authToken, environment) {
        this.twilioClient = new Twilio(accountSid, authToken, {
            region: environment
        });
    }

    createTask(workspaceSid, workflowSid, attributes) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .tasks
            .create({
                workflowSid: workflowSid,
                attributes: attributes
            }).then(task => {
                return task;
            });
    }

    updateTask(workspaceSid, taskSid, attributes) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .tasks(taskSid)
            .update({
                attributes: attributes
            }).catch(err => {
                console.log('err updating task', err);
            });
    }

    cancelTask(workspaceSid, taskSid, reason) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .tasks(taskSid)
            .update({
                assignmentStatus: 'canceled',
                reason: reason
            }).catch(err => {
                console.log('err canceling task', err);
            });
    }

    deleteTask(workspaceSid, taskSid) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .tasks(taskSid)
            .remove()
            .catch(err => {
                // Was already deleted
                if (err.status !== 404) {
                    throw err;
                }
            });
    }

    deleteAllTasks(workspaceSid) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .tasks
            .list()
            .then(tasks => Promise.all(
                tasks.map(task => {
                    return task.remove().catch(err => {
                        console.log('error deleting task', err);
                        throw err;
                    });
                })
            )).catch(err => {
                console.log('err with deleting tasks', err);
                throw err;
            });
    }

    updateWorkerActivity(workspaceSid, workerSid, activitySid) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .workers(workerSid)
            .update({
                activitySid: activitySid
            });
    }

    updateWorkerCapacity(workspaceSid, workerSid, taskChannelUniqueName, newCapacity) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .workers(workerSid)
            .workerChannels(taskChannelUniqueName)
            .update({
                capacity: newCapacity
            });
    }
}
