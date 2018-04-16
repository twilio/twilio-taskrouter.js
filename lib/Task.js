import _ from 'lodash';
import { API_V1, TASK_STATUS_COMPLETED, TASK_STATUS_WRAPPING } from './util/Constants';
import Configuration from './util/Configuration';
import { EventEmitter } from 'events';
import Logger from './util/Logger';
import path from 'path';
import TaskDescriptor from './descriptors/TaskDescriptor';

const fieldsToUpdate = [
    'attributes',
    'status',
    'workflowSid',
    'workflowName',
    'queueSid',
    'queueName',
    'priority',
    'reason',
    'timeout',
    'taskChannelSid',
    'taskChannelUniqueName',
    'age',
    'addOns',
    'dateUpdated'
];

/**
 * Construct a {@link Task}.
 * @class
 * @classdesc A {@link Task} represents an item of work
 * @param {Configuration} config - The {@link Configuration} of the {@link Worker}
 * @param {TaskDescriptor} descriptor - The data descriptor which describes this {@link Task}
 * @property {Object} addOns - The addons attached to the {@link Task}
 * @property {int} age - The age of the {@link Task} in seconds
 * @property {Object} attributes - The attributes of the {@link Task}
 * @property {Date} dateCreated - The date the {@link Task} was created
 * @property {Date} dateUpdated - The date the {@link Task} was last updated
 * @property {int} priority - The priority of the {@link Task}
 * @property {string} queueName - The friendly name of the TaskQueue the {@link Task} is currently in
 * @property {string} queueSid - The sid of the TaskQueue the {@link Task} is currently in
 * @property {string} reason - The reason the {@link Task} was completed or canceled, if applicable
 * @property {string} sid - The sid of the {@link Task}
 * @property {string} status - The status of the {@link Task}
 * @property {string} taskChannelSid - The sid of the Task Channel associated to the {@link Task} in MultiTask mode
 * @property {string} taskChannelUniqueName - The unique name of the Task Channel associated to the {@link Task} in MultiTask mode
 * @property {int} timeout - The number of seconds the {@link Task} is allowed to live
 * @property {string} workflowName - The name of the Workflow responsible for routing the {@link Task}
 * @property {string} workflowSid - The sid of the Workflow responsible for routing the {@link Task}
 * @fires Task#canceled
 * @fires Task#completed
 * @fires Task#updated
 * @fires Task#wrapup
 */
class Task extends EventEmitter {
    constructor(config, request, descriptor) {
        super();

        if (!(config instanceof Configuration)) {
            throw new TypeError('Failed to instantiate Task. <Configuration>config is a required parameter.');
        }
        if (!(descriptor instanceof TaskDescriptor)) {
            throw new TypeError('Failed to instantiate Task. <TaskDescriptor>descriptor is a required parameter.');
        }

        this._config = config;
        this._log = new Logger(`Task-${descriptor.sid}`, config._logLevel);
        this._request = request;

        Object.assign(this, descriptor);
    }

    /**
     * Update the {@link Task} status to 'completed'
     * @param {string} reason - The reason for completing the {@link Task}
     * @return {Promise<this>} - Rejected if the {@link Task} state could not be updated to 'completed'
     */
    complete(reason) {
        if (!_.isString(reason)) {
            throw new TypeError('Error calling method complete(). <string>reason is a required parameter.');
        }

        const requestURL = path.join(
            'Workspaces', this._config.workspaceSid,
            'Tasks', this.sid
        );
        const requestParams = {
            AssignmentStatus: TASK_STATUS_COMPLETED,
            Reason: reason
        };

        return this._request.post(requestURL, requestParams, API_V1).then(response => {
            return this._update(response);
        });
    }

    /**
     * Update the {@link Task} status to 'wrapping' in a multi-task enabled Workspace
     * @return {Promise<this>} - Rejected if the {@link Task} state could not be updated to 'wrapping'
     *//**
     * @typedef {Object} Task.WrappingOptions
     * @property {string} [reason=null] - The reason for wrapping up the {@link Task}
     */
    wrapUp(options = {}) {
        const requestURL = path.join(
            'Workspaces', this._config.workspaceSid,
            'Tasks', this.sid
        );
        const requestParams = {
            AssignmentStatus: TASK_STATUS_WRAPPING,
        };

        if (options.reason) {
            if (_.isString(options.reason)) {
                requestParams.Reason = options.reason;
            } else {
                throw new Error(`Failed to call wrapUp() on Task sid=${this.sid}. A <string>reason is required.`);
            }
        }

        return this._request.post(requestURL, requestParams, API_V1).then(response => {
            return this._update(response);
        });
    }

    /**
     * Emit events from this {@link Task}
     * @param {string} eventType - The event to emit
     * @param {Object} rawEventData - The eventData associated to the event
     * @private
     */
    _emitEvent(eventType, rawEventData) {
        this._log.trace(`_emitEvent(${eventType}, ${JSON.stringify(rawEventData)})`);

        if (!_.isString(eventType)) {
            throw new TypeError('Error calling _emitEvent(). <string>eventType is a required parameter.');
        }

        if (!_.isObject(rawEventData)) {
            throw new TypeError('Error calling method _emitEvent(). <object>payload is a required parameter.');
        }

        this._update(rawEventData);
        this.emit(eventType, this);
    }

    /**
     * Update this using the latest {@link Task} data
     * @param {Object} latestTaskData - The raw {@link Task} data
     * @private
     */
    _update(latestTaskData) {
        try {
            const updatedTaskDescriptor = new TaskDescriptor(latestTaskData, this._config);
            fieldsToUpdate.forEach(field => {
                this[field] = updatedTaskDescriptor[field];
            });
        } catch (err) {
            this._log.error(`Failed to update Task sid=${latestTaskData.sid}. Update aborted. Error: ${err}.`);
            throw new Error(`Failed to update Task sid=${latestTaskData.sid}. Update aborted. Error: ${err}.`);
        }
        return this;
    }
}

/**
 * The {@link Task} was canceled
 * @event Task#canceled
 * @param {Task} task - The {@link Task} who was canceled
 */

/**
 * The {@link Task} was completed
 * @event Task#completed
 * @param {Task} task - The {@link Task} who was completed
 */

/**
 * The attributes of this {@link Task} was updated
 * @event Task#updated
 * @param {Task} task - The {@link Task} whose attributes were updated
 */

/**
 * The {@link Task} was wrapped up
 * @event Task#wrapup
 * @param {Task} task - The {@link Task} who was wrapped up
 */

export const TaskProperties = [
    'addons',
    'age',
    'attributes',
    'date_created',
    'date_updated',
    'priority',
    'queue_name',
    'queue_sid',
    'reason',
    'sid',
    'assignment_status',
    'task_channel_unique_name',
    'task_channel_sid',
    'timeout',
    'workflow_name',
    'workflow_sid'
];

export default Task;
