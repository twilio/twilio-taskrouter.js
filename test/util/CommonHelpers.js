import _ from 'lodash';
import { assert } from 'chai';
import { pauseTestExecution } from '../voice/VoiceBase';
import AssertionUtils from './AssertionUtils';
import { TRANSFER_MODE } from './Constants';

const credentials = require('../env');

/**
 * Utility class for common helper methods for both outbound and inbound tests
 * @param {EnvTwilio} envTwilio - The Twilio Client Helper library
 */
export default class CommonHelpers {
    constructor(envTwilio) {
        if (!_.isObject(envTwilio)) {
            throw new TypeError('Failed to instantiate CommonHelpers. <EnvTwilio>envTwilio is a required parameter.');
        }

        this.envTwilio = envTwilio;
    }

    async verifyDualChannelRecording(reservation, phoneNumber) {
        const participantProperties = await this.envTwilio.fetchParticipantPropertiesByName(reservation.task.sid);
        const participant = participantProperties.get(phoneNumber);
        const retryCount = 3;
        const expectedRecordingCount = 1;
        const expectedChannelCount = 2;
        let attempts = 0;
        let recordingCount = 0;
        let channelCount = 0;
        while (attempts < retryCount) {
            await pauseTestExecution(1000);
            const recordings = await this.envTwilio.fetchCallRecordings(participant.callSid);
            recordingCount = recordings.length;
            if (recordingCount === expectedRecordingCount) {
                channelCount = recordings[0].channels;
                break;
            }
            attempts++;
        }
        assert.strictEqual(recordingCount, expectedRecordingCount, `There should be ${expectedRecordingCount} recordings for dual channel recording`);
        assert.strictEqual(channelCount, expectedChannelCount, `There should be ${expectedChannelCount} channels for dual channel recording`);
    }

    verifyIncomingColdTransfer(reservation, reject) {
        try {
            AssertionUtils.verifyTransferProperties(reservation.transfer,
                                                    credentials.multiTaskAliceSid,
                                                    credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                    'initiated', `Transfer (account ${credentials.accountSid}, task ${reservation.task.sid})`);
            AssertionUtils.verifyTransferProperties(reservation.task.transfers.incoming,
                                                    credentials.multiTaskAliceSid,
                                                    credentials.multiTaskBobSid, TRANSFER_MODE.cold, 'WORKER',
                                                    'initiated', `Incoming transfer (account ${credentials.accountSid}, task ${reservation.task.sid})`);

            assert.strictEqual(reservation.task.status, 'reserved', 'Transfer Task Assignment Status');
        } catch (err) {
            reject(
                `Failed to validate Reservation and Transfer properties on reservation created event for Task ${reservation.task.sid}. Error: ${err}`);
        }
    }
}
