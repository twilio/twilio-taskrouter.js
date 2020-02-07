import { assert } from 'chai';
/**
 * Utility class for common assertions.
 */
export default class AssertionUtils {
    static assertReservation(actual, responseObj) {
        assert.exists(actual, 'actual reservation is either null or undefined');
        assert.exists(actual, 'responseObj reservation is either null or undefined');
        assert.equal(actual.accountSid, responseObj.account_sid);
        assert.equal(actual.workspaceSid, responseObj.workspace_sid);
        assert.equal(actual.sid, responseObj.sid);
        assert.equal(actual.workerSid, responseObj.worker_sid);
        assert.equal(actual.status, responseObj.reservation_status);
        assert.equal(actual.timeout, responseObj.reservation_timeout);
        assert.deepEqual(actual.dateCreated, new Date(responseObj.date_created * 1000));
        assert.deepEqual(actual.dateUpdated, new Date(responseObj.date_updated * 1000));
        assert.isTrue(typeof actual.taskDescriptor === 'undefined');

        assert.deepEqual(actual.task.addOns, JSON.parse(responseObj.task.addons));
        assert.equal(actual.task.age, responseObj.task.age);
        assert.deepEqual(actual.task.attributes, JSON.parse(responseObj.task.attributes));
        assert.deepEqual(actual.task.dateCreated, new Date(responseObj.task.date_created * 1000));
        assert.deepEqual(actual.task.dateUpdated, new Date(responseObj.task.date_updated * 1000));
        assert.equal(actual.task.priority, responseObj.task.priority);
        assert.equal(actual.task.queueName, responseObj.task.queue_name);
        assert.equal(actual.task.queueSid, responseObj.task.queue_sid);
        assert.equal(actual.task.reason, responseObj.task.reason);
        assert.equal(actual.task.sid, responseObj.task.sid);
        assert.equal(actual.task.status, responseObj.task.assignment_status);
        assert.equal(actual.task.taskChannelUniqueName, responseObj.task.task_channel_unique_name);
        assert.equal(actual.task.taskChannelSid, responseObj.task.task_channel_sid);
        assert.equal(actual.task.timeout, responseObj.task.timeout);
        assert.equal(actual.task.workflowSid, responseObj.task.workflow_sid);
        assert.equal(actual.task.workflowName, responseObj.task.workflow_name);
        assert.equal(actual.task.routingTarget, responseObj.task.routing_target);
        if (responseObj.task_transfer) {
            assert.exists(actual.transfer);
            AssertionUtils.assertTransfer(actual.transfer, responseObj.task_transfer);
            assert.exists(actual.task.transfers);
            assert.exists(actual.task.transfers.incoming);
            AssertionUtils.assertTransfer(actual.task.transfers.incoming, responseObj.task_transfer);
        }
        if (responseObj.active_outgoing_task_transfer) {
            assert.exists(actual.task.transfers);
            assert.exists(actual.task.transfers.outgoing);
            AssertionUtils.assertTransfer(actual.task.transfers.outgoing, responseObj.active_outgoing_task_transfer);
        }
        if (responseObj.canceled_reason_code) {
            assert.equal(actual.canceledReasonCode, responseObj.canceled_reason_code);
        }
    }

    static assertTransfer(actual, responseObj) {
        assert.exists(actual, 'actual reservation is either null or undefined');
        assert.exists(actual, 'expected reservation is either null or undefined');
        assert.equalDate(actual.dateCreated, new Date(responseObj.date_created * 1000));
        assert.equalDate(actual.dateUpdated, new Date(responseObj.date_updated * 1000));
        assert.equal(actual.to, responseObj.transfer_to);
        assert.equal(actual.reservationSid, responseObj.initiating_reservation_sid);
        assert.equal(actual.mode, responseObj.transfer_mode);
        assert.equal(actual.type, responseObj.transfer_type);
        assert.equal(actual.sid, responseObj.sid);
        assert.equal(actual.status, responseObj.transfer_status);
        assert.equal(actual.workerSid, responseObj.initiating_worker_sid);
        assert.equal(actual.queueSid, responseObj.initiating_queue_sid);
        assert.equal(actual.workflowSid, responseObj.initiating_workflow_sid);
    }

    static assertSid(sid, prefix, msg) {
        const re = new RegExp(`^${prefix}\\w{32}$`);
        assert.match(sid, re, msg);
    }
}
