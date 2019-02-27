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

export const RESERVATION_REJECT_OPTIONS = { activitySid: 'WorkerActivitySid' };

export const WORKER_UPDATE_OPTIONS = { rejectPendingReservations : 'RejectPendingReservations' };

Object.freeze(RESERVATION_REJECT_OPTIONS);

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
    'updated': 0,
    'canceled': 1,
    'completed': 2,
    'wrapup': 3,
};
Object.freeze(taskEventTypes);

export const taskTransferEventTypes = {
    'transfer-attempt-failed': 0,
    'transfer-completed': 1,
    'transfer-failed': 2,
    'transfer-initiated': 3,
};
Object.freeze(taskTransferEventTypes);

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
