import BaseRoutes from './BaseRoutes';

const Errors = require('./Constants').twilioErrors;
import path from 'path';

export const RESERVATION_LIST = 'reservationList';
export const RESERVATION_INSTANCE = 'reservationInstance';
export const WORKER_INSTANCE = 'workerInstance';
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

export default class Routes extends BaseRoutes {
    constructor(workspaceSid, workerSid) {
        super();
        if (!workspaceSid || !workerSid) {
            throw Errors.INVALID_ARGUMENT.clone('Error instantiating Routes class. <string>workspaceSid and <string>workerSid are required parameters.');
        }

        this.workspaceSid = workspaceSid;
        this.workerSid = workerSid;
        this.routes = {
            [ACTIVITIES_LIST]: {
                path: path.join('Workspaces', this.workspaceSid, 'Activities')
            },
            [WORKER_INSTANCE]: {
                path: path.join('Workspaces', this.workspaceSid, 'Workers', this.workerSid)
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
