/* eslint-disable */

export const taskQueueList = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx1",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 1",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: false
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx2",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 2",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: true
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx3",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 3",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: false
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx4",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 4",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: false
    }
  ],
  page: 0,
  total: 4,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents"
  },
  nextPage: 0,
  lastPage: 0,
  after_sid: null,
  before_sid: null
};

export const taskQueuesPage0 = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx1",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 1",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: false
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx2",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 2",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: true
    }
  ],
  page: 0,
  total: 4,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents",
    next_token: "TQxx1/2022-08-09T19:09:10.763Z"
  },
  nextPage: 0,
  lastPage: 0,
  after_sid: "WQxx2",
  before_sid: null
};

export const taskQueuesPage1 = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx3",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 3",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: false
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      sid: "WQxx4",
      date_created: 1510079627,
      date_updated: 1510079627,
      friendly_name: "Queue 4",
      assignment_activity_name: "Busy",
      reservation_activity_name: "Reserved",
      assignment_activity_sid: "WAxxx",
      reservation_activity_sid: "WAxxx",
      target_workers: "1==1",
      max_reserved_workers: 1,
      task_order: "FIFO",
      version: 0,
      lifo_queue: false
    }
  ],
  page: 0,
  total: 4,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents"
  },
  nextPage: 1,
  lastPage: 0,
  after_sid: null,
  before_sid: "WAxx6"
};

export const workerList = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx1",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Bob",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx2",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Alice",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
  ],
  page: 0,
  total: 2,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents"
  },
  nextPage: 0,
  lastPage: 0,
  after_sid: null,
  before_sid: null
};

export const workerListPage0 = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx1",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "test",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
  ],
  page: 0,
  total: 2,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents",
    next_token: "WKxx1/2022-08-09T19:09:10.763Z"
  },
  nextPage: 0,
  lastPage: 0,
  after_sid: "WKxx1",
  before_sid: null
};

export const workerListPage1 = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx2",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "test",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
  ],
  page: 1,
  total: 2,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents"
  },
  nextPage: 1,
  lastPage: 0,
  after_sid: null,
  before_sid: null
};


export const workerList2 = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx1",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Bob",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx2",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Alice",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx3",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Drake",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
  ],
  page: 0,
  total: 3,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents"
  },
  nextPage: 0,
  lastPage: 0,
  after_sid: null,
  before_sid: null
};

export const workerList2Page0 = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx1",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Bob",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx2",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Alice",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
  ],
  page: 0,
  total: 2,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents"
  },
  nextPage: 0,
  lastPage: 0,
  after_sid: null,
  before_sid: null
};

export const workerList2Page1 = {
  contents: [
    {
      account_sid: "ACxxx",
      workspace_sid: "WSxxx",
      activity_name: 'Offline',
      activity_sid: 'WAxxx',
      sid: "WKxx3",
      date_created: 1510079627,
      date_updated: 1510079627,
      date_status_changed: 1510079627,
      friendly_name: "Drake",
      available: false,
      version: 0,
      attributes: "{\"selected_language\":\"es\"}"
    },
  ],
  page: 1,
  total: 1,
  start: 0,
  end: 0,
  meta: {
    list_key: "contents"
  },
  nextPage: null,
  lastPage: 0,
  after_sid: "WKxx2",
  before_sid: null
};
