import BaseRoutes from './BaseRoutes';

const Errors = require('./Constants').twilioErrors;
import path from 'path';

export const RESERVATION_LIST = 'reservationList';
export const RESERVATION_INSTANCE = 'reservationInstance';
export const WORKER_INSTANCE = 'workerInstance';
export const TARGET_WORKER_INSTANCE = 'targetWorkerInstance';
export const TASK_RESERVATION_INSTANCE = 'taskReservationInstance';
export const TASK_LIST = 'taskList';
export const TASK_INSTANCE = 'taskInstance';
export const TASK_TRANSFER_LIST = 'taskTransferList';
export const TASK_TRANSFER_INSTANCE = 'taskTransferInstance';
export const WORKER_CHANNELS = 'workerChannels';
export const ACTIVITIES_LIST = 'activitiesList';
export const CUSTOMER_PARTICIPANT_INSTANCE = 'customerParticipantInstance';
export const WORKER_PARTICIPANT_INSTANCE = 'workerParticipantInstance';
export const HOLD_WORKER_PARTICIPANT_INSTANCE = 'holdWorkerParticipantInstance';
export const KICK_WORKER_PARTICIPANT = 'kickWorkerParticipant';

/**
 * @typedef Routes.routesTypes
 * @type {{taskTransferInstance: {"path": string}, workerChannels: {"path": string}, workerParticipantInstance: {"path": string}, taskList: {"path": string}, taskTransferList: {"path": string}, kickWorkerParticipant: {"path": string}, workerInstance: {"path": string}, reservationList: {"path": string}, taskReservationInstance: {"path": string}, taskInstance: {"path": string}, reservationInstance: {"path": string}, holdWorkerParticipantInstance: {"path": string}, activitiesList: {"path": string}, customerParticipantInstance: {"path": string}}}
 */
/**
 * Construct a custom {@link Routes}
 * @param {string} workspaceSid
 * @param {string} workerSid
 * @property {Routes.routesTypes} routes
 */
export default class Routes extends BaseRoutes {
    /**
     * @param {string} workspaceSid
     * @param {string} workerSid
     */
    constructor(workspaceSid, workerSid) {
        super();
        if (!workspaceSid || !workerSid) {
            throw Errors.INVALID_ARGUMENT.clone('Error instantiating Routes class. <string>workspaceSid and <string>workerSid are required parameters.');
        }

        /**
         * @type {string}
         */
        this.workspaceSid = workspaceSid;
        /**
         * @type {string}
         */
        this.workerSid = workerSid;
        /**
         * @type {Routes.routesTypes}
         */
        this.routes = {
            [ACTIVITIES_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Activities')
            },
            [WORKER_INSTANCE]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers', this.workerSid)
            },
            [TARGET_WORKER_INSTANCE]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers', '%s')
            },
            [RESERVATION_INSTANCE]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'Reservations', '%s')
            },
            [RESERVATION_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'Reservations')
            },
            [TASK_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Tasks')
            },
            [TASK_INSTANCE]: {
                path: path.join('Workspaces', this.workspaceSid, 'Tasks', '%s')
            },
            [TASK_TRANSFER_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'Transfers')
            },
            [TASK_TRANSFER_INSTANCE]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'Transfers', '%s')
            },
            [TASK_RESERVATION_INSTANCE]: {
                path: path.join('Workspaces', this.workspaceSid, 'Tasks', '%s', 'Reservations', '%s')
            },
            [WORKER_CHANNELS]: {
                path: path.join( 'Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'WorkerChannels')
            },
            [CUSTOMER_PARTICIPANT_INSTANCE]: {
                path: path.join( 'Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'CustomerParticipant')
            },
            [WORKER_PARTICIPANT_INSTANCE]: {
                path: path.join( 'Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'WorkerParticipant')
            },
            [HOLD_WORKER_PARTICIPANT_INSTANCE]: {
                path: path.join( 'Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'HoldWorkerParticipant')
            },
            [KICK_WORKER_PARTICIPANT]: {
                path: path.join( 'Workspaces', this.workspaceSid, 'Workers', this.workerSid, 'KickWorkerParticipant')
            }
        };
    }

}
