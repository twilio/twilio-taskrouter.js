const Twilio = require('twilio');

export default class EnvTwilio {
    constructor(accountSid, authToken, environment) {
        this.twilioClient = new Twilio(accountSid, authToken, { region: environment });
    }

    createTask(workspaceSid, workflowSid, attributes) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
        .tasks
        .create({ workflowSid: workflowSid, attributes: attributes });
    }

    updateTask(workspaceSid, taskSid, attributes) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .tasks(taskSid)
            .update({ attributes: attributes });
    }

    cancelTask(workspaceSid, taskSid, reason) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .tasks(taskSid)
            .update({ assignmentStatus: 'canceled', reason: reason });
    }

    deleteTask(workspaceSid, taskSid) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
        .tasks(taskSid)
        .remove();
    }

    deleteAllTasks(workspaceSid) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
        .tasks
        .list()
        .then(tasks => Promise.all(tasks.map(task => task.remove())));
    }

    updateWorkerActivity(workspaceSid, workerSid, activitySid) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
        .workers(workerSid)
        .update({ activitySid: activitySid });
      }

      updateWorkerCapacity(workspaceSid, workerSid, taskChannelUniqueName, newCapacity) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .workers(workerSid)
            .workerChannels(taskChannelUniqueName)
            .update({ capacity: newCapacity });
      }
}
