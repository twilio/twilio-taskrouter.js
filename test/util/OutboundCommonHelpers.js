import { assert } from 'chai';
import _ from 'lodash';
import { pauseTestExecution } from '../voice/VoiceBase';
const STATUS_CHECK_DELAY = 1000;
const credentials = require('../env');
/**
 * Utility class for common helper methods.
 * @param {EnvTwilio} envTwilio - The Twilio Client Helper library
 */
export default class OutboundCommonHelpers {
    constructor(envTwilio) {
        if (!_.isObject(envTwilio)) {
            throw new TypeError('Failed to instantiate OutboundCommonHelpers. <EnvTwilio>envTwilio is a required parameter.');
        }

        this.envTwilio = envTwilio;
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
     * @param {Worker} worker The Worker object which initiates outbound call
     * @param {Task.TaskOptions} [options]
     * @return {Promise<Reservation>} Created reservation for Worker
     *//**
     * @typedef {Object} Task.TaskOptions
     * @property {String} [customerNumber] - Updated customerNumber for the task
     */
    assertOnReservationCreated(worker, options = {}) {
        const customerNumber = options.customerNumber || credentials.customerNumber;
        return new Promise((resolve) => {
            worker.on('reservationCreated', createdRes => {
                assert.strictEqual(createdRes.task.status, 'reserved', 'Task status');
                assert.strictEqual(createdRes.task.routingTarget, worker.sid, 'Routing target');
                assert.deepStrictEqual(createdRes.task.attributes.from, credentials.flexCCNumber, 'Conference From number');
                assert.deepStrictEqual(createdRes.task.attributes.outbound_to, customerNumber, 'Conference To number');
                assert.strictEqual(createdRes.status, 'pending', 'Reservation Status');
                assert.strictEqual(createdRes.workerSid, worker.sid, 'Worker Sid in conference');
                resolve(createdRes);
            });
        });
    }

    /**
     * Helper function to :
     * 1) Create Task
     * 2) Listen on reservationCreated event and assert reservation/task properties
     * @param {Worker} worker The Worker object which initiates outbound call
     * @param {Task.TaskOptions} [options]
     * @return {Promise<Reservation>} Created reservation for Worker
     * //**
     * @typedef {Object} Task.TaskOptions
     * @property {String} [customerNumber] - Updated customerNumber for the task
     */
    async createTaskAndAssertOnResCreated(worker, options = {}) {
        const customerNumber = options.customerNumber || credentials.customerNumber;
        const [taskSid, createdReservation] = await Promise.all([worker.createTask(customerNumber, credentials.flexCCNumber, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid),
            this.assertOnReservationCreated(worker, options)]);

        // check that the reservation's task is the task we created for ourselves
        if (taskSid !== createdReservation.task.sid) {
            throw new Error(`Did not receive a Reservation for the created Outbound Task ${taskSid}. Got a Reservation for ${createdReservation.task.sid} instead`);
        } else {
            return createdReservation;
        }
    }

    /**
     * Helper function to assert properties after transfer is initiated
     * @param {Reservation} transferorReservation  The Transferor's reservation
     * @return {Promise<Transfer>} Outgoing {@link Transfer}
     */
    async validateTransferInitiated(transferorReservation) {
        return new Promise((resolve, reject) => {
            transferorReservation.task.on('transferInitiated', async(outgoingTransfer) => {
                try {
                    assert.strictEqual(outgoingTransfer.status, 'initiated', 'Outgoing Transfer Status');

                    await pauseTestExecution(STATUS_CHECK_DELAY);

                    const conference = await this.envTwilio.fetchConferenceByName(transferorReservation.task.sid);
                    const participantPropertiesMap = await this.envTwilio.fetchParticipantProperties(conference.sid);
                    assert.strictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, true, 'Customer put on-hold value');
                    resolve(outgoingTransfer);
                } catch (err) {
                    reject(`Failed to validate transfer initiated properties. Error: ${err}`);
                }
            });
        });
    }

    /**
     * Helper function to :
     * 1) Assert conference properties after transferor has accepted reservation
     * 2) Make Bob available if specified
     * 3) Initiate Transfer
     * 4) Call helper function to assert properties after transfer is initiated
     * @param {Reservation} transferorReservation  The Transferor's reservation
     * @param {string} transferToSid The Sid to which Task should be transferred. (Worker Sid or Queue Sid)
     * @param {boolean} makeTransfereeAvailable  To specify if Transferee needs to be made available (true or false)
     * @param {string} transfereeSid The Sid of transferee
     * @param {string} transferMode The mode of Transfer (COLD or WARM)
     * @param {string} expectedConfStatus Expected Conference status
     * @param {number} expectedConfParticipantsSize Expected number of Participants in the Conference
     * @return {Promise<void>}
     */
    async assertOnTransferorAcceptedAndInitiateTransfer(transferorReservation, transferToSid, makeTransfereeAvailable, transfereeSid,
                                                        transferMode, expectedConfStatus, expectedConfParticipantsSize) {
        try {
            await this.verifyConferenceProperties(transferorReservation.task.sid, expectedConfStatus, expectedConfParticipantsSize);

            if (makeTransfereeAvailable) {
                await this.envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid, transfereeSid, credentials.multiTaskConnectActivitySid);
            }

            await transferorReservation.task.transfer(transferToSid, { mode: transferMode });

            await this.validateTransferInitiated(transferorReservation);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Helper function to :
     * 1) Assert conference properties after transferee has accepted reservation
     * 2) Verify customer is still on-hold
     * 3) Un-hold customer to bring him/her back into the conference
     * 4) Verify there are no participants on-hold
     * @param {Reservation} transfereeReservation  The Transferee's reservation
     * @param {string} expectedConfStatus Expected Conference status
     * @param {number} expectedConfParticipantSize Expected number of Participants in the Conference
     * @return {Promise<void>}
     */
    async assertOnTransfereeAccepted(transfereeReservation, expectedConfStatus, expectedConfParticipantSize) {
        let participantPropertiesMap;
        let conference;
        try {
            await this.verifyConferenceProperties(transfereeReservation.task.sid, expectedConfStatus, expectedConfParticipantSize);

            // Verify customer is still on-hold

            conference = await this.envTwilio.fetchConferenceByName(transfereeReservation.task.sid);
            participantPropertiesMap = await this.envTwilio.fetchParticipantProperties(conference.sid);
            assert.strictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, true, 'Customer put on-hold value');

            // Un-hold customer to bring him/her back into the conference
            await transfereeReservation.task.updateParticipant({ hold: false });

            // Verify customer is un-hold now
            await pauseTestExecution(STATUS_CHECK_DELAY);
            conference = await this.envTwilio.fetchConferenceByName(transfereeReservation.task.sid);
            participantPropertiesMap = await this.envTwilio.fetchParticipantProperties(conference.sid);
            assert.strictEqual(participantPropertiesMap.get(credentials.customerNumber).hold, false, 'Customer put on-hold value');
        } catch (err) {
            throw err;
        }
    }

    /**
     * Helper function to :
     * 1) Assert conference properties and task status on reservation wrapup and complete event
     * 2) Make request to complete reservation
     * @param reservation The Reservation listening to events
     * @param isTransferor To specify if reservation is of Transferor (value: true) or Transferee (value: false)
     * @param expectedConfParticipantsSize Expected number of Participants in the Conference
     * @returns {Promise<Reservation>}
     */
    assertOnResWrapUpAndCompleteEvent(reservation, isTransferor, expectedConfParticipantsSize) {
        return new Promise(async(resolve, reject) => {
            reservation.on('wrapup', async() => {
                try {
                    if (isTransferor) {
                        await this.verifyConferenceProperties(reservation.task.sid, 'in-progress', expectedConfParticipantsSize);
                        assert((reservation.task.status === 'reserved' || reservation.task.status === 'assigned'),
                            'Task status on Transferor Reservation assigned/reserved');
                    } else {
                        await this.verifyConferenceProperties(reservation.task.sid, 'completed', expectedConfParticipantsSize);
                        assert.strictEqual(reservation.task.status, 'wrapping', 'Task status on Transferee Reservation wrapping');
                    }

                    await reservation.complete();
                    resolve(reservation);
                } catch (err) {
                    reject(`Failed to validate Conference properties on reservation=${reservation.sid} for Transferor=${isTransferor} wrap-up event. Error: ${err}`);
                }
            });
        }).then(() => {
            return new Promise(async(resolve, reject) => {
                reservation.on('completed', async() => {
                    try {
                        if (isTransferor) {
                            await this.verifyConferenceProperties(reservation.task.sid, 'in-progress', expectedConfParticipantsSize);
                            assert((reservation.task.status === 'reserved' || reservation.task.status === 'assigned'),
                                'Task status on Reservation assigned/reserved');
                        } else {
                            await this.verifyConferenceProperties(reservation.task.sid, 'completed', expectedConfParticipantsSize);
                            assert.strictEqual(reservation.task.status, 'completed', 'Task status on Reservation Completed for Transferee');
                        }
                        resolve(reservation);
                    } catch (err) {
                        reject(`Failed to validate Conference properties on reservation=${reservation.sid} for completed event. Error: ${err}`);
                    }
                });
            });
        }).catch(err => {
            throw err;
        });
    }

    /**
     * Helper function to :
     * 1) Assert conference properties and task status on reservation wrapup and complete event
     * 2) Make request to complete reservation
     * @param reservation
     * @returns {Promise<Reservation>}
     */
    assertOnResWrapUpAndCompleteEventOutbound(reservation) {
        return new Promise(async(resolve, reject) => {
            reservation.on('wrapup', async() => {
                try {
                    await this.verifyConferenceProperties(reservation.task.sid, 'completed', 0);
                    assert.strictEqual(reservation.task.status, 'wrapping', 'Task status on reservation wrapup');
                    await reservation.complete();
                    resolve(reservation);
                } catch (err) {
                    reject(`Failed to validate Conference properties on reservation wrapup event. Error: ${err}`);
                }
            });
        }).then(() => {
            return new Promise(async(resolve, reject) => {
                reservation.on('completed', async() => {
                    try {
                        await this.verifyConferenceProperties(reservation.task.sid, 'completed', 0);
                        assert.strictEqual(reservation.task.status, 'completed', 'Task status on reservation completed');
                        resolve(reservation);
                    } catch (err) {
                        reject(`Failed to validate Conference properties on reservation completed event. Error: ${err}`);
                    }
                });
            });
        }).catch(err => {
            throw err;
        });
    }

    /**
     * Helper function to assert conference properties after reservation canceled
     * @param reservation
     * @param expectedConfStatus
     * @param participantExpSize
     * @param {Reservation.CancelOptions} [options]
     * @returns {Promise<Reservation>}
     * //**
     * @typedef {Object} Reservation.CancelOptions
     * @property {Integer} [reasonCode] - Updated reasonCode for cancelling the reservation
     * @property {String} [reason] - Updated reason for cancelling the task
     */
    assertOnResCancelEvent(reservation, expectedConfStatus, options = {}, participantExpSize) {
        const reasonCode = options.reasonCode;
        const reason = options.reason;

        return new Promise(async(resolve, reject) => {
            reservation.on('canceled', async() => {
                try {
                    await this.verifyConferenceProperties(reservation.task.sid, expectedConfStatus, participantExpSize);
                    assert.strictEqual(reservation.status, 'canceled', 'Reservation status canceled for worker');
                    assert.strictEqual(reservation.canceledReasonCode, reasonCode, 'Reservation canceled reason code');
                    reservation.task.on('canceled', async() => {
                        try {
                            assert.strictEqual(reservation.task.status, 'canceled', 'Task status on reservation canceled for worker');
                            assert.strictEqual(reservation.task.reason, reason, 'Task canceled reason');
                        } catch (err) {
                            reject(`Failed to validate task properties on reservation canceled event. Error: ${err}`);
                        }
                    });
                    resolve(reservation);
                } catch (err) {
                    reject(`Failed to validate Conference properties on reservation canceled event. Error: ${err}`);
                }
            });
        });
    }

    /**
     * Verify Conference Properties in a particular Conference
     * @param {string} taskSid - The Sid of the Task
     * @param {string} expectedConfStatus - The expected Conference Status
     * @param {number} expectedConfParticipantsSize - Expected number of Participants in the Conference
     */
    async verifyConferenceProperties(taskSid, expectedConfStatus, expectedConfParticipantsSize) {
        const conference = await this.envTwilio.fetchConferenceByName(taskSid);
        const participants = await this.envTwilio.fetchConferenceParticipants(conference.sid);

        if (typeof expectedConfStatus !== 'undefined') {
            assert.strictEqual(conference.status, expectedConfStatus, 'Conference Status');
        }

        if (typeof expectedConfParticipantsSize !== 'undefined') {
            assert.strictEqual(participants.length, expectedConfParticipantsSize, 'Conference participant size');
        }
    }
}
