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
        age: 13
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
        age: 183
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
        age: 122
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
        age: 2871
    },
    workspace_sid: 'WSxxx',
    date_created: 1521491096,
    reservation_timeout: 120,
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
        age: 2480
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
        age: 21
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
        age: 164
    },
    workspace_sid: 'WSxxx',
    date_created: 1521491467,
    reservation_timeout: 120,
    worker_previous_activity_sid: 'WAxxx',
    account_sid: 'ACxxx',
    sid: 'WRxx1'
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
  addons: '{}'
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
  addons: '{}'
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
  addons: '{}'
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
  addons: '{}'
};

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
        accepted: reservationAccepted,
        rejected: reservationRejected,
        canceled: reservationCanceled,
        rescinded: reservationRescinded,
        timedOut: reservationTimedOut,
        completed: reservationCompleted
    },
    task: {
        canceled: taskCanceled,
        completed: taskCompleted,
        updated: taskUpdated,
        wrappedUp: taskWrappedUp
    }
  }
};
