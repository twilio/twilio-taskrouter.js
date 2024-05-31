import _ from 'lodash';
import Worker from './Worker';
import { API_V1, WORKER_UPDATE_OPTIONS } from './util/Constants';
import { TASK_RESERVATION_INSTANCE, TARGET_WORKER_INSTANCE } from './util/Routes';

export const SuperviseModes = ['monitor', 'barge', 'whisper'];

/**
 * Construct a {@link Supervisor}
 * @extends {Worker}
 * @classdesc Create a {@link Supervisor} client representing a privileged TaskRouter Worker
 * @param {string} token - The string token
 * @param {WorkerOptions} [options]
 * @fires Supervisor#monitor
 */
class Supervisor extends Worker {
    /**
     * Add this {@link Supervisor} to an ongoing {@link Reservation} by Sid.
     * @param {string} taskSid - The sid of the {@link Task} to add a monitor to.
     * @param {string} reservationSid - The sid of the {@link Reservation} to add a monitor to.
     * @param {Record<any, any>} [extraParams] - An object containing extra params to append to the payload.
     * @returns Promise<void>
     */
    monitor(taskSid, reservationSid, extraParams) {
        if (!_.isString(taskSid)) {
            throw new TypeError('Error monitoring reservation: <string>taskSid is a required parameter');
        }

        if (!_.isString(reservationSid)) {
            throw new TypeError('Error monitoring reservation: <string>reservationSid is a required parameter');
        }

        if (extraParams && !_.isObject(extraParams)) {
            throw new TypeError('Error monitoring reservation: <string>extraParams must be an object');
        }

        return this._supervise('monitor', taskSid, reservationSid, extraParams);
    }

    /**
     * Sets the attributes of a worker.
     *
     * @param {string} workerSid - The SID of the worker.
     * @param {Record<string, any>} attributes - The attributes to set for the worker.
     * @throws {TypeError} If workerSid is not a string or attributes is not an object.
     * @return {Promise<Worker>} Returns a {@link Worker}
     */
    setWorkerAttributes(workerSid, attributes) {
        if (!_.isString(workerSid)) {
            throw new TypeError('Error setting worker attributes: <string>workerSid is a required parameter');
        }

        if (!_.isObject(attributes)) {
            throw new TypeError('Error setting worker attributes: <object>attributes is a required parameter');
        }

        const requestURL = this.getRoutes().getRoute(TARGET_WORKER_INSTANCE, workerSid).path;
        const requestParams = { Attributes: attributes };

        return this._request.post(requestURL, requestParams, API_V1, this.version);
    }


    /**
     * Sets the worker activity for a given worker based on the provided workerSid and activitySid.
     *
     * @param {string} workerSid - The SID of the worker.
     * @param {string} activitySid - The SID of the activity to set for the worker.
     * @param {Object} [options] - An object containing extra params to append to the payload.
     * @throws {TypeError} If workerSid or activitySid are not strings.
     * @return {Promise<Worker>} Returns a {@link Worker}
     */
    setWorkerActivity(workerSid, activitySid, options = {}) {
        if (!_.isString(workerSid)) {
            throw new TypeError('Error setting worker activity: <string>workerSid is a required parameter');
        }

        if (!_.isString(activitySid)) {
            throw new TypeError('Error setting worker activity: <string>activitySid is a required parameter');
        }

        if (options && !_.isObject(options)) {
            throw new TypeError('Error setting worker activity: <object>options must be an object');
        }

        const requestURL = this.getRoutes().getRoute(TARGET_WORKER_INSTANCE, workerSid).path;
        const requestParams = { ActivitySid: activitySid };

        for (const option in options) {
            requestParams[WORKER_UPDATE_OPTIONS[option]] = options[option];
        }

        return this._request.post(requestURL, requestParams, API_V1, this.version);
    }

    /**
     * Send a request to supervise a given reservationSid.
     * @private
     * @param {SuperviseModes} mode
     * @param {string} taskSid
     * @param {string} reservationSid
     * @param {Object} [extraParams] - An object containing extra params to append to the extraParams.
     * @returns {Promise<void>}
     */
    _supervise(mode, taskSid, reservationSid, extraParams) {
        const requestURL = this.getRoutes().getRoute(TASK_RESERVATION_INSTANCE, taskSid, reservationSid).path;
        const requestParam = Object.assign({ }, extraParams, {
            Instruction: 'supervise',
            Supervisor: this.sid,
            SupervisorMode: mode,
        });

        return this._request.post(requestURL, requestParam, API_V1).then(() => {
          // Return void
        });
    }
}

export default Supervisor;

/**
 * Add this {@link Supervisor} to an ongoing {@link Reservation} by Sid.
 * @event Supervisor#monitor
 * @param {string} taskSid - The sid of the {@link Task} to add a monitor to.
 * @param {string} reservationSid - The sid of the {@link Reservation} to add a monitor to.
 * @param {Object} [extraParams] - An object containing extra params to append to the payload.
 */
