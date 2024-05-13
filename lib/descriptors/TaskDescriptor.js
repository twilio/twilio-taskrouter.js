import isObject from 'lodash/isObject';
import { parseTime } from '../util/Tools';
import { TaskProperties } from '../Task';

/**
 * Construct a {@link TaskDescriptor} for the given {@link Task} data representation
 * @classdesc A data descriptor of a {@link Task}
 * @param {Object} descriptor - The data representing a {@link Task}
 * @property {Object} addOns - The addons attached to the {@link Task}
 * @property {number} age - The age of the {@link Task} in seconds
 * @property {Object} attributes - The attributes describing the {@link Task}
 * @property {Date} dateCreated - The date when the {@link Task} was created
 * @property {Date} dateUpdated - The date when the {@link Task} was last updated
 * @property {number} priority - The priority ranking given to the {@link Task}
 * @property {string} queueName - The friendly name of the TaskQueue the {@link Task} belongs to
 * @property {string} queueSid - The Sid of the TaskQueue the {@link Task} belongs to
 * @property {string} reason - The reason that describes why the {@link Task} moved to status=['canceled', 'completed']
 * @property {string} routingTarget - The target Sid of the {@link Worker}, {@link TaskQueue}, or Workflow this {@link Task} will be routed to.
 * @property {string} sid - The Sid of the {@link Task}
 * @property {string} status - The current assignment status=['pending', 'reserved', 'assigned', 'canceled', 'completed', 'wrapping']
 * @property {string} taskChannelUniqueName - The friendly name of the TaskChannel the {@link Task} was created against
 * @property {string} taskChannelSid - The Sid of the TaskChannel the {@link Task} was created against
 * @property {number} timeout - The timeout configured on a {@link Task}
 * @property {string} workflowName - The friendly name of the Workflow the {@link Task} was created against
 * @property {string} workflowSid - The Sid of the Workflow the {@link Task} was created against
 * @property {TransferDescriptor} [incomingTransferDescriptor]
 * @property {TransferDescriptor} [outgoingTransferDescriptor]
 * @property {string} version - The version of this {@link Task}
 * @property {Date} virtualStartTime - Optionally set starting time of the {@link Task}, in cases where
 *     the interaction between the customer and agents spans across multiple tasks. If not
 *     provided, defaults to dateCreated.
 */
export default class TaskDescriptor {
    /**
     * @param {Object} descriptor - The data representing a {@link Task}
     */
    constructor(descriptor) {
        if (!isObject(descriptor)) {
            throw new TypeError('Failed to instantiate TaskDescriptor. <Descriptor>descriptor is required.');
        }

        if (!TaskProperties.every(p => p in descriptor)) {
            throw new TypeError('Failed to instantiate TaskDescriptor. <Descriptor>descriptor does not contain all properties of a Task.');
        }

        /**
         * @type {Object}
         */
        this.addOns = JSON.parse(descriptor.addons);
        /**
         * @type {number}
         */
        this.age = descriptor.age;
        /**
         * @type {Object}
         */
        this.attributes = JSON.parse(descriptor.attributes);
        /**
         * @type {Date}
         */
        this.dateCreated = parseTime(descriptor.date_created * 1000);
        /**
         * @type {Date}
         */
        this.dateUpdated = parseTime(descriptor.date_updated * 1000);
        /**
         * @type {number}
         */
        this.priority = descriptor.priority;
        /**
         * @type {string}
         */
        this.queueName = descriptor.queue_name;
        /**
         * @type {string}
         */
        this.queueSid = descriptor.queue_sid;
        /**
         * @type {string}
         */
        this.reason = descriptor.reason;
        /**
         * @type {string}
         */
        this.routingTarget = descriptor.routing_target;
        /**
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @type {string}
         */
        this.status = descriptor.assignment_status;
        /**
         * @type {string}
         */
        this.taskChannelUniqueName = descriptor.task_channel_unique_name;
        /**
         * @type {string}
         */
        this.taskChannelSid = descriptor.task_channel_sid;
        /**
         * @type {number}
         */
        this.timeout = descriptor.timeout;
        /**
         * @type {string}
         */
        this.workflowName = descriptor.workflow_name;
        /**
         * @type {string}
         */
        this.workflowSid = descriptor.workflow_sid;
        /**
         * @type {?import('./TransferDescriptor')}
         */
        this.incomingTransferDescriptor = null;
        /**
         * @type {?import('./TransferDescriptor')}
         */
        this.outgoingTransferDescriptor = null;
        /**
         * @type {string}
         */
        this.version = String(descriptor.version);
        /**
         * @type {string}
         */
        this.virtualStartTime = parseTime(descriptor.virtual_start_time * 1000);
    }
}
