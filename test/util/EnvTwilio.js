const Twilio = require('twilio');
const credentials = require('../../test/env');

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

    updateWorkflowTaskReservationTimeout(workspaceSid, workflowSid, newTimeout) {
        return this.twilioClient.taskrouter.v1.workspaces(workspaceSid)
            .workflows(workflowSid)
            .update({
                taskReservationTimeout: newTimeout
            });
    }

    /**
     * Helper function to make a call from one number to another and plays the specified twimlet
     * @param {string} toNumber - The number to dial
     * @param {string} fromNumber - The number to dial from
     * @param {string} twimletUrl - The URL to play when the toNumber picks up
     */
    async createCall(toNumber, fromNumber, twimletUrl) {
        return this.twilioClient.calls.create({
            url: twimletUrl,
            to: toNumber,
            from: fromNumber
        });
    }

    /**
     * Fetch the Conference by Sid
     * @param {string} conferenceSid - The Sid of the Conference
     */
    async fetchConference(conferenceSid) {
        return this.twilioClient.conferences(conferenceSid).fetch();
      }

    /**
     * Fetch the list of Participants for a particular Conference
     * @param {string} conferenceSid - The Sid of the Conference
     */
    async fetchConferenceParticipants(conferenceSid) {
        return this.twilioClient.conferences(conferenceSid).participants.list();
    }

    /**
     * Fetch the Conference by friendly name
     * @param {string} conferenceName  The friendly name of the Conference
     */
    async fetchConferenceByName(conferenceName) {
        return this.twilioClient.conferences.list({
            friendlyName: conferenceName, limit: 1
        }).then(conferences => {
             return conferences[0];
        });
    }

    /**
     * Fetch the Map of phone numbers to Participant properties in a particular Conference
     * @param {string} conferenceSid - The Sid of the Conference
     */
    async fetchParticipantProperties(conferenceSid) {
        const participantProperties = new Map();
        const phoneNumbers = [credentials.workerNumber, credentials.supervisorNumber, credentials.customerNumber];

        // Fetch list of all participants in a conference
        const participants = await this.fetchConferenceParticipants(conferenceSid);

        // Create PhoneNumber to Participant Map
        for (const phoneNumber of phoneNumbers) {
            for (const participant of participants) {
                const callInstance = await this.twilioClient.calls(participant.callSid).fetch();
                if (callInstance.to === phoneNumber) {
                    participantProperties.set(phoneNumber, participant);
                }
            }
        }

        return participantProperties;
    }
}
