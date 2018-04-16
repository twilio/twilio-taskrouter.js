import _ from 'lodash';
import { API_V2, DEFAULT_PAGE_SIZE } from '../util/Constants';
import Configuration from '../util/Configuration';
import { EventEmitter } from 'events';
import Logger from '../util/Logger';
import Paginator from '../util/Paginator';
import path from 'path';
import Reservation from '../Reservation';
import ReservationDescriptor from '../descriptors/ReservationDescriptor';

/**
 * Construct a data collection of {@link Reservation} objects
 * @class
 * @classdesc A collection representing the {@link Reservation}s active (state='pending,accepted') to a {@link Worker}.
 * @param {Configuration} config - The {@link Configuration}
 * @param {Reservations.Options} [options]
 * @property {Map<string, Reservation>} reservations - The list of {@link Reservation}s available to a {@link Worker}
 *//**
 * @typedef {Object} Reservation.Options
 * @property {number} [pageSize] - The page size to use when querying for data
 */
export default class ReservationsEntity extends EventEmitter {
    constructor(config, request, options = {}) {
        super();

        if (!(config instanceof Configuration)) {
            throw new TypeError('Failed to initialize ReservationsEntity. <Configuration>config is a required parameter.');
        }

        this._config = config;
        this._log = new Logger(`ReservationsEntity-${config._logLevel}`);
        this._request = request;
        this._reservations = new Map();
        this._tasks = new Map();

        this._pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

        if (!_.inRange(this._pageSize, 1, DEFAULT_PAGE_SIZE + 1)) {
            this._log.warn('PageSize range for ReservationsEntity must be between 1 and %d. Setting pageSize to default size=%d', DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
            this._pageSize = 1000;
        }
    }

    get reservations() {
        return this._reservations;
    }

    /**
     * Retrieve all the active Reservations of a Worker
     * @returns {Promise.<Void>}
     */
    fetchReservations() {
        const firstPageResponse = this._getPage();
        return this._getAllReservations(firstPageResponse);
    }

    // recursively fetches the list of Reservations
    _getAllReservations(page) {
        return page.then(paginator => {
            paginator.items.forEach(item => {
                this._insertReservation(item);
            });

            if (!paginator.hasNextPage) {
                return;
            }

            this._getAllReservations(paginator.nextPage());
        });
    }

    // Helper method to make a request to TaskRouter to fetch a particular page of {@link Reservation} objects
    _getPage(args) {
        args = args || {};

        const requestURL = path.join(
            'Workspaces', this._config.workspaceSid,
            'Workers', this._config.workerSid,
            'Reservations'
        );

        // fetch all the Reservations who are currently in an "open" state
        const requestParam = {
            ReservationStatus: 'accepted,pending',
            PageSize: this._pageSize
        };

        if (args.AfterSid) {
            requestParam.AfterSid = args.AfterSid;
        }

        return this._request.get(requestURL, API_V2, requestParam).then(response => {
            return new Paginator(
                response.contents.map(x => new ReservationDescriptor(x, this._config)),
                nextToken => this._getPage({ AfterSid: nextToken }),
                response.after_sid
            );
        });
    }

    // Helper method to insert reservations into local map (client init use only)
    _insertReservation(reservationDescriptor) {
        const sid = reservationDescriptor.sid;
        this._log.trace('_insertReservation(sid=%s, data=%s)', sid, JSON.stringify(reservationDescriptor));

        if (this._reservations.has(sid)) {
            this._log.error('Reservation %s already exists for Worker %s. Skipping insert.', sid, this._config.workerSid);
            throw new Error(`Unable to insert Reservation sid=${sid}. Reservation already exists.`);
        }

        try {
            const reservation = new Reservation(this._config, this._request, reservationDescriptor);
            this._reservations.set(sid, reservation);

            this._tasks.set(reservation.task.sid, reservation.sid);
            this._log.info('Added Task %s for Reservation %s into Task lookup map.', reservation.task.sid, reservation.sid);
            return reservation;
        } catch (err) {
            this._log.error('Unable to create a Reservation for sid=%s. Skipping insert into Reservations map. Error: %s', sid, err);
            throw err;
        }
    }

    /**
     * Insert a Reservation into the reservations map, public function used only for reservationCreated event
     * @param rawReservationData
     * @private
     */
    insert(rawReservationData) {
        this._log.trace('_insertReservation(sid=%s, data=%s)', rawReservationData.sid, JSON.stringify(rawReservationData));
        const descriptor = new ReservationDescriptor(rawReservationData, this._config);
        return this._insertReservation(descriptor);
    }

    /**
     * Emit the appropriate event on the selected Task
     * @param eventType
     * @param payload
     * @private
     */
    _emitTaskEvent(eventType, payload) {
        // find the Reservation
        const taskSid = payload.sid;
        if (this._tasks.has(taskSid)) {
            const reservationSid = this._tasks.get(taskSid);
            const reservation = this.reservations.get(reservationSid);
            if (reservation) {
                const task = reservation.task;
                task._emitEvent(eventType, payload);
            } else {
                this._log.error(`A Reservation connected to Task ${taskSid} does not exist. Unable to emit Event: on(${eventType})`);
            }
        } else {
            this._log.error(`Failed to locate Task with sid=${taskSid}. Unable to emit Event: on(${eventType})`);
        }
    }

    /**
     * Public function to remove a Reservation from the map (if it exists)
     * Set a timeout to remove the item X seconds after the event is received
     * Triggered by Events:['rejected', 'timeout', 'canceled', 'rescinded', 'completed']
     * @param sid
     * @private
     */
    _deleteByReservationSid(sid) {
        this._log.trace('_deleteByReservationSid(sid=%s)', sid);

        const reservation = this.reservations.get(sid);
        if (reservation) {
            this._log.info('Found Reservation sid=%s for Worker %s. Removing reservation and task.', sid, this._config.workerSid);
            this._cleanUpReservationAndTask(reservation);
        } else {
            this._log.info('Reservation with sid=%s not found. Unable to remove Reservation.', sid);
        }
    }

    /**
     * Clean up to remove all Reservation + Task data
     * @param {Reservation} reservation - The reservation to remove
     * @private
     */
    _cleanUpReservationAndTask(reservation) {
        const deletedReservation = this._reservations.delete(reservation.sid);
        this._log.debug('Attempting to delete Reservation sid=%s for Worker %s. Deleted: %s.', reservation.sid, this._config.workerSid, deletedReservation);

        const deletedTask = this._tasks.delete(reservation.task.sid);
        this._log.debug('Attempting to delete Task %s for Reservation %s for Worker %s. Deleted: %s', reservation.task.sid, reservation.sid, this._config.workerSid, deletedTask);
    }
}
