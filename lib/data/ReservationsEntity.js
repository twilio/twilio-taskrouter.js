import inRange from 'lodash/inRange';
import { API_V2, DEFAULT_PAGE_SIZE } from '../util/Constants';
import { EventEmitter } from 'events';
import Paginator from '../util/Paginator';
import Reservation from '../Reservation';
import ReservationDescriptor from '../descriptors/ReservationDescriptor';
import Worker from '../Worker';
import { RESERVATION_LIST } from '../util/Routes';

/**
 * @typedef {Object} Reservations.Options
 * @property {number} [pageSize] - The page size to use when querying for data
 */

/**
 * Construct a data collection of {@link Reservation} objects
 * @classdesc A collection representing the {@link Reservation}s active (state='pending,accepted') to a {@link Worker}.
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {Reservations.Options} [options]
 * @property {Map<string, Reservation>} reservations - The list of {@link Reservation}s available to a {@link Worker}
 */
export default class ReservationsEntity extends EventEmitter {
    /**
     * @param {Worker} worker - The {@link Worker}
     * @param {import('../util/Request')} request - The {@link Request}
     * @param {Reservations.Options} [options]
     */
    constructor(worker, request, options = {}) {
        super();

        if (!(worker instanceof Worker)) {
            throw new TypeError('Failed to initialize ReservationsEntity. <Worker>worker is a required parameter.');
        }

        /**
         * @private
         * @type {Worker}
         */
        this._worker = worker;
        /**
         * @private
         * @type {import('../util/Logger')}
         */
        this._log = worker.getLogger('ReservationsEntity');
        /**
         * @private
         * @type {import('../util/Request')}
         */
        this._request = request;
        /**
         * @private
         * @type {Map}
         */
        this._reservations = new Map(); // Map is {sid => [Reservation, (bool) deleted]}
        /**
         * @private
         * @type {Map}
         */
        this._reservationSidsByTask = new Map(); // Map is {sid (task) => Set([sid (reservation)])}
        /**
         * @private
         * @type {string}
         */
        this._pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

        if (!inRange(this._pageSize, 1, DEFAULT_PAGE_SIZE + 1)) {
            this._log.warn('PageSize range for ReservationsEntity must be between 1 and %d. Setting pageSize to default size=%d', DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
            this._pageSize = 1000;
        }
    }

    /**
     * @returns {Map<string, Reservation>}
     */
    get reservations() {
        // Filter out any that have been soft deleted
        return new Map(
            Array.from(this._reservations)
            .filter(x => !x[1][1])
            .map(t => [t[0], t[1][0]])
        );
    }

    /**
     * Retrieve all the active Reservations of a Worker
     * @public
     * @returns {Promise<Map<string, Reservation>>}
     */
    fetchReservations() {
        const firstPageResponse = this._getPage();
        // clear the reservation map before refreshing it with the latest results.
        this._reservations.clear();
        return this._getAllReservations(firstPageResponse);
    }

    /**
     * recursively fetches the list of Reservations
     * @private
     * @param {Paginator} page
     * @returns {Promise<Map<string, Reservation>>}
     */
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

    /**
     * Helper method to make a request to TaskRouter to fetch a particular page of {@link Reservation} objects
     * @private
     * @param {Object} args
     * @returns {Promise<Map<string, Reservation>>}
     */
    _getPage(args) {
        args = args || {};

        const requestURL = this._worker.getRoutes().getRoute(RESERVATION_LIST).path;

        // fetch all the Reservations who are currently in an "open" state
        const requestParam = {
            Active: 'true',
            PageSize: this._pageSize
        };

        if (args.AfterSid) {
            requestParam.AfterSid = args.AfterSid;
        }

        return this._request.get(requestURL, API_V2, requestParam).then(response => {
            return new Paginator(
                response.contents.map(x => new ReservationDescriptor(x, this._worker)),
                nextToken => this._getPage({ AfterSid: nextToken }),
                response.after_sid
            );
        });
    }

    /**
     * Helper method to insert reservations into local map (client init use only)
     * @private
     * @param {ReservationDescriptor} reservationDescriptor
     * @returns {Reservation}
     */
    _insertReservation(reservationDescriptor) {
        const sid = reservationDescriptor.sid;
        this._log.trace('_insertReservation(sid=%s, data=%s)', sid, JSON.stringify(reservationDescriptor));

        if (this._reservations.has(sid)) {
            this._log.debug('Reservation %s already exists for Worker %s. Attempting to overwrite it.', sid, this._worker.sid);
        }

        try {
            const reservation = new Reservation(this._worker, this._request, reservationDescriptor);
            this._reservations.set(sid, [reservation, false]);

            // create the reverse task-reservation lookup map
            if (this._reservationSidsByTask.has(reservation.task.sid)) {
                // only map a reservations sid to a task once
                this._reservationSidsByTask.get(reservation.task.sid).add(reservation.sid);
            } else {
                // seeing this task for the first time
                this._reservationSidsByTask.set(reservation.task.sid, new Set([reservation.sid]));
            }
            this._log.debug('Successfully created and inserted %s for %s to Task-Reservation lookup. Contents: %s', reservation.sid, reservation.task.sid, this._reservationSidsByTask.get(reservation.task.sid));
            return reservation;
        } catch (err) {
            this._log.error('Unable to create a Reservation for sid=%s. Skipping insert into Reservations map. Error: %s', sid, err);
            throw err;
        }
    }

    /**
     * Insert a Reservation into the reservations map, public function used only for reservationCreated event
     * @public
     * @param {Object} rawReservationData
     * @returns {Reservation}
     */
    insert(rawReservationData) {
        this._log.trace('_insertReservation(sid=%s, data=%s)', rawReservationData.sid, JSON.stringify(rawReservationData));
        const descriptor = new ReservationDescriptor(rawReservationData, this._worker);

        return this._insertReservation(descriptor);
    }

    /**
     * Get a list of Tasks by its SID
     * @public
     * @param {string} taskSid
     * @returns {[import('../Task')] | null}
     */
    getTasks(taskSid) {
        if (!this._reservationSidsByTask.has(taskSid)) {
            return null;
        }
        const reservationSids = this._reservationSidsByTask.get(taskSid);
        const tasks = [];
        reservationSids.forEach(sid => {
            const reservation = this._reservations.get(sid);
            if (reservation && reservation[0].task) {
                tasks.push(reservation[0].task);
            }
        });
        return tasks;
    }

    /**
     * Public function to remove a Reservation from the map (if it exists)
     * Set a timeout to remove the item X seconds after the event is received
     * Triggered by Events:['rejected', 'timeout', 'canceled', 'rescinded', 'completed']
     * @private
     * @param {string} sid
     */
    _deleteByReservationSid(sid) {
        this._log.trace('_deleteByReservationSid(sid=%s)', sid);

        const reservation = this.reservations.get(sid);
        if (reservation) {
            this._log.info('Found Reservation sid=%s for Worker %s. Removing reservation and task.', sid, this._worker.sid);
            this._cleanUpReservationAndTask(reservation);
        } else {
            this._log.info('Reservation with sid=%s not found. Unable to remove Reservation.', sid);
        }
    }

    /**
     * Clean up to remove all Reservation + Task data
     * @private
     * @param {Reservation} reservation - The reservation to remove
     */
    _cleanUpReservationAndTask(reservation) {
        this._log.debug('Soft deleting Reservation sid=%s for Worker %s', reservation.sid, this._worker.sid);
        this._reservations.set(reservation.sid, [reservation, true]);

        setTimeout(() => {
            this._log.debug('Hard deleting of Reservation sid=%s for Worker %s', reservation.sid, this._worker.sid);

            if (!this._reservations.delete(reservation.sid)) {
                this._log.warn('Failed to hard delete Reservation sid=%s for Worker %s', reservation.sid, this._worker.sid);
            }
        }, 5000);
    }
}
