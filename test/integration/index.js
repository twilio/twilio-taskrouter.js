/**
 * These are e2e tests
 */
require('./spec/Activity');
require('./spec/ActivityRejectReservations');
require('./spec/Channel');
require('./spec/EventBridgeSignaling');
require('./spec/OutgoingTransfer');
require('./spec/ReservationReject');
require('./spec/ReservationAccept');
require('./spec/ReservationCancel');
require('./spec/Reservation');
require('./spec/Supervisor');
require('./spec/TaskEvents');
require('./spec/TaskUpdated');
require('./spec/TaskTransfer');
require('./spec/WorkerCommon');
require('./spec/WorkerMultiTask');
require('./spec/Workspace');

/**
 * These are integration tests which uses mocks
 */
require('./spec/WorkerRetry');
