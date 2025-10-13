/**
 * @typedef {Object} WorkspaceOptions
 * @property {string} [region] - the realm for connections (ex. "stage-us1")
 * @property {number} [pageSize] - The number of items returned in each request
 * @property {string} [logLevel='error'] - The level of logging to enable
 *   ['error', 'warn', 'info', 'debug', 'trace', 'silent']
 */

/**
 * @deprecated
 * @typedef {Object} FetchWorkersParams
 * @property {string} [AfterSid]
 * @property {string} [FriendlyName]
 * @property {string} [ActivitySid]
 * @property {string} [ActivityName]
 * @property {string} [TargetWorkersExpression]
 * @property {"DateStatusChanged:asc" | "DateStatusChanged:desc"} [Ordering]
 * @property {number} [MaxWorkers]
 */

/**
 * @typedef {FetchWorkersParams} FetchWorkerInfoParams
 */

/**
 * @typedef {Object} FetchTaskQueuesParams
 * @property {string} [AfterSid]
 * @property {string} [FriendlyName]
 * @property {"DateUpdated:asc" | "DateUpdated:desc"} [Ordering]
 * @property {string} [WorkerSid]
 */


/**
 * @typedef {Object} WorkerInfo
 * @property {string} accountSid - The SID of the owning account of the Worker
 * @property {string} activityName - The name of the current activity
 * @property {string} activitySid - The SID of the current activity
 * @property {Object} attributes - Custom attributes describing the Worker
 * @property {boolean} available - Whether the Worker is available to take on Tasks
 * @property {Date} dateCreated - When the Worker was created
 * @property {Date} dateStatusChanged - When the Worker’s state last changed
 * @property {Date} dateUpdated - When the Worker was last updated
 * @property {string} name - The friendly name of the Worker
 * @property {string} sid - The SID of the Worker
 * @property {string} workspaceSid - The SID of the Workspace the Worker belongs to
 * @property {string} version - The version of this Worker
 * @property {string} workerSid - [Duplicate] sid of the Worker
 * @property {string} workerActivitySid - [Duplicate] activitySid of the Worker
 * @property {Date} dateActivityChanged - [Duplicate] dateStatusChanged of the Worker
 * @property {string} friendlyName - [Duplicate] name of the Worker
 */
