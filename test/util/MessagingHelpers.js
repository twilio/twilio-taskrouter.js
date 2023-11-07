import _ from 'lodash';
import { assert } from 'chai';

const credentials = require('../env');

/**
 * Utility class for common helper methods.
 * @param {EnvTwilio} envTwilio - The Twilio Client Helper library
 */
export default class MessagingHelpers {
    constructor(envTwilio) {
        if (!_.isObject(envTwilio)) {
            throw new TypeError('Failed to instantiate MessagingHelpers. <EnvTwilio>envTwilio is a required parameter.');
        }

        this.envTwilio = envTwilio;
    }

    async sendMessage() {
        await this.envTwilio.sendMessage(credentials.flexCCNumber, credentials.customerNumber, 'email');
    }

    /**
     * Listener for worker.ready or worker.error events
     * @param {Worker} worker  The Worker object which initiates outbound call
     * @return {Promise<Worker>} Worker object if promise resolves
     */
    listenToWorkerReadyOrErrorEvent(worker) {
        return new Promise((resolve, reject) => {
            worker.on('ready', (readyWorker) => {
                assert.strictEqual(worker.reservations.size, 0, 'Worker should initialize with 0 pending Reservations');
                resolve(readyWorker);
            });

            worker.on('error', err => {
                reject(`Error detected for Worker ${worker.sid}. Error: ${err}.`);
            });
        });
    }

    /**
     * Assert Reservation and Task properties
     * @param {Worker} worker The Worker object
     * @param {Task.TaskOptions} [options]
     * @return {Promise<Reservation>} Created reservation for Worker
     *//**
     * @typedef {Object} Task.TaskOptions
     * @property {String} [customerNumber] - Updated customerNumber for the task
     */
    assertOnReservationCreated(worker, options = {}) {
        const customerNumber = options.customerNumber || credentials.customerNumber;
        return new Promise((resolve) => {
            worker.on('reservationCreated', reservation => {
                assert.strictEqual(reservation.task.status, 'reserved', 'Task status');
                assert.deepStrictEqual(reservation.task.attributes.senderAddress, customerNumber, 'From number');
                assert.strictEqual(reservation.status, 'pending', 'Reservation Status');
                assert.strictEqual(reservation.workerSid, worker.sid, 'Worker Sid in conference');
                resolve(reservation);
            });
        });
    }

    /**
     * Verify Conversation Properties
     * @param {string} conversationSid - The Sid of the Conversation
     * @param {string} expectedStatus - The expected Conference Status
     */
    async verifyConversationProperties(conversationSid, expectedStatus, expectedSize = null) {
        const conversation = await this.envTwilio.fetchConversation(conversationSid);
        assert.strictEqual(conversation.state, expectedStatus, 'Conversation Status');
        if (expectedSize) {
            const participants = await this.envTwilio.fetchConversationParticipants(conversationSid);
            assert.strictEqual(participants.length, expectedSize, 'Number of Participants');
        }
    }

    /**
     * Helper function to :
     * 1) Assert conversation properties and task status on reservation wrapup and complete event
     * 2) Make request to complete reservation
     * @param reservation
     * @returns {Promise<Reservation>}
     */
    assertOnResWrapUpAndCompleteEvent(reservation) {
        return new Promise(async(resolve, reject) => {
            reservation.on('wrapup', async() => {
                try {
                    assert.strictEqual(reservation.task.status, 'wrapping', 'Task status on reservation wrapup');
                    await reservation.complete();
                    resolve(reservation);
                } catch (err) {
                    reject(`Failed to validate Conversation properties on reservation wrapup event. Error: ${err}`);
                }
            });
        }).then(() => {
            return new Promise(async(resolve, reject) => {
                reservation.on('completed', async() => {
                    try {
                        await this.pauseTestExecution(5000);
                        await this.verifyConversationProperties(reservation.task.attributes.conversationSid, 'closed', 2);
                        assert.strictEqual(reservation.task.status, 'completed', 'Task status on reservation completed');
                        resolve(reservation);
                    } catch (err) {
                        reject(`Failed to validate Conversation properties on reservation completed event. Error: ${err}`);
                    }
                });
            });
        }).catch(err => {
            throw err;
        });
    }

    async pauseTestExecution(timeout) {
        return await new Promise((resolve) => setTimeout(resolve, timeout));
    }
}
