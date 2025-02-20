import isBoolean from 'lodash/isBoolean';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import Configuration from './util/Configuration';
import EventBridgeSignaling from './signaling/EventBridgeSignaling';
import GraphQLSignaling from './signaling/GraphqlSignaling';
import { EventEmitter } from 'events';
import Logger from './util/Logger';
import Request from './util/Request';
import RetryUtil from './util/Retry';
import Routes, { WORKER_INSTANCE, TASK_LIST } from './util/Routes';

import WorkerDescriptor from './descriptors/WorkerDescriptor';
import { API_V1, WORKER_UPDATE_OPTIONS, CREATE_TASK_OPTIONS } from './util/Constants';
import ActivitiesEntity from './data/ActivitiesEntity';
import ChannelsEntity from './data/ChannelsEntity';
import ReservationsEntity from './data/ReservationsEntity';
import { validateOptions, getStatusCodeFromError } from './util/Tools';
import TaskRouterEventHandler from './handlers/TaskRouterEventHandler';

const fieldsToUpdate = [
    'dateUpdated',
    'dateStatusChanged',
    'attributes',
    'name',
    'available',
    'version'
];


/**
 * Construct a {@link Worker}
 * @extends {EventEmitter}
 * @classdesc Create a {@link Worker} client representing a TaskRouter Worker
 * @param {string} token - The string token
 * @param {WorkerOptions} [options]
 * @param {WorkerDeps} [deps]
 * @property {string} accountSid - The sid of the Twilio account
 * @property {Map<string, Activity>} activities - The list of possible states a {@link Worker} can be
 * @property {Activity} activity - The current {@link Activity} of the {@link Worker}
 * @property {string} activitySid - The sid of the {@link Activity} the {@link Worker} is currently in
 * @property {string} activityName - The current {@link Activity} name the {@link Worker} is currently in
 * @property {Record<any,any>} attributes - A JSON representation of the {@link Worker}'s attributes
 * @property {boolean} available - Whether or not the {@link Worker} is available to take on {@link Task}s
 * @property {Map<string, Channel>} channels - The list of available {@link Channel}s
 * @property {string} connectActivitySid - The {@link Activity} to set the {@link Worker} as on connect
 * @property {Date} dateCreated - The date this {@link Worker} was created
 * @property {Date} dateStatusChanged - The date this {@link Worker}'s activity was last changed
 * @property {Date} dateUpdated - The date this {@link Worker} was last updated
 * @property {string} name - The friendly name of the {@link Worker}
 * @property {Map<string, Reservation>} reservations - A list of pending {@link Reservation}s for the {@link Worker}
 * @property {string} sid - The sid of the {@link Worker}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Worker}
 * @property {string} workerSid - The sid of the {@link Worker}, duplicates sid field for backwards compatibility
 * @property {string} workerActivitySid - The sid of the {@link Activity} the {@link Worker} is currently in, duplicates activitySid field for backwards compatibility
 * @property {Date} dateActivityChanged - The date when the {@link Worker}'s state was last changed, duplicates dateStatusChanged field for backwards compatibility
 * @property {string} friendlyName - The friendly name of the {@link Worker}, duplicates name field for backwards compatibility
 * @property {string} version - The version of this {@link Worker}
 * @fires Worker#activityUpdated
 * @fires Worker#attributesUpdated
 * @fires Worker#disconnected
 * @fires Worker#error
 * @fires Worker#ready
 * @fires Worker#reservationCreated
 * @fires Worker#reservationFailed
 * @fires Worker#tokenExpired
 * @fires Worker#tokenUpdated
 */
class Worker extends EventEmitter {
    /**
     * @param {string} token - The string token
     * @param {WorkerOptions} [options]
     * @param {WorkerDeps} [deps]
     */
    constructor(token, options = {}, deps = { Request, EventBridgeSignaling, GraphQLSignaling }) {
        super();

        // check the jwt token
        if (!isString(token)) {
            throw new TypeError('Failed to instantiate Worker. <string>token is a required parameter.');
        }

        // check options and assign defaults if missing
        const types = {
            connectActivitySid: (val) => isString(val),
            closeExistingSessions: (val) => isBoolean(val),
            logLevel: (val) => isString(val),
            ebServer: (val) => isString(val),
            wsServer: (val) => isString(val),
            region: (val) => isString(val),
            enableVersionCheck: (val) => isBoolean(val),
            useGraphQL: (val) => isBoolean(val),
        };

        validateOptions(options, types);

        /**
         * @private
         * @type {string}
         */
        this._connectActivitySid = options.connectActivitySid;
        /**
         * @private
         * @type {boolean}
         */
        this._closeExistingSessions = options.closeExistingSessions;
        /**
         * @private
         * @type {boolean}
         */
        this._useGraphQL = options.useGraphQL || false;
        /**
         * @private
         * @type {string}
         */
        this._logLevel = options.logLevel || 'error';
        /**
         * @private
         * @type {string}
         */
        this._config = new Configuration(token, options);
        /**
         * @private
         * @type {import('./util/Logger')}
         */
        this._log = new Logger(`Worker-${this._config.getLogIdentifier()}`, this._logLevel);
        /**
         * @private
         * @type {import('./util/Request')}
         */
        this._request = new deps.Request(this._config);
        /**
         * @type {{reservationsEntity: ReservationsEntity, channelsEntity: ChannelsEntity, activitiesEntity: ActivitiesEntity}}
         * @private
         */
        this._dataServices = {
            activitiesEntity: new ActivitiesEntity(this, this._request),
            channelsEntity: new ChannelsEntity(this, this._request),
            reservationsEntity: new ReservationsEntity(this, this._request)
        };
        /**
         * @private
         * @type {Routes}
         */
        this._routes = null;
        /**
         * @private
         * @type {number}
         */
        this._connectRetry = 0;
        /**
         * @private
         * @type {GraphQLSignaling}
         */
        if (this._useGraphQL) {
            this._gqlSignaling = new deps.GraphQLSignaling(this, {
                closeExistingSessions: options.closeExistingSessions,
                setWorkerOfflineIfDisconnected: options.setWorkerOfflineIfDisconnected,
            });
        } else {
            /**
             * @private
             * @type {EventBridgeSignaling}
             */
            this._signaling = new deps.EventBridgeSignaling(this, {
                closeExistingSessions: options.closeExistingSessions,
                setWorkerOfflineIfDisconnected: options.setWorkerOfflineIfDisconnected,
            });
        }
        /**
         * @private
         * @type {RetryUtil}
         */
        this.retryUtil = new RetryUtil();

        if (this._useGraphQL) {
            this._subscribeToGQLEvents();
        } else {
            this._subscribeToSignalingEvents();
        }

        let eventHandler;
        if (options.eventHandlerClass) {
            // eslint-disable-next-line new-cap
            eventHandler = new options.eventHandlerClass(this);
        } else {
            eventHandler = new TaskRouterEventHandler(this);
        }

        /**
         * @private
         * @type {TaskRouterEventHandler}
         */
        this.taskRouterEventHandler = eventHandler;
        /**
         * @readonly
         * @type {import('./Activity')}
         */
        this.activity = null;
        /**
         * @readonly
         * @type {string}
         */
        this.accountSid = '';
        /**
         * @readonly
         * @type {Record<any,any>}
         */
        this.attributes = {};
        /**
         * @readonly
         * @type {Date}
         */
        this.dateCreated = null;
        /**
         * @readonly
         * @type {Date}
         */
        this.dateStatusChanged = null;
        /**
         * @readonly
         * @type {Date}
         */
        this.dateUpdated = null;
        /**
         * @readonly
         * @type {string}
         */
        this.name = '';
        /**
         * @readonly
         * @type {string}
         */
        this.sid = '';
        /**
         * @readonly
         * @type {string}
         */
        this.workspaceSid = '';
        /**
         * @type {string}
         */
        this.version = '';
        /**
         * @readonly
         * @type {string}
         */
        this.workerSid = '';
        /**
         * @readonly
         * @type {string}
         */
        this.workerActivitySid = '';
        /**
         * @readonly
         * @type {string}
         */
        this.friendlyName = '';
        /**
         * @readonly
         * @type {Date}
         */
        this.dateActivityChanged = null;
    }


    /**
     * Create a Task
     * @param {string} to - The contact uri of the customer. Stored in the {@link Task}'s attributes as "outbound_to"
     * @param {string} from - The contact uri of the {@link Worker}. Stored in the {@link Task}'s attributes as "from"
     * @param {string} workflowSid - The Sid of the Workflow this Task should belong to
     * @param {string} taskQueueSid - The Sid of the {@link TaskQueue} this Task should belong to, used for reporting
     *     purposes only
     * @param {WorkerTaskOptions} [options]
     * @returns {Promise<string>} - Rejected if unable to create a Task on behalf of the {@link Worker}. Returns the
     *     TaskSid of the created Task.
     */
    createTask(to, from, workflowSid, taskQueueSid, options = {}) {
        if (!isString(to)) {
            throw new TypeError('Error calling method createTask(). <string>to is a required parameter.');
        }

        if (!isString(from)) {
            throw new TypeError('Error calling method createTask(). <string>from is a required parameter.');
        }

        if (!isString(workflowSid)) {
            throw new TypeError('Error calling method createTask(). <string>workflowSid is a required parameter.');
        }

        if (!isString(taskQueueSid)) {
            throw new TypeError('Error calling method createTask(). <string>taskQueueSid is a required parameter.');
        }

        const types = {
            attributes: (val) => isObject(val),
            taskChannelUniqueName: (val) => isString(val),
            taskChannelSid: (val) => isString(val)
        };

        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to create a Task for Worker ${this.sid}. The options passed in did not match the required types.`);
        }

        const requestURL = this.getRoutes().getRoute(TASK_LIST).path;
        const requestParams = {
            WorkflowSid: workflowSid,
            TaskQueueSid: taskQueueSid,
            RoutingTarget: this.sid,
        };

        if (options.virtualStartTime) {
            requestParams.VirtualStartTime = options.virtualStartTime.toISOString().slice(0, 19) + 'Z';
        }

        for (const option in options) {
            if (option === 'attributes' || option === 'virtualStartTime') {
                // attributes and virtualStartTime are handled separately
            } else {
                requestParams[CREATE_TASK_OPTIONS[option]] = options[option];
            }
        }

        // set attributes (required properties in attributes)
        const requiredAttributes = {
            // eslint-disable-next-line camelcase
            outbound_to: to,
            from: from
        };
        requestParams.Attributes = Object.assign({}, options.attributes, requiredAttributes);

        return this._request.post(requestURL, requestParams, API_V1).then(response => {
            return response.sid;
        });
    }

    /**
     * @param {string} prefix
     * @return {Logger}
     */
    getLogger(prefix) {
        return new Logger(`${prefix}-${this.sid}`, this._config._logLevel);
    }

    /**
     * Update attributes
     * @param {Record<any,any>} attributes - A JSON describing the Worker's attributes
     * @returns {Promise<this>} - Rejected if the attributes cannot be set
     */
    setAttributes(attributes) {
        if (!isObject(attributes)) {
            throw new TypeError('Unable to set attributes on Worker. <object>attributes is a required parameter.');
        }

        const requestURL = this.getRoutes().getRoute(WORKER_INSTANCE).path;
        const requestParams = { Attributes: attributes };

        return this._request.post(requestURL, requestParams, API_V1, this.version).then(response => {
            return this._update(response);
        });
    }

    /**
     * bumps the worker version
     */
    _bumpVersion() {
        if (this.version) {
            this.version = String(Number(this.version) + 1);
        }
    }

    /**
     * Update token
     * @param {string} newToken - The new token that should be used for authentication
     * @returns {void} - Emits error if unable to update token
     */
    updateToken(newToken) {
        if (!isString(newToken)) {
            throw new TypeError('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
        }

        this._log.info('Proceeding to update the Worker\'s current active token with a new token.');
        this._log.debug('New token: ' + newToken);

        try {
            this._config.updateToken(newToken);
            if (this._useGraphQL) {
                this._gqlSignaling.updateToken(newToken);
            } else {
                this._signaling.updateToken(newToken);
            }
            this.emit('tokenUpdated');
        } catch (err) {
            this.emit('error', err);
        }
    }

    /**
     * Fetch the last version of this {@link Worker}
     * @returns {Promise<this>}
     */
    fetchLatestVersion() {
        const requestURL = this.getRoutes().getRoute(WORKER_INSTANCE).path;

        return this._request.get(requestURL, API_V1).then(response => {
            return this._update(response);
        });
    }

    /**
     * @private
     */
    _subscribeToSignalingEvents() {
        this._log.info('Subscribing to Signaling events .... ');

        this._signaling.on('connected', () => {
            this._log.info('Received Event: \'connected\' from Signaling layer. Pending initialization.', this.sid);
        });

        this._signaling.on('disconnected', reason  => {
            this._log.info('Received Event: \'disconnected\' from Signaling layer for Worker %s. %s', this.sid, reason);
            this._unSubscribeFromTaskRouterEvents();
            this.emit('disconnected', reason);
        });

        this._signaling.on('init', evt => {
            this._log.info('Received Event: \'init\' from Signaling layer. Proceeding to initialize Worker %s.', evt.channel_id);
            this.sid = evt.channel_id;
            this.accountSid = evt.account_sid;
            this.workspaceSid = evt.workspace_sid;
            this._signaling.setLifetime(evt.token_lifetime);
            this._initialize();
        });

        this._signaling.on('error', err => {
            this._log.info('Received Event: \'error\' from Signaling layer for Worker %s.', this.sid);
            this.emit('error', err);
        });

        this._signaling.on('tokenExpired', () => {
            this._log.info('Received Event: \'tokenExpired\' for for Worker %s. Please update the token. Websocket will not reconnect automatically until token is updated.', this.sid);
            this.emit('tokenExpired');
        });
    }

    /**
     * @private
     */
    _subscribeToGQLEvents() {
        this._log.info('[GQL] Subscribing to Signaling events .... ');

        this._gqlSignaling.on('connected', () => {
            this._log.info('[GQL] Received Event: \'connected\' from Signaling layer. Pending initialization.', this.sid);
        });

        this._gqlSignaling.on('disconnected', reason  => {
            this._log.info('[GQL] Received Event: \'disconnected\' from Signaling layer for Worker %s. %s', this.sid, reason);
            this._unSubscribeFromTaskRouterEvents();
            this.emit('disconnected', reason);
        });

        this._gqlSignaling.on('init', evt => {
            this._log.info('[GQL] Received Event: \'init\' from Signaling layer. Proceeding to initialize Worker %s.', evt.channel_id);
            this.sid = evt.channel_id;
            this.accountSid = evt.account_sid;
            this.workspaceSid = evt.workspace_sid;
            // Check if we need this: this._gqlSignaling.setLifetime(evt.token_lifetime);
            this._initialize();
        });

        this._gqlSignaling.on('error', err => {
            this._log.info('[GQL] Received Event: \'error\' from Signaling layer for Worker %s.', this.sid);
            this.emit('error', err);
        });

        this._gqlSignaling.on('tokenExpired', () => {
            this._log.info('[GQL] Received Event: \'tokenExpired\' for for Worker %s. Please update the token. Websocket will not reconnect automatically until token is updated.', this.sid);
            this.emit('tokenExpired');
        });
    }

    /**
     * @private
     */
    _subscribeToTaskRouterEvents() {
        this._log.info('Subscribing to TaskRouter events ... ');
        for (let [eventName, eventHandler] of Object.entries(this.taskRouterEventHandler.getTREventsToHandlerMapping())) {
            if (this._useGraphQL) {
                this._gqlSignaling.on(eventName, this.taskRouterEventHandler[eventHandler]);
            } else {
                this._signaling.on(eventName, this.taskRouterEventHandler[eventHandler]);
            }
        }
    }


    /**
     * @private
     */
    _unSubscribeFromTaskRouterEvents() {
        this._log.info('Unsubscribing from TaskRouter events ... ');
        for (let [eventName, eventHandler] of Object.entries(this.taskRouterEventHandler.getTREventsToHandlerMapping())) {
            if (this._useGraphQL) {
                this._gqlSignaling.removeListener(eventName, this.taskRouterEventHandler[eventHandler]);
            } else {
                this._signaling.removeListener(eventName, this.taskRouterEventHandler[eventHandler]);
            }
        }
    }


    /**
     * @private
     */
    _initialize() {
        this._routes = new Routes(this.workspaceSid, this.sid);
        this._log.info('Initializing Worker %s...', this.sid);
        const requestURL = this.getRoutes().getRoute(WORKER_INSTANCE).path;

        let currentActivitySid;

        this._request.get(requestURL, API_V1).then(response => {
            const workerDescriptor = new WorkerDescriptor(response);
            currentActivitySid = workerDescriptor.activitySid;

            delete workerDescriptor.activityName;
            delete workerDescriptor.activitySid;
            delete workerDescriptor.available;

            this.accountSid = workerDescriptor.accountSid;
            this.attributes = workerDescriptor.attributes;
            this.dateCreated = workerDescriptor.dateCreated;
            this.dateStatusChanged = workerDescriptor.dateStatusChanged;
            this.dateUpdated = workerDescriptor.dateUpdated;
            this.name = workerDescriptor.name;
            this.sid = workerDescriptor.sid;
            this.workspaceSid = workerDescriptor.workspaceSid;
            this.version = workerDescriptor.version;
            this.workerSid = workerDescriptor.workerSid;
            this.workerActivitySid = workerDescriptor.workerActivitySid;
            this.dateActivityChanged = workerDescriptor.dateActivityChanged;
            this.friendlyName = workerDescriptor.friendlyName;

            Object.assign(this, workerDescriptor);

            return Promise.all([
                this._dataServices.activitiesEntity.fetchActivities(),
                this._dataServices.channelsEntity.fetchChannels(),
                this._dataServices.reservationsEntity.fetchReservations()
            ]);
        }).then(() => {
            this._log.info('Worker %s activities, channels and pending reservations initialized', this.sid);

            // set the current activity of the Worker
            this._setCurrentActivity(currentActivitySid);
            if (this._connectActivitySid) {
                this._setWorkerConnectActivity().then(() => {
                    this._log.info('Successfully updated Worker on connect to Activity=%s', this._connectActivitySid);
                    this._log.info('Worker %s successfully initialized', this.sid);
                });
            } else {
                this._log.info('Worker %s successfully initialized', this.sid);
            }

            this._subscribeToTaskRouterEvents();
            this.emit('ready', this);
        }).catch(err => {
            this._log.error('Failed to initialize Worker %s. Error: %s', this.sid, err);
            this.emit('error', new Error(`Failed to initialize Worker ${this.sid}`));
        });
    }

    /**
     * @return {Map<string, import('./Channel')>}
     */
    get channels() {
        return this._dataServices.channelsEntity.channels;
    }

    /**
     * @return {Map<string, import('./Activity')>}
     */
    get activities() {
        return this._dataServices.activitiesEntity.activities;
    }

    /**
     * @return {Map<string, import('./Reservation')>}
     */
    get reservations() {
        return this._dataServices.reservationsEntity.reservations;
    }

    /**
     * Helper function to update the activity property on a Worker
     * @param {string} activitySid - The activity sid to update to
     * @private
     */
    _setCurrentActivity(activitySid) {
        const selectedActivity = this.activities.get(activitySid);
        if (selectedActivity) {
            selectedActivity._isCurrent = true;
            this.activity = selectedActivity;
            this.activity._isCurrent = true;
        } else {
            throw new Error(`Unable to set the current Activity sid=${activitySid} on the Worker.`);
        }
    }

    /**
     * A helper function used to set the Activity of the Worker upon a successful websocket connect
     * @private
     */
    _setWorkerConnectActivity() {
        if (!isString(this._connectActivitySid)) {
            throw new TypeError('Failed to set the Worker\'s activity to the provided optional connectActivitySid. <string>connectActivitySid must be a string.');
        }

        return this._updateWorkerActivity(this._connectActivitySid).then(() => {
            this._log.info('Successfully set the Worker\'s activity to the provided connectActivitySid=%s on connection.', this._connectActivitySid);
            this._connectRetry = 0;

            return this;
        }).catch(err => {
            let status = getStatusCodeFromError(err);
            /**
             * 400 - bad parsing of json - throw error to user
             * 401 - JWT expiration; send a message to generate a new one - throw error to user
             * 403 - JWT verification problem - invalid jwt or policy access issue - throw error to user
             * 404 - invalid endpoint - throw error to user
             * 429 - Too many requests (rate limit exceeded)
             * 500 - issues with account service or API; after retries, throw error to user
             * 502 - Bad gateway server
             * 503 - Service unavailable
             * 504 - Gateway timedout
             */
            if (this._connectRetry >= 3 || ![0, 429, 500, 502, 503, 504].includes(status)) {
                this._log.error('Unable to set Worker %s activity to the provided %s on successful connection. %s', this.sid, this._connectActivitySid, err);
                throw err;
            } else {
                this._connectRetry = this._connectRetry > 0 ? this._connectRetry + 1 : 1;
                return this.retryUtil.whenReady(this._connectRetry).then((backoffTime) => {
                    this._log.info(`Retrying Update Worker Activity after backoff time: ${backoffTime}ms for retryCount: ${this._connectRetry}`);
                    return this._setWorkerConnectActivity.bind(this)();
                });
            }
        });
    }

    /**
     * A private function used to change the Worker's activity.
     * Initiated only when an setAsCurrent() is called on an Activity.
     * @param {string} activitySid - The sid of the {@link Activity} to update to
     * @returns {Promise<this>}
     * @private
     */
    _updateWorkerActivity(activitySid, options = {}) {
        if (!isString(activitySid)) {
            throw new TypeError('Error updating Worker Activity: <string>activitySid is a required parameter');
        }

        const requestURL = this.getRoutes().getRoute(WORKER_INSTANCE).path;
        const requestParam = { ActivitySid: activitySid };

        for (const option in options) {
            requestParam[WORKER_UPDATE_OPTIONS[option]] = options[option];
        }

        return this._request.post(requestURL, requestParam, API_V1, this.version).then(response => {
            try {
                this._update(response);
                this.activity._isCurrent = false;
                const newActivity = this.activities.get(response.activity_sid);
                this.activity = newActivity;
                this.activity._isCurrent = true;
            } catch (err) {
                this._log.error('Failed to update the Worker\'s activity to sid=%s. Error: %s', activitySid, err);
                throw err;
            }
            return this;
        });
    }

    /**
     * Update this Worker with the given raw data
     * @param {Object} latestWorkerData - The worker data to update
     * @private
     */
    _update(latestWorkerData) {
        this._log.trace('Attempting to update Worker %s with latest Worker data=%s', this.sid, JSON.stringify(latestWorkerData));
        try {
            const updatedWorkerDescriptor = new WorkerDescriptor(latestWorkerData);
            fieldsToUpdate.forEach(field => {
                this[field] = updatedWorkerDescriptor[field];
            });
        } catch (err) {
            this._log.error('Failed to update Worker sid=%s. Update aborted. Error: %s.', latestWorkerData.sid, err);
        }
        return this;
    }

    /**
     * Gracefully disconnect the client.
     * @returns {void}
     */
    disconnect() {
        if (this._useGraphQL) {
            this._gqlSignaling.disconnect();
        } else {
            this._signaling.disconnect();
        }
    }

    /**
     * @return {Routes}
     */
    getRoutes() {
        return this._routes;
    }
}

export const WorkerProperties = [
    'account_sid',
    'activity_name',
    'activity_sid',
    'attributes',
    'available',
    'date_created',
    'date_status_changed',
    'date_updated',
    'friendly_name',
    'sid',
    'workspace_sid',
    'version'
];

export default Worker;

/**
 * {@link Worker} activity has updated
 * @event Worker#activityUpdated
 * @param {Worker} worker - The updated {@link Worker}
 */

/**
 * {@link Worker} attributes have updated
 * @event Worker#attributesUpdated
 * @param {Worker} worker - The updated {@link Worker}
 */

/**
 * The signaling layer has lost the websocket connection
 * @event Worker#disconnected
 * @param {Object} reason - The reason the {@link Worker} websocket disconnected
 */

/**
 * An error has occurred
 * @event Worker#error
 * @param {Error} error - The Error that occurred
 */

/**
 * {@link Worker} is ready to listen for events and take action
 * @event Worker#ready
 */

/**
 * A {@link Reservation} has been created for the {@link Worker}
 * @event Worker#reservationCreated
 * @param {Reservation} reservation - The created {@link Reservation}
 */

/**
 * {@link Worker} was unable to receive a {@link Reservation} for the {@link Task} it created
 * @event Worker#reservationFailed
 * @param {Object} task - The raw Task-like payload that failed to generate a Reservation
 */

/**
 * The {@link Worker} token has expired
 * @event Worker#tokenExpired
 */

/**
 * The {@link Worker} token has successfully updated
 * @event Worker#tokenUpdated
 */

/**
 * @typedef {Object} WorkerOptions
 * @property {string} [connectActivitySid=''] - The {@link Activity} state of the Worker upon connect
 * @property {boolean} [closeExistingSessions=false] - - Whether other open sessions of this {@link Worker}
 *   should be terminated
 * @property {boolean} [setWorkerOfflineIfDisconnected=true] - A boolean defining whether if {@link Worker} availability set as Offline when the connection is terminated
 * @property {string} [logLevel='error'] - The level of logging to enable
 *   ['error', 'warn', 'info', 'debug', 'trace', 'silent']
 * @property {string} [region] - the realm for connections (ex. "stage-us1")
 * @property {boolean} [enableVersionCheck=false] - To avoid accidentally overwriting objects with outdated data
 * @property {boolean} [useGraphQL=false] - Subscribe to worker events using GraphQL subscriptions
 */

/**
 * @typedef {Object} WorkerDeps
 * @property {Request} Request
 * @property {EventBridgeSignaling} EventBridgeSignaling
 * @property {GraphQLSignaling} [GraphQLSignaling=undefined]
 */

/**
 * @typedef {Object} WorkerTaskOptions
 * @property {Record<any,any>} [attributes=null] - Additional attributes for the {@link Task}
 * @property {string} [taskChannelUniqueName=null] - The friendly name of the {@link Channel} this {@link Task}
 *     belongs to. If not provided, defaults to 'default' channel.
 * @property {string} [taskChannelSid=null] - The Sid of the {@link Channel} this {@link Task} belongs to. If not
 *     provided, defaults to 'default' channel.
 * @property {Date} [virtualStartTime=null] - Optional manually set starting time of the {@link Task}, in cases where
 *     the interaction between the customer and agents spans across multiple tasks. If not
 *     provided, defaults to dateCreated.
 */
