import { assert } from 'chai';
const credentials = require('../env');


/**
 * Utility class for common assertions.
 */
export default class AssertionUtils {
    static assertReservation(actual, responseObj) {
        assert.exists(actual, `actual reservation is either null or undefined; Account sid: ${credentials.accountSid}`);
        assert.exists(responseObj, `responseObj reservation is either null or undefined; Account sid: ${credentials.accountSid}`);
        assert.equal(actual.accountSid, responseObj.account_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.workspaceSid, responseObj.workspace_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.sid, responseObj.sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.workerSid, responseObj.worker_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.status, responseObj.reservation_status, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.timeout, responseObj.reservation_timeout, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.deepEqual(actual.dateCreated, new Date(responseObj.date_created * 1000), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.deepEqual(actual.dateUpdated, new Date(responseObj.date_updated * 1000), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.isTrue(typeof actual.taskDescriptor === 'undefined', `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);

        assert.deepEqual(actual.task.addOns, JSON.parse(responseObj.task.addons), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.age, responseObj.task.age, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.deepEqual(actual.task.attributes, JSON.parse(responseObj.task.attributes), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.deepEqual(actual.task.dateCreated, new Date(responseObj.task.date_created * 1000), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.deepEqual(actual.task.dateUpdated, new Date(responseObj.task.date_updated * 1000), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.priority, responseObj.task.priority, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.queueName, responseObj.task.queue_name, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.queueSid, responseObj.task.queue_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.reason, responseObj.task.reason, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.sid, responseObj.task.sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.status, responseObj.task.assignment_status, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.taskChannelUniqueName, responseObj.task.task_channel_unique_name, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.taskChannelSid, responseObj.task.task_channel_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.timeout, responseObj.task.timeout, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.workflowSid, responseObj.task.workflow_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.workflowName, responseObj.task.workflow_name, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.task.routingTarget, responseObj.task.routing_target, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        if (responseObj.task_transfer) {
            assert.exists(actual.transfer, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
            AssertionUtils.assertTransfer(actual.transfer, responseObj.task_transfer);
            assert.exists(actual.task.transfers, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
            assert.exists(actual.task.transfers.incoming, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
            AssertionUtils.assertTransfer(actual.task.transfers.incoming, responseObj.task_transfer);
        }
        if (responseObj.active_outgoing_task_transfer) {
            assert.exists(actual.task.transfers, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
            assert.exists(actual.task.transfers.outgoing, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
            AssertionUtils.assertTransfer(actual.task.transfers.outgoing, responseObj.active_outgoing_task_transfer);
        }
        if (responseObj.canceled_reason_code) {
            assert.equal(actual.canceledReasonCode, responseObj.canceled_reason_code, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        }
    }

    static assertTransfer(actual, responseObj) {
        assert.exists(actual, `actual reservation is either null or undefined; Account sid: ${credentials.accountSid}`);
        assert.exists(responseObj, `expected reservation is either null or undefined; Account sid: ${credentials.accountSid}`);
        assert.equalDate(actual.dateCreated, new Date(responseObj.date_created * 1000), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equalDate(actual.dateUpdated, new Date(responseObj.date_updated * 1000), `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.to, responseObj.transfer_to, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.reservationSid, responseObj.initiating_reservation_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.mode, responseObj.transfer_mode, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.type, responseObj.transfer_type, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.sid, responseObj.sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.status, responseObj.transfer_status, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.workerSid, responseObj.initiating_worker_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.queueSid, responseObj.initiating_queue_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
        assert.equal(actual.workflowSid, responseObj.initiating_workflow_sid, `Account sid: ${credentials.accountSid}, task sid: ${actual.task.sid}`);
    }

    static assertSid(sid, prefix, msg) {
        const re = new RegExp(`^${prefix}\\w{32}$`);
        assert.match(sid, re, msg);
    }

    /**
     * Verify Transfer properties
     * @param {IncomingTransfer} transfer  The Transfer object on Reservation
     * @param {string} expectedFrom The worker sid of transferor
     * @param {string} expectedTo The worker sid of transferee
     * @param {string} expectedMode expected Transfer Mode (COLD or WARM)
     * @param {string} expectedType expected Transfer Type (WORKER or QUEUE)
     * @param {string} expectedStatus expected Transfer Status
     * @param {string} prefixMessage Prefix for assertion failure message
     */
    static verifyTransferProperties(transfer, expectedFrom, expectedTo, expectedMode, expectedType, expectedStatus, prefixMessage) {
        assert.strictEqual(transfer.reservationSid.substring(0, 2), 'WR', `${prefixMessage} Reservation Sid Prefix; account sid ${credentials.accountSid}`);
        assert.strictEqual(transfer.sid.substring(0, 2), 'TT', `${prefixMessage} Sid Prefix; account sid ${credentials.accountSid}`);
        assert.strictEqual(transfer.workerSid, expectedFrom, `${prefixMessage} Initiating Worker Sid; account sid ${credentials.accountSid}`);
        assert.strictEqual(transfer.to, expectedTo, `${prefixMessage} to Worker Sid; account sid ${credentials.accountSid}`);
        assert.strictEqual(transfer.mode, expectedMode, `${prefixMessage} Mode; account sid ${credentials.accountSid}`);
        assert.strictEqual(transfer.type, expectedType, `${prefixMessage} Type; account sid ${credentials.accountSid}`);
        assert.strictEqual(transfer.status, expectedStatus, `${prefixMessage} Status; account sid ${credentials.accountSid}`);
    }

    static verifyCreatedReservationProperties(reservation, worker, expectedFrom, expectedTo) {
        assert.strictEqual(reservation.task.status, 'reserved', 'Task status', `Account sid: ${credentials.accountSid}`);
        assert.strictEqual(reservation.task.routingTarget, worker.sid, 'Routing target', `Account sid: ${credentials.accountSid}`);
        assert.deepStrictEqual(reservation.task.attributes.from, expectedFrom, 'Conference From number', `Account sid: ${credentials.accountSid}`);
        assert.deepStrictEqual(reservation.task.attributes.outbound_to, expectedTo, 'Conference To number', `Account sid: ${credentials.accountSid}`);
        assert.strictEqual(reservation.status, 'pending', 'Reservation Status', `Account sid: ${credentials.accountSid}`);
        assert.strictEqual(reservation.workerSid, worker.sid, 'Worker Sid in conference', `Account sid: ${credentials.accountSid}`);
    }
}
