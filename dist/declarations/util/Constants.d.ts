export const RESERVATION_STATUS_ACCEPTED: "accepted";
export const RESERVATION_STATUS_COMPLETED: "completed";
export const RESERVATION_STATUS_REJECTED: "rejected";
export const RESERVATION_STATUS_WRAPPING: "wrapping";
export const RESERVATION_INSTRUCTION_CALL: "call";
export const RESERVATION_INSTRUCTION_DEQUEUE: "dequeue";
export const RESERVATION_INSTRUCTION_REDIRECT: "redirect";
export const RESERVATION_INSTRUCTION_CONFERENCE: "conference";
export const TRANSFER_STATUS: Readonly<{
    canceled: "canceled";
    complete: "complete";
    failed: "failed";
    initiated: "initiated";
}>;
export namespace RESERVATION_REJECT_OPTIONS {
    const activitySid: string;
}
export namespace WORKER_UPDATE_OPTIONS {
    const rejectPendingReservations: string;
}
export namespace RESERVATION_CALL_OPTIONS {
    const accept: string;
    const record: string;
    const statusCallbackUrl: string;
    const timeout: string;
    const to: string;
}
export namespace RESERVATION_DEQUEUE_OPTIONS {
    const to_1: string;
    export { to_1 as to };
    export const from: string;
    export const postWorkActivitySid: string;
    const record_1: string;
    export { record_1 as record };
    const timeout_1: string;
    export { timeout_1 as timeout };
    const statusCallbackUrl_1: string;
    export { statusCallbackUrl_1 as statusCallbackUrl };
    export const statusCallbackEvents: string;
}
export namespace RESERVATION_REDIRECT_OPTIONS {
    const accept_1: string;
    export { accept_1 as accept };
}
export namespace CREATE_TASK_OPTIONS {
    const taskChannelUniqueName: string;
    const taskChannelSid: string;
    const attributes: string;
}
export const TASK_STATUS_COMPLETED: "completed";
export const TASK_STATUS_WRAPPING: "wrapping";
export namespace reservationEventTypes {
    export const accepted: number;
    export const rejected: number;
    const timeout_2: number;
    export { timeout_2 as timeout };
    export const canceled: number;
    export const rescinded: number;
    export const completed: number;
    export const wrapup: number;
}
export const taskEventTypes: {
    'task.updated': string;
    'task.canceled': string;
    'task.completed': string;
    'task.wrapup': string;
};
export const reservationToSDKEventsMapping: {
    'reservation.completed': string;
    'reservation.rejected': string;
    'reservation.timeout': string;
    'reservation.canceled': string;
    'reservation.rescinded': string;
    'reservation.accepted': string;
    'reservation.wrapup': string;
};
export const transferFields: Readonly<{
    taskTransfer: "task_transfer";
    activeOutgoingTaskTransfer: "active_outgoing_task_transfer";
}>;
export const TRANSFER_INITIATED: "transfer-initiated";
export const taskTransferEventTypes: {
    'transfer-attempt-failed': string;
    'transfer-completed': string;
    'transfer-failed': string;
    'transfer-initiated': string;
    'transfer-canceled': string;
};
export const taskTransferEventEmitterMapping: {
    'task.transfer-attempt-failed': string;
    'task.transfer-completed': string;
    'task.transfer-failed': string;
    'task.transfer-initiated': string;
    'task.transfer-canceled': string;
};
export const API_V1: "v1";
export const API_V2: "v2";
export const DEFAULT_PAGE_SIZE: 1000;
export const DEFAULT_MAX_WORKERS: 1000;
export const DEFAULT_HTTP_TIMEOUT: 15000;
export namespace EB_URL_PARAMS {
    const TOKEN: string;
    const CLOSE_EXISTING_SESSIONS: string;
    const CLIENT_VERSION: string;
}
export const twilioErrors: {};
