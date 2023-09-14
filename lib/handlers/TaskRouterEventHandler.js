import Logger from '../util/Logger';
import { taskEventTypes, taskTransferEventEmitterMapping, reservationToSDKEventsMapping } from '../util/Constants';


/**
 * Construct an {@link TaskRouterEventHandler}
 * @param {Worker} worker - The {@link Worker}
 * @param {Object} [options] - Options
 * @fires TaskRouterEventHandler#activityUpdated
 * @fires TaskRouterEventHandler#attributesUpdated
 * @fires TaskRouterEventHandler#reservationCreated
 * @fires TaskRouterEventHandler#reservationFailed
 */
export default class TaskRouterEventHandler {
    /**
     * @param {import('../Worker')} worker - The {@link Worker}
     * @param {Object} [options] - Options
     */
    constructor(worker, options = {}) {
        /**
         * @private
         * @type {import('../Worker')}
         */
        this._worker = worker;
        /**
         * @private
         * @type {string}
         */
        this._logLevel = options.logLevel || 'error';
        /**
         * @private
         * @type {import('../util/Logger')}
         */
        this._log = new Logger('WorkerEventHandler', this._logLevel);
    }

    /**
     * @public
     * @returns {{"task.transfer-completed": string, "reservation.completed": string, "task.transfer-attempt-failed": string, "reservation.created": string, "task.updated": string, "reservation.rescinded": string, "worker.attributes.update": string, "worker.channel.availability.update": string, "task.transfer-initiated": string, "reservation.accepted": string, "reservation.timeout": string, "reservation.failed": string, "worker.activity.update": string, "reservation.rejected": string, "task.canceled": string, "task.transfer-failed": string, "task.wrapup": string, "reservation.wrapup": string, "reservation.canceled": string, "task.transfer-canceled": string, "worker.capacity.update": string, "task.completed": string}}
     */
    getTREventsToHandlerMapping() {
        return {
            // events for the worker
            'worker.activity.update': '_workerActivityUpdateHandler',
            'worker.attributes.update': '_workerAttributesUpdateHandler',
            // events for a worker channel
            'worker.capacity.update': '_workerCapacityUpdateHandler',
            'worker.channel.availability.update': '_workerChannelAvailabilityUpdateHandler',
            // events for a reservation
            'reservation.created': '_reservationCreatedHandler',
            'reservation.failed': '_reservationFailedHandler',
            'reservation.accepted': '_reservationUpdateHandler',
            'reservation.wrapup': '_reservationUpdateHandler',
            // reservations completion/ deletion/ rejection/ timeouts/ cancellations /rescinsions
            'reservation.completed': '_reservationCleanupEventsHandler',
            'reservation.rejected': '_reservationCleanupEventsHandler',
            'reservation.timeout': '_reservationCleanupEventsHandler',
            'reservation.canceled': '_reservationCleanupEventsHandler',
            'reservation.rescinded': '_reservationCleanupEventsHandler',
            // events for a task --> only find and update the task; we do no removals (reservation events remove from Worker
            // map)
            'task.updated': '_taskTypeEventHandler',
            'task.canceled': '_taskTypeEventHandler',
            'task.completed': '_taskTypeEventHandler',
            'task.wrapup': '_taskTypeEventHandler',

            'task.transfer-attempt-failed': '_transferTaskEventHandler',
            'task.transfer-completed': '_transferTaskEventHandler',
            'task.transfer-failed': '_transferTaskEventHandler',
            'task.transfer-initiated': '_transferTaskEventHandler',
            'task.transfer-canceled': '_transferTaskEventHandler'
        };
    }

    /**
     * @private
     * @param {Object} eventData
     */
    _workerActivityUpdateHandler(eventData) {
        this._log.info('Worker %s received Event: worker.activity.update. Proceeding to update ...', this._worker.sid);

        if (eventData.activity_sid) {
            const futureActivity = this._worker.activities.get(eventData.activity_sid);
            if (futureActivity) {
                this._worker.activity._isCurrent = false;
                this._worker.activity = futureActivity;
                futureActivity._isCurrent = true;
                this._worker.emit('activityUpdated', this._worker._update(eventData));
            } else {
                this._log.error('The Activity sid=%s specified in Event: worker.activity.update does not ' +
                                'exist in the Worker\'s map of Activities. Unable to update Worker %s activity.',
                                eventData.activity_sid, this._worker.sid);
                throw new Error(`Failed to update Worker ${this._worker.sid} activity.`);
            }
        } else {
            this._log.error(
                'Event: worker.activity.update did not contain an activity_sid. Unable to update Worker %s.', this._worker.sid);
            throw new Error(`Failed to update Worker ${this._worker.sid} activity.`);
        }
    }

    /**
     * @private
     * @param {Object} eventData
     */
    _workerAttributesUpdateHandler(eventData) {
        this._log.info(`Worker ${this._worker.sid} received Event: worker.attributes.update. Proceeding to update ...`);
        this._worker.emit('attributesUpdated', this._worker._update(eventData));
    }

    /**
     * @private
     * @param {Object} eventData
     */
    _workerCapacityUpdateHandler(eventData) {
        this._log.info(`Worker ${this._worker.sid} received Event: worker.capacity.update.`);

        if (eventData.sid) {
            const channel = this._worker.channels.get(eventData.sid);
            if (channel) {
                channel._emitEvent('capacityUpdated', eventData);
            } else {
                this._log.error('The Channel sid=%s specified in Event: worker.capacity.update does not ' +
                                ' exist in the Worker\'s map of Channels. Unable to update Worker %s channel.',
                                eventData.sid, this._worker.sid);
                throw new Error(`Failed to update Worker ${this._worker.sid} channel.`);
            }
        } else {
            this._log.error(
                'Event: worker.capacity.update did not contain a Channel sid. Unable to update Channel for Worker %s.',
                this._worker.sid);
            throw new Error(`Failed to update Worker ${this._worker.sid} channel.`);
        }
    }

    /**
     * @private
     * @param {Object} eventData
     */
    _workerChannelAvailabilityUpdateHandler(eventData) {
        this._log.info('Worker %s received Event: worker.channel.availability.update.', this._worker.sid);

        if (eventData.sid) {
            const channel = this._worker.channels.get(eventData.sid);
            if (channel) {
                channel._emitEvent('availabilityUpdated', eventData);
            } else {
                this._log.error('The Channel sid=%s specified in Event: worker.channel.availability.update does not ' +
                                ' exist in the Worker\'s map of Channels. Unable to update Worker %s channel.',
                                eventData.sid, this._worker.sid);
                throw new Error(`Failed to update Worker ${this._worker.sid} channel.`);
            }
        } else {
            this._log.error(
                'Event: worker.capacity.update did not contain a Channel sid. Unable to update Channel for Worker %s.',
                this._worker.sid);
            throw new Error(`Failed to update Worker ${this._worker.sid} channel.`);
        }
    }

    /**
     * @private
     * @param {Object} eventData
     */
    _reservationCreatedHandler(eventData) {
        this._log.info('Worker %s received Event: reservation.created.', this._worker.sid);
        if (eventData.sid) {
            try {
                this._log.info('Attempting to create and insert Reservation into Worker %s reservations map.', this._worker.sid);
                const reservation = this._worker._dataServices.reservationsEntity.insert(eventData);
                this._worker._bumpVersion();
                this._worker.emit('reservationCreated', reservation);
            } catch (err) {
                this._log.info('Failed to create and insert Reservation into Worker %s reservations map.', this._worker.sid);
                throw new Error(`Failed to create a Reservation for Worker ${this._worker.sid} on Event: reservationCreated ${eventData}. Error: ${err}`);
            }
        } else {
            this._log.error('Event: reservationCreated did not contain a Reservation sid. '
                            + 'Unable to create a Reservation for Worker %s.', this._worker.sid);
            throw new Error(`Failed to create Reservation for Worker ${this._worker.sid}.`);
        }
    }

    /**
     * @private
     * @param {Object} eventData
     */
    _reservationFailedHandler(eventData) {
        this._log.info('Worker %s received Event: reservation.failed.', this._worker.sid);
        this._worker.emit('reservationFailed', eventData);
    }

    /**
     * @private
     * @param {Object} eventData
     * @param {string} eventType
     */
    _reservationUpdateHandler(eventData, eventType) {
        const mappedEventType = reservationToSDKEventsMapping[eventType];
        this._log.info('Worker %s received Event: %s mapped to %s.', this._worker.sid, eventType, mappedEventType);
        if (eventData.sid) {
            const reservation = this._worker.reservations.get(eventData.sid);
            if (reservation) {
                reservation._emitEvent(mappedEventType, eventData);
            } else {
                this._log.error(`The Resevation sid=${eventData.sid} specified in Event: reservation.${mappedEventType} does not \
                                        exist in the Worker's map of Reservations. Unable to update Worker ${this._worker.sid} reservation.`);
                throw new Error(`Failed to update Worker ${this._worker.sid} reservation.`);
            }
        } else {
            this._log.error(
                `Event: reservation.${mappedEventType} did not contain a Reservation sid. Unable to update Reservation for Worker ${this._worker.sid}`);
            throw new Error(`Failed to update Reservation for Worker ${this._worker.sid}.`);
        }
    }

    /**
     * @private
     * @param {Object} eventData
     * @param {string} eventType
     */
    _reservationCleanupEventsHandler(eventData, eventType) {
        const mappedEventType = reservationToSDKEventsMapping[eventType];
        this._log.info('Worker %s received Event: %s mapped to %s.', this._worker.sid, eventType, mappedEventType);

        if (eventData.sid) {
            const reservation = this._worker.reservations.get(eventData.sid);
            if (reservation) {
                this._worker._dataServices.reservationsEntity._deleteByReservationSid(eventData.sid);
                reservation._emitEvent(mappedEventType, eventData);
            } else {
                this._log.warn(
                    'The reservation specified by Event: reservation.%s does not exist in Worker %s Reservations map. Skipping event.',
                    mappedEventType, this._worker.sid);
            }
        } else {
            this._log.error(
                'Event: reservation.%s did not contain a Reservation sid. Unable to update Reservation for Worker %s.',
                mappedEventType, this._worker.sid);
            throw new Error(`Failed to update Reservation for Worker ${this._worker.sid}.`);
        }
    }

    /**
     * @private
     * @param {Object} eventData
     * @param {string} eventType
     */
    _taskTypeEventHandler(eventData, eventType) {
        // maps the prefix.eventname to eventnames
        const mappedEventType = taskEventTypes[eventType];
        this._log.info('Worker %s received Event: %s mapped to %s.', this._worker.sid, eventType, mappedEventType);

        if (eventData.sid) {
            const tasks = this._worker._dataServices.reservationsEntity.getTasks(eventData.sid);
            if (tasks && tasks.length > 0) {
                tasks.forEach(task => {
                    task._update(eventData);
                    task._emitEvent(mappedEventType, eventData);
                });
            } else {
                this._log.warn(
                    'The task specified by Event: task.%s does not exist in Worker %s Reservations map. Skipping event.',
                    mappedEventType, this._worker.sid);
            }
        } else {
            this._log.error('Event: task.%s did not contain a Task sid. Unable to emit event for Worker %s.',
                            mappedEventType, this._worker.sid);
            throw new Error(`Failed to emit event for Worker ${this._worker.sid}.`);
        }
    }

    /**
     * @private
     * @param {Object} eventData
     * @param {string} eventType
     */
    _transferTaskEventHandler(eventData, eventType) {
        // maps the prefix.transfer-eventname to eventnames
        const mappedEventType = taskTransferEventEmitterMapping[eventType];
        this._log.info('Worker %s received Event: % mapped to %s.', this._worker.sid, eventType, mappedEventType);
        if (eventData.initiating_reservation_sid && eventData.task_sid) {
            // fetch the relevant reservation
            const reservation = this._worker.reservations.get(eventData.initiating_reservation_sid);
            if (reservation) {
                if (reservation.task.sid === eventData.task_sid) {
                    // emit the transfer event from the owning task
                    reservation.task._emitEventForOutgoingTransfer(mappedEventType, eventData);
                } else {
                    this._log.warn(
                        'The task %s related to Event: task.%s does not match the expected owning Reservation %s for Worker %s. Skipping event.',
                        eventData.task_sid, mappedEventType, reservation.sid, this._worker.sid);
                }
            } else {
                this._log.warn(
                    'The reservation %s related to Event: task.%s does not exist in Worker %s Reservations map. Skipping event.',
                    eventData.initiating_reservation_sid, mappedEventType, this._worker.sid);
            }
        } else {
            this._log.error(
                'Event: task.%s did not contain a Reservation sid or Task sid. Unable to emit event for Worker %s.',
                mappedEventType, this._worker.sid);
            throw new Error(`Failed to emit event for Worker ${this._worker.sid}.`);
        }
    }
}

/**
 * {@link Worker} activity was updated
 * @event TaskRouterEventHandler#activityUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Worker} attributes was updated
 * @event TaskRouterEventHandler#attributesUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was failed
 * @event TaskRouterEventHandler#reservationFailed
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was created
 * @event TaskRouterEventHandler#reservationCreated
 * @param {Object} payload - The payload received
 */

