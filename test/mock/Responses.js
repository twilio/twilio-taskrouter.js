/* eslint-disable */

export const updateWorkerActivityToIdle = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WKxxx",
  date_created: 1510257438,
  date_updated: 1519236349,
  attributes: "{}",
  friendly_name: "Jen",
  available: true,
  activity_sid: "WAxx2",
  activity_name: "Idle",
  date_status_changed: 1519259389
};

export const updateWorkerAttributes = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WKxxx",
  date_created: 1510257438,
  date_updated: 1519537599,
  attributes: "{\"selected_language\":\"es\"}",
  friendly_name: "Alice",
  available: true,
  activity_sid: "WAxxx",
  activity_name: "Idle",
  date_status_changed: 1519414077
};

export const acceptedReservation = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WRxxx",
  date_created: 1519408776,
  date_updated: 1519408791,
  task_sid: "WTxxx",
  worker_sid: "WKxxx",
  worker_name: "Alice",
  reservation_status: "accepted",
  task_channel_sid: "TCxxx",
  worker_previous_activity_sid: "WAxxx"
};

export const taskCompleted = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WTxx1",
  date_created: 1518809969,
  date_updated: 1519408987,
  attributes: "{}",
  assignment_status: "completed",
  workflow_sid: "WWxxx",
  workflow_name: "Default Fifo Workflow",
  queue_sid: "WQxxx",
  queue_name: "Sample Queue",
  priority: 0,
  reason: "Task is completed.",
  timeout: 86400,
  task_channel_sid: "TCxxx",
  task_channel_unique_name: "default",
  counter: 2,
  age: 291,
  addons: "{}"
};

export const taskWrapping = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WTxx1",
  date_created: 1518809969,
  date_updated: 1519408907,
  attributes: "{}",
  assignment_status: "wrapping",
  workflow_sid: "WWxxx",
  workflow_name: "Default Fifo Workflow",
  queue_sid: "WQxxx",
  queue_name: "Sample Queue",
  priority: 0,
  reason: "Task is wrapping.",
  timeout: 86400,
  task_channel_sid: "TCxxx",
  task_channel_unique_name: "default",
  counter: 2,
  age: 211,
  addons: "{}"
};

export const reservationAccepted = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WRxx1",
  date_created: 1519413824,
  date_updated: 1519413847,
  task_sid: "WTxx1",
  worker_sid: "WKxxx",
  worker_name: "Alice",
  reservation_status: "accepted",
  task_channel_sid: "TCxxx",
  worker_previous_activity_sid: "WAxxx"
};

export const reservationRejected = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WRxx1",
  date_created: 1519413989,
  date_updated: 1519414017,
  task_sid: "WTxx1",
  worker_sid: "WKxxx",
  worker_name: "Alice",
  reservation_status: "rejected",
  task_channel_sid: "TCxxx",
  worker_previous_activity_sid: "WAxxx"
};

export const reservationDequeued = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WRxxx",
  date_created: 1519418080,
  date_updated: 1519418080,
  task_sid: "WTxx1",
  worker_sid: "WKxxx",
  worker_name: "Alice",
  reservation_status: "pending",
  task_channel_sid: "TCxxx",
  worker_previous_activity_sid: "WAxxx"
};

export const reservationRedirected = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WRxxx",
  date_created: 1519418080,
  date_updated: 1519418080,
  task_sid: "WTxx1",
  worker_sid: "WKxxx",
  worker_name: "Alice",
  reservation_status: "pending",
  task_channel_sid: "TCxxx",
  worker_previous_activity_sid: "WAxxx"
};

export const reservationCalled = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WRxxx",
  date_created: 1519418080,
  date_updated: 1519418080,
  task_sid: "WTxx1",
  worker_sid: "WKxxx",
  worker_name: "Alice",
  reservation_status: "pending",
  task_channel_sid: "TCxxx",
  worker_previous_activity_sid: "WAxxx"
};

export const reservationConferenced = {
  account_sid: "ACxxx",
  workspace_sid: "WSxxx",
  sid: "WRxxx",
  date_created: 1519418080,
  date_updated: 1519418080,
  task_sid: "WTxx1",
  worker_sid: "WKxxx",
  worker_name: "Alice",
  reservation_status: "pending",
  task_channel_sid: "TCxxx",
  worker_previous_activity_sid: "WAxxx"
};
