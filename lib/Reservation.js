import isBoolean from 'lodash/isBoolean';
import isInteger from 'lodash/isInteger';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import upperFirst from 'lodash/upperFirst';
import { API_V1,
    API_V2,
    RESERVATION_STATUS_ACCEPTED,
    RESERVATION_STATUS_COMPLETED,
    RESERVATION_STATUS_REJECTED,
    RESERVATION_STATUS_WRAPPING,
    RESERVATION_INSTRUCTION_CALL,
    RESERVATION_INSTRUCTION_REDIRECT,
    RESERVATION_INSTRUCTION_DEQUEUE,
    RESERVATION_INSTRUCTION_CONFERENCE,
    RESERVATION_REJECT_OPTIONS,
    RESERVATION_CALL_OPTIONS,
    RESERVATION_DEQUEUE_OPTIONS,
    RESERVATION_REDIRECT_OPTIONS,
} from './util/Constants';

import { EventEmitter } from 'events';
import ReservationDescriptor from './descriptors/ReservationDescriptor';
import { RESERVATION_INSTANCE, WORKER_PARTICIPANT_INSTANCE } from './util/Routes';
import Task from './Task';
import IncomingTransfer from './core/transfer/IncomingTransfer';
import Worker from './Worker';

const validateOptions = require('./util/Tools').validateOptions;
const fieldsToUpdate = [
    'dateUpdated',
    'canceledReasonCode',
    'status',
    'timeout',
    'task',
    'task_transfer',
    'version'
];

const ignoredProperties = [
    'reservation_timeout',
    'task',
    'canceled_reason_code'
];


/**
 * Construct a {@link Reservation}.
 * @extends {EventEmitter}
 * @classdesc A {@link Reservation} correlates a {@link Task} and a {@link Worker}
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {ReservationDescriptor} descriptor - The data descriptor which describes this {@link Reservation}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {Date} dateCreated - The date the {@link Reservation} was created
 * @property {Date} dateUpdated - The date the {@link Reservation} was last updated
 * @property {number} [canceledReasonCode] - The reason code received when {@link Reservation} is canceled
 * @property {string} sid - The sid of the {@link Reservation}
 * @property {string} status - The current state of the {@link Reservation}.
 *      Options: ['pending', 'accepted', 'rejected', 'timeout', 'canceled', 'rescinded', 'wrapping', 'completed'].
 * @property {Task} [task] - The {@link Task} tied to the {@link Reservation}
 * @property {IncomingTransfer} [transfer] - the {@link IncomingTransfer} tied to the {@link Reservation}
 * @property {number} timeout - The number of seconds until the {@link Task} times out
 * @property {string} workerSid - The sid of the {@link Worker}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Reservation}
 * @property {string} version - The version of this {@link Reservation}
 * @fires Reservation#accepted
 * @fires Reservation#canceled
 * @fires Reservation#completed
 * @fires Reservation#rejected
 * @fires Reservation#rescinded
 * @fires Reservation#timeout
 * @fires Reservation#wrapup
 */
class Reservation extends EventEmitter {
    /**
     * @param {import('./Worker')} worker
     * @param {import('./util/Request')} request
     * @param {ReservationDescriptor} descriptor
     */
    constructor(worker, request, descriptor) {
        super();

        if (!(worker instanceof Worker)) {
            throw new TypeError('Failed to instantiate Reservation. <Worker>worker is a required parameter.');
        }
        if (!(descriptor instanceof ReservationDescriptor)) {
            throw new TypeError('Failed to instantiate Reservation. <ReservationDescriptor>descriptor is a required parameter.');
        }

        /**
         * @private
         * @type {import('./Worker')}
         */
        this._worker = worker;
        /**
         * @private
         * @type {import('./util/Logger')}
         */
        this._log = worker.getLogger(`Reservation-${descriptor.sid}`);
        /**
         * @private
         * @type {import('./util/Request')}
         */
        this._request = request;

        /**
         * @readonly
         * @type {Task | {}}
         */
        this.task = this._createTask(descriptor);
        if (descriptor.transferDescriptor) {
            /**
             * @readonly
             * @type {IncomingTransfer | {}}
             */
          this.transfer = this._createTransfer(descriptor);
        }


        /**
         * @readonly
         * @type {string}
         */
        this.accountSid = descriptor.accountSid;
        /**
         * @readonly
         * @type {Date}
         */
        this.dateCreated = descriptor.dateCreated;
        /**
         * @readonly
         * @type {Date}
         */
        this.dateUpdated = descriptor.dateUpdated;
        /**
         * @readonly
         * @type {string}
         */
        this.sid = descriptor.sid;
        /**
         * @readonly
         * @type {"pending" | "accepted" | "rejected" | "timeout" | "canceled" | "rescinded" | "wrapping" | "completed"}
         */
        this.status = descriptor.status;
        /**
         * @readonly
         * @type {number}
         */
        this.timeout = descriptor.timeout;
        /**
         * @readonly
         * @type {string}
         */
        this.workerSid = descriptor.workerSid;
        /**
         * @readonly
         * @type {string}
         */
        this.workspaceSid = descriptor.workspaceSid;
        /**
         * @readonly
         * @type {string}
         */
        this.version = descriptor.version;

        if (descriptor.canceledReasonCode) {
            /**
             * @readonly
             * @type {number | undefined}
             */
            this.canceledReasonCode = descriptor.canceledReasonCode;
        }


        Object.assign(this, descriptor);

        // taskDescriptor and transferDescriptor properties should not be defined on the Reservation
        delete this.taskDescriptor;
        delete this.transferDescriptor;
    }

    /**
     * Accept the {@link Reservation}
     * @returns {Promise<this>} - Rejected if unable to issue Accept instruction on the {@link Reservation}
     */
    accept() {
        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const requestParams = { ReservationStatus: RESERVATION_STATUS_ACCEPTED };

        return this._request.post(requestURL, requestParams, API_V1, this.version).then(response => {
            return this._update(response, ignoredProperties);
        });
    }

    /**
     * Complete the {@link Reservation}
     * @returns {Promise<this>} - Rejected if unable to issue Complete instruction on the {@link Reservation}
     */
    complete() {
        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const requestParams = { ReservationStatus: RESERVATION_STATUS_COMPLETED };

        return this._request.post(requestURL, requestParams, API_V1, this.version).then(response => {
            return this._update(response, ignoredProperties);
        });
    }

    /**
     * Reject the {@link Reservation}
     * @param {RejectOptions} [options]
     * @returns {Promise<this>} - Rejected if unable to issue Reject instruction on the {@link Reservation}
     */
    reject(options = {}) {
        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const requestParam = {
            ReservationStatus: RESERVATION_STATUS_REJECTED,
        };

        // validate the provided options
        const types = { activitySid: (val) => isString(val) };
        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to issue Instruction:reject on Reservation sid=${this.sid}. The options passed in did not match the required types.`);
        }

        for (const option in options) {
            requestParam[RESERVATION_REJECT_OPTIONS[option]] = options[option];
        }

        return this._request.post(requestURL, requestParam, API_V1, this.version).then(response => {
            return this._update(response, ignoredProperties);
        });
    }

    /**
     * Wrap the {@link Reservation}
     * @returns {Promise<this>} - Rejected if unable to issue Wrap instruction on the {@link Reservation}
     */
    wrap() {
        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const requestParams = { ReservationStatus: RESERVATION_STATUS_WRAPPING };

        return this._request.post(requestURL, requestParams, API_V1, this.version).then(response => {
            return this._update(response, ignoredProperties);
        });
    }

    /**
     * Issue a Call to a {@link Worker}
     * @param {string} from - The caller id for the call to a {@link Worker}
     * @param {string} url - A valid TwiML URI that is executed on the answering Worker's leg
     * @param {CallOptions} [options]
     * @returns {Promise<this>} - Rejected if unable to issue Call instruction on the {@link Reservation}
     */
    call(from, url, options = {}) {
        if (!isString(from)) {
            throw new TypeError('Error calling method call(). <string>from is a required parameter.');
        }

        if (!isString(url)) {
            throw new TypeError('Error calling method call(). <string>url is a required parameter.');
        }

        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const requestParams = {
            Instruction: RESERVATION_INSTRUCTION_CALL,
            CallFrom: from,
            CallUrl: url,
        };
        const types = {
            accept: (val) => isBoolean(val),
            record: (val) => isString(val),
            statusCallbackUrl: (val) => isString(val),
            timeout: (val) => isInteger(val),
            to: (val) => isString(val)
        };

        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to issue Instruction:call on Reservation sid=${this.sid}. The options passed in did not match the required types.`);
        }

        for (const option in options) {
            requestParams[RESERVATION_CALL_OPTIONS[option]] = options[option];
        }

        return this._request.post(requestURL, requestParams, API_V1).then(response => {
            return this._update(response, ignoredProperties);
        });
    }

    /**
     * Dequeue the {@link Reservation} to the {@link Worker}. This will perform telephony to dequeue a
     *   {@link Task} that was enqueued using the Enqueue TwiML verb. A contact_uri must exist
     *   in the {@link Worker}'s attributes for this call to go through.
     * @param {DequeueOptions} [options]
     * @returns {Promise<this>} - Rejected if unable to issue Dequeue instruction on the {@link Reservation}
     */
    dequeue(options = {}) {
        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const requestParams = {
            Instruction: RESERVATION_INSTRUCTION_DEQUEUE,
        };

        const types = {
            from: (val) => isString(val),
            to: (val) => isString(val),
            postWorkActivitySid: (val) => isString(val),
            record: (val) => isString(val),
            timeout: (val) => isInteger(val),
            statusCallbackUrl: (val) => isString(val),
            statusCallbackEvents: (val) => isString(val)
        };

        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to issue Instruction:dequeue on Reservation sid=${this.sid}. The options passed in did not match the required types.`);
        }

        for (const option in options) {
            requestParams[RESERVATION_DEQUEUE_OPTIONS[option]] = options[option];
        }

        return this._request.post(requestURL, requestParams, API_V1).then(response => {
            return this._update(response, ignoredProperties);
        });
    }
    /**
     * Redirect the active Call tied to this {@link Reservation}
     * @param {string} callSid - The sid of the Call to redirect
     * @param {string} url - A valid TwiML URI that is executed on the Caller's leg upon redirecting
     * @param {RedirectOptions} [options]
     * @returns {Promise<this>} - Rejected if unable to issue Redirect instruction on the {@link Reservation}
     */
    redirect(callSid, url, options = {}) {
        if (!isString(callSid)) {
            throw new TypeError('Error calling method redirect(). <string>callSid is a required parameter.');
        }
        if (!isString(url)) {
            throw new TypeError('Error calling method redirect(). <string>url is a required parameter.');
        }

        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const types = { accept: (val) => isBoolean(val) };
        const requestParams = {
            Instruction: RESERVATION_INSTRUCTION_REDIRECT,
            RedirectCallSid: callSid,
            RedirectUrl: url,
        };

        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to issue Instruction:redirect on Reservation sid=${this.sid}. The options passed in did not match the required types.`);
        }

        for (const option in options) {
            requestParams[RESERVATION_REDIRECT_OPTIONS[option]] = options[option];
        }

        return this._request.post(requestURL, requestParams, API_V1).then(response => {
            return this._update(response, ignoredProperties);
        });
    }

    /**
     * Conference the active Call tied to this {@link Reservation} to the {@link Worker}
     * @param {ConferenceOptions} [options]
     * @returns {Promise<this>} - Rejected if unable to issue Conference instruction on the link {@link Reservation}
     */
    conference(options = {}) {
        const types = {
            to: (val) => isString(val),
            from: (val) => isString(val),
            timeout: (val) => isInteger(val),
            statusCallback: (val) => isString(val),
            statusCallbackMethod: (val) => isString(val),
            statusCallbackEvent: (val) => isString(val),
            record: (val) => isString(val),
            muted: (val) => isBoolean(val),
            beep: (val) => isBoolean(val) || isString(val),
            startConferenceOnEnter: (val) => isBoolean(val),
            endConferenceOnExit: (val) => isBoolean(val),
            endConferenceOnCustomerExit: (val) => isBoolean(val),
            waitUrl: (val) => isString(val),
            waitMethod: (val) => isString(val),
            earlyMedia: (val) => isBoolean(val),
            maxParticipants: (val) => isInteger(val),
            conferenceStatusCallback: (val) => isString(val),
            conferenceStatusCallbackMethod: (val) => isString(val),
            conferenceStatusCallbackEvent: (val) => isString(val),
            conferenceRecord: (val) => isBoolean(val) || isString(val),
            conferenceTrim: (val) => isString(val),
            recordingChannels: (val) => isString(val),
            recordingStatusCallback: (val) => isString(val),
            recordingStatusCallbackMethod: (val) => isString(val),
            conferenceRecordingStatusCallback: (val) => isString(val),
            conferenceRecordingStatusCallbackMethod: (val) => isString(val),
            region: (val) => isString(val),
            sipAuthUsername: (val) => isString(val),
            sipAuthPassword: (val) => isString(val),
            transcribe: (val) => isBoolean(val),
            transcriptionConfiguration: (val) => isString(val)
        };

        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to issue Instruction:conference on Reservation sid=${this.sid}. The options passed in did not match the required types.`);
        }

        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;
        const requestParams = {
            Instruction: RESERVATION_INSTRUCTION_CONFERENCE,
        };
        for (const option in options) {
            requestParams[upperFirst(option)] = options[option];
        }

        return this._request.post(requestURL, requestParams, API_V1).then(() => this);
    }

    /**
     * Update the {@link Worker}'s leg in the Conference associated to this {@link Reservation}
     * @param {ReservationParticipantOptions} options
     * @returns {Promise<this>} - Rejected if unable to update the Worker's leg in the Conference tied to the {@link Reservation}
     */
    updateParticipant(options) {
        const types = {
            endConferenceOnExit: (val) => isBoolean(val),
            mute: (val) => isBoolean(val),
            beepOnExit: (val) => isBoolean(val)
        };

        if (!validateOptions(options, types)) {
            throw new TypeError(`Failed to update Worker Participant tied to Reservation sid=${this.sid}. The options passed in did not match the required types.`);
        }

        const requestURL = this._worker.getRoutes().getRoute(WORKER_PARTICIPANT_INSTANCE).path;

        const requestParams = {
            ReservationSid: this.sid
        };

        for (const option in options) {
            requestParams[upperFirst(option)] = options[option];
        }

        return this._request.post(requestURL, requestParams, API_V2).then(() => this);
    }

    /**
     * Fetch the last version of this {@link Reservation}
     * @returns {Promise<Reservation>}
     */
     fetchLatestVersion() {
        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_INSTANCE, this.sid).path;

        return this._request.get(requestURL, API_V1).then(response => {
            return this._update(response);
        });
    }

    /**
     * Create a Task for the Reservation
     * @param {ReservationDescriptor} reservationDescriptor - The {@link ReservationDescriptor} that
     * describes the {@link Reservation}
     * @private
     */
    _createTask(reservationDescriptor) {
        if (!(reservationDescriptor instanceof ReservationDescriptor)) {
            this._log.error(`Error calling method _createTask() for Reservation \
                             sid=${this.sid}. <ReservationDescriptor>reservationDescriptor \
                             is a required parameter.`);
            return {};
        }
        const taskDescriptor = reservationDescriptor.taskDescriptor;
        try {
            return new Task(this._worker, this._request, reservationDescriptor.sid, taskDescriptor);
        } catch (err) {
            this._log.error(`Failed to create a Task for Reservation sid=${this.sid}. Error: ${err}`);
            return {};
        }
    }

    /**
     * Create a Transfer for the Reservation
     * @param {ReservationDescriptor} reservationDescriptor - The {@link ReservationDescriptor} that
     * describes the {@link Reservation}
     * @private
     */
    _createTransfer(reservationDescriptor) {
        if (!(reservationDescriptor instanceof ReservationDescriptor)) {
            this._log.error(`Error calling method _createTransfer() for Reservation \
                             sid=${this.sid}. <ReservationDescriptor>reservationDescriptor \
                             is a required parameter.`);
            return {};
        }

        const transferDescriptor = reservationDescriptor.transferDescriptor;

        try {
            return new IncomingTransfer(this._worker, transferDescriptor);
        } catch (err) {
            this._log.error(`Failed to create a Transfer for Reservation sid=${this.sid}. Error: ${err}`);
            return {};
        }
    }

    /**
     * Update this using the latest {@link Reservation} data
     * @param {Object} latestReservationData - The raw reservation data
     * @param {Array | []} ignoredProperties
     * @private
     */
    _update(latestReservationData, ignoredProperties = []) {
        try {
            const updatedReservationDescriptor = new ReservationDescriptor(latestReservationData, this._worker, ignoredProperties);
            fieldsToUpdate.forEach(field => {
                // update all fields; 'task' is a special case
                if (field === 'task') {
                    // occurs on a broadcasted ReservationTask event
                    if (ignoredProperties.indexOf('task') === -1) {
                        // when updating the Task, the incoming/outgoing transfers on the Task should also be updated
                        // task_transfer + active_outgoing_task_transfer only exist on the reservation event if it does indeed have a transfer asscoiated to it
                        const incoming = latestReservationData.task_transfer;
                        const outgoing = latestReservationData.active_outgoing_task_transfer;
                        // update the nested Task
                        this.task._update(latestReservationData.task, { incoming, outgoing });
                    } else {
                        // ignore Task property on API response
                        // do nothing
                    }
                } else if (field === 'canceledReasonCode') {
                    // occurs on a broadcasted ReservationCanceled event.
                    // canceled_reason_code only exists on reservation event if reservation was canceled with a reason code.
                    if (ignoredProperties.indexOf('canceled_reason_code') === -1 && latestReservationData.canceled_reason_code) {
                        this[field] = updatedReservationDescriptor[field];
                    }
                } else if (field === 'task_transfer' && latestReservationData.task_transfer) {
                    this.transfer._update(latestReservationData.task_transfer);
                } else {
                    this[field] = updatedReservationDescriptor[field];
                }
            });
        } catch (err) {
            this._log.error(`Failed to update Reservation sid=${latestReservationData.sid}. Update aborted. Error: ${err}.`);
            throw err;
        }

        return this;
    }

    /**
     * Emit events from this {@link Reservation}
     * @param {string} eventType - The event to emit
     * @param {Object} rawEventData - The eventData associated to the event
     * @private
     */
    _emitEvent(eventType, rawEventData) {
        if (!isString(eventType)) {
            throw new TypeError('Error calling _emitEvent(). <string>eventType is a required parameter.');
        }

        if (!isObject(rawEventData)) {
            throw new TypeError('Error calling method _emitEvent(). <object>rawEventData is a required parameter.');
        }

        this._update(rawEventData);
        this.emit(eventType, this);
    }
}

/**
 * Fired when a {@link Reservation} has been accepted for this {@link Worker}
 *
 * @event Reservation#accepted
 * @param {Reservation} reservation - The accepted {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been rejected for this {@link Worker}
 *
 * @event Reservation#rejected
 * @param {Reservation} reservation - The rejected {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been canceled for this {@link Worker}
 *
 * @event Reservation#canceled
 * @param {Reservation} reservation - The canceled {@link Reservation}
 */

 /**
 * Fired when an accepted {@link Reservation} has been completed for this {@link Worker}
 *
 * @event Reservation#completed
 * @param {Reservation} reservation - The completed {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been timed out for this {@link Worker}
 *
 * @event Reservation#timeout
 * @param {Reservation} reservation - The timed out {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been rescinded for the {@link Worker}
 * @event Reservation#rescinded
 * @param {Reservation} reservation - The rescinded {@link Reservation}
 */

 /**
  * Fired when a {@link Reservation} has been wrapped up for the {@link Worker}
  * @event Reservation#wrapup
  * @param {Reservation} reservation - The wrapped up {@link Reservation}
  */

export const ReservationProperties = [
    'account_sid',
    'date_created',
    'date_updated',
    'reservation_status',
    'sid',
    'task',
    'reservation_timeout',
    'worker_sid',
    'workspace_sid',
    'version'
];

export default Reservation;


/**
 * @typedef {Object} RejectOptions
 * @property {string} activitySid - The sid of the {@link Activity} to update the worker to
 *   upon rejecting the {@link Reservation}
 */

/**
 * @typedef {Object} CallOptions
 * @property {boolean} [accept=false] - Represents whether the {@link Task} should be
 *   accepted before initiating the call
 * @property {string} [record='do-not-record'] - To record the call or not
 * @property {string} [statusCallbackUrl=null] - A valid status status callback url
 * @property {string} [to=null] - The number or endpoint that should be called.
 *   If not provided, the contact_uri defined in the {@link Worker} attributes will be used
 * @property {number} [timeout=60] - The integer number of seconds Twilio should allow the phone associated to "contact_uri" to ring
 */

/**
 * @typedef {Object} DequeueOptions
 * @property {string} [from=null] - The caller id for the call to the {@link Worker}.
 *   Must be a verified Twilio number.
 * @property {string} [to=null] - The contact uri of the {@link Worker}; can be a phone
 *   number or a client ID. Required, if no contact_uri on the {@link Worker}'s attributes.
 * @property {string} [postWorkActivitySid=null] - The activitySid to update the
 *   {@link Worker} to after dequeuing the {@link Reservation}.
 * @property {string} [record='do-not-record'] - Defines which legs of the call
 *   should be recorded.
 * @property {number} [timeout=60] - The integer number of seconds that
 *   Twilio should allow the call to ring before assuming there is no answer.
 * @property {string} [statusCallbackUrl=null] - A URL that Twilio will send
 *   asynchronous webhook this._request. to on a completed call event.
 * @property {string} [statusCallbackEvents=null] - A comma separated string of the events to subscribe to
 */

/**
 * @typedef {Object} RedirectOptions
 * @property {boolean} [accept=false] - Represents whether the {@link Task} should be
 *   accepted before initiating the call
 */

/**
 * @typedef {Object} ConferenceOptions
 * @property {string} [to=null] - The contact uri of the {@link Worker}; can be a phone
 *   number or a client ID. Required, if no contact_uri on the {@link Worker}'s attributes.
 * @property {string} [from=null] - The caller id for the call to the {@link Worker}.
 *   Must be a verified Twilio number.
 * @property {number} [timeout=60] - The integer number of seconds that
 *   Twilio should allow the call to ring before assuming there is no answer.
 * @property {string} [statusCallback=null] - The URL endpoint to receive call status events of the Worker leg.
 * @property {string} [statusCallbackMethod='POST'] - The HTTP method for the Status Callback URL.
 * @property {string} [statusCallbackEvent='completed'] - A comma separated list of events to subscribe to.
 *   The possible list of events are: ['initiated', 'ringing', 'answered', 'completed'].
 * @property {string} [record='do-not-record'] - Whether to record the {@link Worker} leg of the Conference.
 * @property {boolean} [muted=false] - Whether the {@link Worker} leg of the Conference is muted.
 * @property {string|boolean} [beep=true] - Whether the {@link Worker} leg should be when entering the Conference.
 *   The options for beep are: [true, false, 'onEnter', 'onExit'].
 * @property {boolean} [startConferenceOnEnter=true] - Whether the Conference should start when the {@link Worker} leg enters.
 * @property {boolean} [endConferenceOnExit=false] - Whether the Conference should end when the {@link Worker} leg exits.
 * @property {boolean} [endConferenceOnCustomerExit=false] - Whether the Conference should end when the customer leg exits.
 * @property {boolean} [beepOnCustomerEntrance=true] - Whether the Conference should beep when the customer leg enters.
 * @property {string} [waitUrl=default Twilio hold music] - The URL endpoint to play when waiting for the Conference to begin.
 * @property {string} [waitMethod='POST'] - The HTTP method for the Wait URL.
 * @property {boolean} [earlyMedia=true] - Whether Twilio should feed early media to be played directly into a Conference.
 * @property {number} [maxParticipants=10] - The number of max participants allowed in a Conference.
 * @property {string} [conferenceStatusCallback=null] - The URL endpoint to receive Conference status events.
 * @property {string} [conferenceStatusCallbackMethod='POST'] - The HTTP method for the Conference Status Callback URL.
 * @property {string} [conferenceStatusCallbackEvent='start,end'] - A comma separated list of Conference events to subscribe to.
 *   The possible list of events are: ['start', 'end', 'join', 'leave', 'mute', 'hold', 'speaker'].
 * @property {string|boolean} [conferenceRecord=false] - Whether the entire Conference should be recorded.
 *   The possible options for conferenceRecord are: [true, false, 'record-from-start', 'do-not-record'].
 * @property {string} [conferenceTrim='trim-silence'] - Whether to trim the Conference recording.
 *   The options for conferenceTrim are: ['trim-silence', 'do-not-trim'].
 * @property {string} [recordingChannels='mono'] - Which channel of the Conference to record. The options are: ['mono', 'dual'].
 * @property {string} [recordingStatusCallback=null] - The URL endpoint to receive recording status events.
 * @property {string} [recordingStatusCallbackMethod='POST'] - The HTTP method for the Recording Status Callback URL.
 * @property {string} [conferenceRecordingStatusCallback=null] - The URl endpoint to receive Conference events.
 * @property {string} [conferenceRecordingStatusCallbackMethod='POST'] - The HTTP method of the Conference Recording Status Callback.
 * @property {string} [region=null] - The specific region. The options for region are: ['us1', 'ie1', 'sg1', 'br1', 'au1', 'jp1'].
 * @property {string} [sipAuthUsername=null] - The SIP auth username to use.
 * @property {string} [sipAuthPassword=null] - The SIP auth password to use.
 * @property {boolean} [transcribe=false] - Whether the call recording should be transcribed or not.
 * @property {string} [transcriptionConfiguration=null] - The SID or (unique) friendly name of the transcription configuration object to use.
 */

/**
 * @typedef {Object} ReservationParticipantOptions
 * @property {boolean} endConferenceOnExit - Whether the Conference should end when this {@link Worker} participant leaves the Conference
 * @property {boolean} mute - Mute or unmute this {@link Worker} participant
 * @property {boolean} beepOnExit - Whether there should be a beep sound when this {@link Worker} participant leaves the Conference
 */
