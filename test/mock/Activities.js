/* eslint-disable */

export const offlineActivityInstance = {
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  sid: 'WAxx1',
  date_created: 1510079627,
  date_updated: 1510079627,
  friendly_name: 'Offline',
  available: false
};

export const list = {
  contents: [{
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx1',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Offline',
    available: false
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx2',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Idle',
    available: true
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx3',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Busy',
    available: false
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx4',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Reserved',
    available: false
  }],
  page: 0,
  total: 4,
  start: 0,
  end: 0,
  meta: {
    list_key: 'contents'
  },
  nextPage: 0,
  lastPage: 0,
  after_sid: null,
  before_sid: null
};

//  Mocks Activities Response
// PageSize=5, Total Activities=7
export const activitiesPage0 = {
  contents: [{
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx1',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Offline',
    available: false
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx2',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Idle',
    available: true
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx3',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Busy',
    available: false
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx4',
    date_created: 1510079627,
    date_updated: 1510079627,
    friendly_name: 'Reserved',
    available: false
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxxx5',
    date_created: 1518213059,
    date_updated: 1518635954,
    friendly_name: 'Activity-1',
    available: false
  }],
  page: 0,
  total: 7,
  start: 0,
  end: 1,
  meta: {
    list_key: 'contents'
  },
  nextPage: 1,
  lastPage: 0,
  after_sid: 'WAxx5',
  before_sid: null
};

export const activitiesPage1 = {
  contents: [{
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx6',
    date_created: 1518213060,
    date_updated: 1518213060,
    friendly_name: 'Activity-2',
    available: false
  }, {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    sid: 'WAxx7',
    date_created: 1518213080,
    date_updated: 1518213080,
    friendly_name: 'Activity-3',
    available: false
  }],
  page: 0,
  total: 7,
  start: 0,
  end: 1,
  meta: {
    list_key: 'contents'
  },
  nextPage: 1,
  lastPage: 0,
  after_sid: null,
  before_sid: 'WAxx6'
};
