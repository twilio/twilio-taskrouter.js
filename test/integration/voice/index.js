/*
* Voice e2e tests
* */
require('./inbound/spec/Reservation'); // Skipped
require('./inbound/spec/Supervisor');
require('./inbound/spec/TaskTransferToWorker');
require('./outbound/spec/Reservation');
require('./outbound/spec/Supervisor');
require('./outbound/spec/Task');
require('./outbound/spec/TaskTransferToQueue');
require('./outbound/spec/TaskTransferToWorker');
require('./outbound/spec/ExternalTransfer');
