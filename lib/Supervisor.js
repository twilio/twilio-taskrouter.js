import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import Worker from './Worker';
import { API_V1 } from './util/Constants';
import { TASK_RESERVATION_INSTANCE } from './util/Routes';

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
        if (!isString(taskSid)) {
            throw new TypeError('Error monitoring reservation: <string>taskSid is a required parameter');
        }

        if (!isString(reservationSid)) {
            throw new TypeError('Error monitoring reservation: <string>reservationSid is a required parameter');
        }

        if (extraParams && !isObject(extraParams)) {
            throw new TypeError('Error monitoring reservation: <string>extraParams must be an object');
        }

        return this._supervise('monitor', taskSid, reservationSid, extraParams);
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
