export const RESERVATION_LIST: "reservationList";
export const RESERVATION_INSTANCE: "reservationInstance";
export const WORKER_INSTANCE: "workerInstance";
export const TASK_RESERVATION_INSTANCE: "taskReservationInstance";
export const TASK_LIST: "taskList";
export const TASK_INSTANCE: "taskInstance";
export const TASK_TRANSFER_LIST: "taskTransferList";
export const TASK_TRANSFER_INSTANCE: "taskTransferInstance";
export const WORKER_CHANNELS: "workerChannels";
export const ACTIVITIES_LIST: "activitiesList";
export const CUSTOMER_PARTICIPANT_INSTANCE: "customerParticipantInstance";
export const WORKER_PARTICIPANT_INSTANCE: "workerParticipantInstance";
export const HOLD_WORKER_PARTICIPANT_INSTANCE: "holdWorkerParticipantInstance";
export const KICK_WORKER_PARTICIPANT: "kickWorkerParticipant";
export default class Routes extends BaseRoutes {
    constructor(workspaceSid: string, workerSid: string);
    workspaceSid: string;
    workerSid: string;
    routes: Routes.routesTypes;
}
export namespace Routes {
    type routesTypes = {
        taskTransferInstance: {
            "path": string;
        };
        workerChannels: {
            "path": string;
        };
        workerParticipantInstance: {
            "path": string;
        };
        taskList: {
            "path": string;
        };
        taskTransferList: {
            "path": string;
        };
        kickWorkerParticipant: {
            "path": string;
        };
        workerInstance: {
            "path": string;
        };
        reservationList: {
            "path": string;
        };
        taskReservationInstance: {
            "path": string;
        };
        taskInstance: {
            "path": string;
        };
        reservationInstance: {
            "path": string;
        };
        holdWorkerParticipantInstance: {
            "path": string;
        };
        activitiesList: {
            "path": string;
        };
        customerParticipantInstance: {
            "path": string;
        };
    };
}
import BaseRoutes from "./BaseRoutes";
