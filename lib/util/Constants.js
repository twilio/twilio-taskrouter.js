// Reservation Statuses
export const RESERVATION_STATUS_ACCEPTED = 'accepted';
export const RESERVATION_STATUS_COMPLETED = 'completed';
export const RESERVATION_STATUS_REJECTED = 'rejected';
export const RESERVATION_STATUS_WRAPPING = 'wrapping';

// Reservation Instructions
export const RESERVATION_INSTRUCTION_CALL = 'call';
export const RESERVATION_INSTRUCTION_DEQUEUE = 'dequeue';
export const RESERVATION_INSTRUCTION_REDIRECT = 'redirect';
export const RESERVATION_INSTRUCTION_CONFERENCE = 'conference';

// Transfer Statuses
export const TRANSFER_STATUS = Object.freeze({
    canceled: 'canceled',
    complete: 'complete',
    failed: 'failed',
    initiated: 'initiated'
});

export const RESERVATION_REJECT_OPTIONS = { activitySid: 'WorkerActivitySid' };
Object.freeze(RESERVATION_REJECT_OPTIONS);

export const WORKER_UPDATE_OPTIONS = { rejectPendingReservations: 'RejectPendingReservations' };
Object.freeze(WORKER_UPDATE_OPTIONS);

export const RESERVATION_CALL_OPTIONS = {
    accept: 'CallAccept',
    record: 'CallRecord',
    statusCallbackUrl: 'CallStatusCallbackUrl',
    timeout: 'CallTimeout',
    to: 'CallTo'
};
Object.freeze(RESERVATION_CALL_OPTIONS);

export const RESERVATION_DEQUEUE_OPTIONS = {
    to: 'DequeueTo',
    from: 'DequeueFrom',
    postWorkActivitySid: 'DequeuePostWorkActivitySid',
    record: 'DequeueRecord',
    timeout: 'DequeueTimeout',
    statusCallbackUrl: 'DequeueStatusCallbackUrl',
    statusCallbackEvents: 'DequeueStatusCallbackEvents'
};
Object.freeze(RESERVATION_DEQUEUE_OPTIONS);

export const RESERVATION_REDIRECT_OPTIONS = { accept: 'RedirectAccept' };
Object.freeze(RESERVATION_REDIRECT_OPTIONS);

export const CREATE_TASK_OPTIONS = {
    taskChannelUniqueName: 'TaskChannelUniqueName',
    taskChannelSid: 'TaskChannelSid',
    attributes: 'Attributes'
};

// task status updates
export const TASK_STATUS_COMPLETED = 'completed';
export const TASK_STATUS_WRAPPING = 'wrapping';

export const reservationEventTypes = {
    'accepted': 0,
    'rejected': 1,
    'timeout': 2,
    'canceled': 3,
    'rescinded': 4,
    'completed': 5,
    'wrapup': 6
};
Object.freeze(reservationEventTypes);

export const taskEventTypes = {
    'task.updated': 'updated',
    'task.canceled': 'canceled',
    'task.completed': 'completed',
    'task.wrapup': 'wrapup'
};
Object.freeze(taskEventTypes);

export const completeReservationEvents = {
    'reservation.completed': 'completed',
    'reservation.rejected': 'rejected',
    'reservation.timeout': 'timeout',
    'reservation.canceled': 'canceled',
    'reservation.rescinded': 'rescinded'
 };

Object.freeze(completeReservationEvents);

export const transferFields = Object.freeze({
    taskTransfer: 'task_transfer',
    activeOutgoingTaskTransfer: 'active_outgoing_task_transfer'
});

export const TRANSFER_INITIATED = 'transfer-initiated';
export const taskTransferEventTypes = {
    'transfer-attempt-failed': 'attemptFailed',
    'transfer-completed': 'completed',
    'transfer-failed': 'failed',
    'transfer-initiated': 'transferInitiated',
    'transfer-canceled': 'canceled'
};
Object.freeze(taskTransferEventTypes);

export const taskTransferEventEmitterMapping = {
     'task.transfer-attempt-failed': 'transfer-attempt-failed',
     'task.transfer-completed': 'transfer-completed',
     'task.transfer-failed': 'transfer-failed',
     'task.transfer-initiated': 'transfer-initiated',
     'task.transfer-canceled': 'transfer-canceled'
};
Object.freeze(taskTransferEventEmitterMapping);

export const API_V1 = 'v1';
export const API_V2 = 'v2';
export const DEFAULT_PAGE_SIZE = 1000;
export const DEFAULT_HTTP_TIMEOUT = 5000;

// Signaling layer websocket connection params
export const EB_URL_PARAMS = {
    TOKEN: 'token',
    CLOSE_EXISTING_SESSIONS: 'closeExistingSessions',
    CLIENT_VERSION: 'clientVersion'
};

// Define common set of Twilio errors
const TwilioError = require('./TwilioError');
const errors = [
    { name: 'INVALID_ARGUMENT', message: 'One or more arguments passed were invalid.' },
    { name: 'INVALID_TOKEN', message: 'The token is invalid or malformed.' },

    { name: 'TOKEN_EXPIRED', message: 'Worker\'s active token has expired.' },

    { name: 'GATEWAY_CONNECTION_FAILED', message: 'Could not connect to Twilio\'s servers.' },
    { name: 'GATEWAY_DISCONNECTED', message: 'Connection to Twilio\'s servers was lost.' },
    { name: 'INVALID_GATEWAY_MESSAGE', message: 'The JSON message received was malformed.' },

    { name: 'TASKROUTER_ERROR', message: 'TaskRouter failed to complete the request.' }
];

export const twilioErrors = errors.reduce((errs, error) => {
    errs[error.name] = new TwilioError(error);
    return errs;
}, { });

