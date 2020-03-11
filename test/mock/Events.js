/* eslint-disable */

const workerActivityUpdated = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WKxxx',
    date_created: 1510257438,
    date_updated: 1519160430,
    attributes: '{}',
    friendly_name: 'Alice',
    available: true,
    activity_sid: 'WAxxx',
    activity_name: 'Idle',
    date_status_changed: 1519160462
};

const workerAttributesUpdated = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WKxxx',
    date_created: 1510257438,
    date_updated: 1519160923,
    attributes: '{"name": "Alice"}',
    friendly_name: 'Alice',
    available: true,
    activity_sid: 'WAxxx',
    activity_name: 'Idle',
    date_status_changed: 1519160462
};

// capacity=2 -> capacity=5
const workerChannelCapacityUpdated = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WCxx1',
    worker_sid: 'WKxxx',
    task_channel_sid: 'TCxx1',
    configured_capacity: 5,
    available: 1,
    assigned_tasks: 0,
    available_capacity_percentage: 100,
    task_channel_unique_name: 'default',
    date_created: 1510257438,
    date_updated: 1519160621,
    last_reserved_time: 1519160332037
};

// available=true to available=false
const workerChannelAvailabilityUpdated = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WCxxx',
    worker_sid: 'WKxxx',
    task_channel_sid: 'TCxxx',
    configured_capacity: 1,
    available: 0,
    assigned_tasks: 0,
    available_capacity_percentage: 100,
    task_channel_unique_name: 'default',
    date_created: 1510257438,
    date_updated: 1519160698,
    last_reserved_time: 1519160332037
};

const reservationCreated = {
    worker_sid: 'WKxxx',
    date_updated: 0,
    reservation_status: 'pending',
    task: {
        reason: null,
        date_updated: 1521437155,
        assignment_status: 'reserved',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521437155,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxxx',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 13,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 0,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxxx'
};

const reservationAccepted = {
    worker_sid: 'WKxxx',
    date_updated: 1521437338,
    reservation_status: 'accepted',
    task: {
        reason: null,
        date_updated: 1521437277,
        assignment_status: 'assigned',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521437155,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 183,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521437277,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationRejected = {
    worker_sid: 'WKxxx',
    date_updated: 1521437277,
    reservation_status: 'rejected',
    task:
    {
        reason: null,
        date_updated: 1521437155,
        assignment_status: 'pending',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521437155,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxxx',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 122,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521437168,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationCanceled = {
    worker_sid: 'WKxxx',
    date_updated: 1521491096,
    reservation_status: 'canceled',
    task: {
        reason: null,
        date_updated: 1521490731,
        assignment_status: 'canceled',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521488251,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 2871,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521491096,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationCanceledWithValidReasonCode = {
    worker_sid: 'WKxxx',
    date_updated: 1521491096,
    reservation_status: 'canceled',
    task: {
        reason: null,
        date_updated: 1521490731,
        assignment_status: 'canceled',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521488251,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 2871,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521491096,
    reservation_timeout: 120,
    canceled_reason_code: 1001,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationCanceledWithInValidReasonCode = {
    worker_sid: 'WKxxx',
    date_updated: 1521491096,
    reservation_status: 'canceled',
    task: {
        reason: null,
        date_updated: 1521490731,
        assignment_status: 'canceled',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521488251,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 2871,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521491096,
    reservation_timeout: 120,
    canceled_reason_code: -1,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationTimedOut = {
    worker_sid: 'WKxxx',
    date_updated: 1521490731,
    reservation_status: 'timeout',
    task: {
        reason: null,
        date_updated: 1521488705,
        assignment_status: 'pending',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521488251,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 2480,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521490611,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationRescinded = {
    worker_sid: 'WKxxx',
    date_updated: 1521492229,
    reservation_status: 'rescinded',
    task: {
        reason: null,
        date_updated: 1521492208,
        assignment_status: 'assigned',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521492208,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{}',
        age: 21,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521492208,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationCompleted = {
    worker_sid: 'WKxxx',
    date_updated: 1521491479,
    reservation_status: 'completed',
    task: {
        reason: 'Is Completed',
        date_updated: 1521491495,
        assignment_status: 'completed',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        workflow_sid: 'WWxxx',
        date_created: 1521491332,
        task_channel_unique_name: 'default',
        priority: 0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{"selected_language":"en"}',
        age: 164,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1521491467,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationWrapping = {
    worker_sid: 'WKxxx',
    date_updated: 1556049971,
    reservation_status: 'wrapping',
    task: {
        reason: null,
        date_updated: 1556049971,
        assignment_status: 'reserved',
        workflow_name: 'IncomingRequests',
        addons: '{}',
        date_created: 1556049960,
        workflow_sid: 'WWxxx',
        task_channel_unique_name: 'voice',
        priority:0,
        timeout: 86400,
        sid: 'WTxx1',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{}',
        age: 11,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1556049960,
    worker_name: 'Alice',
    reservation_timeout: 2000,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
};

const reservationCreatedForWorker2ByTransfer = {
	worker_sid: 'WKxxx',
	date_updated: 1556049971,
	reservation_status: 'pending',
	task: {
		reason: null,
		date_updated: 1556049971,
		assignment_status: 'reserved',
		workflow_name: 'IncomingRequests',
		addons: '{}',
		date_created: 1556049960,
		workflow_sid: 'WWxxx',
		task_channel_unique_name: 'voice',
		priority: 0,
		timeout:86400,
		sid: 'WTxx1',
		queue_name: 'EnglishTaskQ',
		task_channel_sid: 'TCxxx',
		queue_sid: 'WQxxx',
		attributes: '{}',
		age:11,
        routing_target: null
	},
	workspace_sid: 'WSxxx',
	date_created:1556049971,
	worker_name: 'Alice',
	reservation_timeout: 2000,
	worker_previous_activity_sid: 'WAxxx',
	account_sid: 'ACxxx',
	task_transfer: {
		initiating_reservation_sid: 'WRxx1',
		date_updated: 1556049971,
		transfer_mode: 'COLD',
		date_created:1556049971,
		initiating_workflow_sid: 'WWxxx',
		transfer_type: 'QUEUE',
		transfer_to: 'WQxxx',
		transfer_status: 'initiated',
		initiating_worker_sid: 'WKxxx',
		initiating_queue_sid: 'WQxxx',
		sid: 'TTxxx'
	},
	sid: 'WRxx2'
};

//The payload of this reservationFailed event is a Task like entity, not the usual ReservationTask entity. Special case for Flex.
const reservationFailed = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WTxx1',
    date_created: 1518809969,
    date_updated: 1519161100,
    attributes: '',
    assignment_status: 'canceled',
    workflow_sid: 'WWxxx',
    workflow_name: 'Default Fifo Workflow',
    queue_sid: 'WQxxx',
    queue_name: 'Sample Queue',
    priority: 0,
    reason: "RoutingTarget SLA for Reservation creation was not met",
    timeout: 86400,
    task_channel_sid: 'TCxxx',
    task_channel_unique_name: 'default',
    routing_target: "WKxxx",
    counter: 1,
    age: 65,
    addons: '{}'
};

const taskUpdated = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WTxx1',
    date_created: 1518809969,
    date_updated: 1519161100,
    attributes: '{"country":"USA"}',
    assignment_status: 'reserved',
    workflow_sid: 'WWxxx',
    workflow_name: 'Default Fifo Workflow',
    queue_sid: 'WQxxx',
    queue_name: 'Sample Queue',
    priority: 0,
    reason: null,
    timeout: 86400,
    task_channel_sid: 'TCxxx',
    task_channel_unique_name: 'default',
    counter: 1,
    age: 65,
    addons: '{}',
    routing_target: null
};

const taskCanceled = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WTxx1',
    date_created: 1518809969,
    date_updated: 1519161652,
    attributes: '{}',
    assignment_status: 'canceled',
    workflow_sid: 'WWxxx',
    workflow_name: 'Default Fifo Workflow',
    queue_sid: 'WQxxx',
    queue_name: 'Sample Queue',
    priority: 0,
    reason: 'No longer needed',
    timeout: 86400,
    task_channel_sid: 'TCxxx',
    task_channel_unique_name: 'default',
    counter: 1,
    age: 100,
    addons: '{}',
    routing_target: null
};

const taskCompleted = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WTxx1',
    date_created: 1518809969,
    date_updated: 1519161534,
    attributes: '{"country":"USA"}',
    assignment_status: 'completed',
    workflow_sid: 'WWxxx',
    workflow_name: 'Default Fifo Workflow',
    queue_sid: 'WQxxx',
    queue_name: 'Sample Queue',
    priority: 0,
    reason: 'Task is completed',
    timeout: 86400,
    task_channel_sid: 'TCxxx',
    task_channel_unique_name: 'default',
    counter: 2,
    age: 499,
    addons: '{}',
    routing_target: null
};

const taskWrappedUp = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WTxx1',
    date_created: 1518809969,
    date_updated: 1519161448,
    attributes: '{"country":"USA"}',
    assignment_status: 'wrapping',
    workflow_sid: 'WWxxx',
    workflow_name: 'Default Fifo Workflow',
    queue_sid: 'WQxxx',
    queue_name: 'Sample Queue',
    priority: 0,
    reason: 'Task is wrapping',
    timeout: 86400,
    task_channel_sid: 'TCxxx',
    task_channel_unique_name: 'default',
    counter: 2,
    age: 413,
    addons: '{}',
    routing_target: null
};

const transferInitiated = {
    initiating_reservation_sid: 'WRxxx',
    date_updated: 1538160762,
    transfer_mode: 'WARM',
    workspace_sid: 'WSxxx',
    task_sid: 'WTxxx',
    date_created: 1538160762,
    account_sid: 'ACxxx',
    transfer_type: 'QUEUE',
    transfer_to: 'WQxxx',
    transfer_status: 'initiated',
    initiating_worker_sid: 'WKxxx',
    sid: 'TTxxx',
    initiating_workflow_sid: 'WWxxx',
    initiating_queue_sid: 'WQxxx'
};

const transferFailed = {
    initiating_reservation_sid: 'WRxxx',
    date_updated: 1538160762,
    transfer_mode: 'WARM',
    workspace_sid: 'WSxxx',
    task_sid: 'WTxxx',
    date_created: 1538160762,
    account_sid: 'ACxxx',
    transfer_type: 'QUEUE',
    transfer_to: 'WQxxx',
    transfer_status: 'failed',
    initiating_worker_sid: 'WKxxx',
    transfer_failed_reason: 'Transfer failed because the reservation timed out',
    sid: 'TTxxx',
    initiating_workflow_sid: 'WWxxx',
    initiating_queue_sid: 'WQxxx'
};

const transferCompleted = {
    initiating_reservation_sid: 'WRxxx',
    date_updated: 1538160762,
    transfer_mode: 'WARM',
    workspace_sid: 'WSxxx',
    task_sid: 'WTxxx',
    date_created: 1538160762,
    account_sid: 'ACxxx',
    transfer_type: 'QUEUE',
    transfer_to: 'WQxxx',
    transfer_status: 'complete',
    initiating_worker_sid: 'WKxxx',
    sid: 'TTxxx',
    initiating_workflow_sid: 'WWxxx',
    initiating_queue_sid: 'WQxxx'
};

const transferAttemptFailed = {
    initiating_reservation_sid: 'WRxxx',
    date_updated: 1538160762,
    transfer_mode: 'WARM',
    workspace_sid: 'WSxxx',
    task_sid:'WTxxx',
    date_created:1538160762,
    transfer_to: 'WQxxx',
    transfer_status: 'initiated',
    initiating_worker_sid: 'WKxxx',
    transfer_failed_reason: 'Transfer attempt failed on reservation reject because there are no more pending reservations',
    sid: 'TTxxx',
    initiating_workflow_sid: 'WWxxx',
    account_sid: 'ACxxx',
    transfer_type: 'QUEUE',
    initiating_queue_sid: 'WQxxx'
};

const transferCanceled = {
    initiating_reservation_sid: 'WRxxx',
    date_updated: 1553288010,
    transfer_mode: 'WARM',
    workspace_sid: 'WSxxx',
    task_sid: 'WTxxx',
    date_created: 1553288000,
    transfer_to: 'WKxx2',
    transfer_status: 'canceled',
    initiating_worker_sid: 'WKxxx',
    sid: 'TTxxx',
    initiating_workflow_sid: 'WWxxx',
    account_sid: 'ACxxx',
    transfer_type: 'WORKER',
    initiating_queue_sid: 'WQxxx'
};

const reservationCanceledForIncomingTransfer = {
    worker_sid: 'WKxx2',
    date_updated: 1554313056,
    reservation_status: 'canceled',
    task: {
        reason: null,
        date_updated: 1554313056,
        assignment_status: 'assigned',
        workflow_name: 'Default Fifo Workflow',
        addons: '{}',
        date_created: 1554313045,
        workflow_sid: 'WWxxx',
        task_channel_unique_name: 'voice',
        priority: 0,
        timeout: 86400,
        sid: 'WTxxx',
        queue_name: 'Sample Queue',
        task_channel_sid: 'TCxxx',
        queue_sid: 'WQxxx',
        attributes: '{}',
        age: 17,
        routing_target: null
    },
    workspace_sid: 'WSxxx',
    date_created: 1554313056,
    worker_name: 'Bob',
    reservation_timeout: 2000,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    task_transfer: {
        initiating_reservation_sid: 'WRxxx',
        date_updated: 1554313062,
        transfer_mode: 'WARM',
        date_created: 1554313056,
        initiating_workflow_sid: 'WWxxx',
        transfer_type: 'WORKER',
        transfer_to: 'WKxxx',
        transfer_status: 'canceled',
        initiating_worker_sid: 'WKxxx',
        initiating_queue_sid: 'WQxxx',
        sid: 'TTxxx'
    },
    sid: 'WRxx2'
 }

module.exports = {
  events: {
    worker: {
        activityUpdated: workerActivityUpdated,
        attributesUpdated: workerAttributesUpdated
    },
    channel: {
        capacityUpdated: workerChannelCapacityUpdated,
        availabilityUpdated: workerChannelAvailabilityUpdated
    },
    reservation: {
        created: reservationCreated,
        createdByColdTransfer: reservationCreatedForWorker2ByTransfer,
        accepted: reservationAccepted,
        rejected: reservationRejected,
        canceled: reservationCanceled,
        canceledWithValidReasonCode: reservationCanceledWithValidReasonCode,
        canceledWithInvalidReasonCode: reservationCanceledWithInValidReasonCode,
        rescinded: reservationRescinded,
        timedOut: reservationTimedOut,
        completed: reservationCompleted,
        wrapping: reservationWrapping,
        canceledForIncomingTransfer: reservationCanceledForIncomingTransfer,
        failed: reservationFailed
    },
    task: {
        canceled: taskCanceled,
        completed: taskCompleted,
        updated: taskUpdated,
        wrappedUp: taskWrappedUp,
        transferInitiated: transferInitiated,
        transferAttemptFailed: transferAttemptFailed,
        transferFailed: transferFailed,
        transferCompleted: transferCompleted,
        transferCanceled: transferCanceled
    }
  }
};
