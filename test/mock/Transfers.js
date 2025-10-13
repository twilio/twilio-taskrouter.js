/* eslint-disable */

export const canceledTaskTransfer = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    task_sid: 'WTxxx',
    sid: 'TTxxx',
    transfer_type: 'WORKER',
    transfer_mode: 'WARM',
    transfer_to: 'WKxx2',
    transfer_status: 'canceled',
    date_created: 1553124538,
    date_updated: 1553124538,
    initiating_reservation_sid: 'WRxx2',
    initiating_worker_sid: 'WKxxx',
    initiating_queue_sid: 'WQxxx',
    initiating_workflow_sid: 'WWxxx'
};


export const initiatedTaskTransfer = {
    account_sid: 'ACxxx',
    workspace_sid: 'WSxxx',
    task_sid: 'WTxx1',
    sid: 'TTxxx',
    transfer_type: 'WORKER',
    transfer_mode: 'COLD',
    transfer_to: 'WKxx1',
    transfer_status: 'initiated',
    date_created: 1553124538,
    date_updated: 1553124538,
    initiating_reservation_sid: 'WRxx1',
    initiating_worker_sid: 'WKxxx',
    initiating_queue_sid: 'WQxxx',
    initiating_workflow_sid: 'WWxxx'
};
