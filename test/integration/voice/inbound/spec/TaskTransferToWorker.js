import EnvTwilio from '../../../../util/EnvTwilio';
import Worker from '../../../../../lib/Worker';
import { getAccessToken } from '../../../../util/MakeAccessToken';
import AssertionUtils from '../../../../util/AssertionUtils';
import OutboundCommonHelpers from '../../../../util/OutboundCommonHelpers';
import CommonHelpers from '../../../../util/CommonHelpers';
import { pauseTestExecution } from '../../VoiceBase';
import { TRANSFER_MODE } from '../../../../util/Constants';
import { longTwimletUrl } from '../../VoiceBase';
import { buildRegionForEventBridge } from '../../../../integration_test_setup/IntegrationTestSetupUtils';

const STATUS_CHECK_DELAY = 1000;

const credentials = require('../../../../env');
const chai = require('chai');
chai.use(require('sinon-chai'));

describe('Task Transfer to Worker for Inbound Voice Task', () => {
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                      credentials.multiTaskAliceSid, null, null, { useSync: true });
    const bobToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid,
                                    credentials.multiTaskBobSid);
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
    const outboundCommonHelpers = new OutboundCommonHelpers(envTwilio);
    const commonHelpers = new CommonHelpers(envTwilio);
    let alice;
    let bob;

    beforeEach(() => {
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            // Make Alice available
            alice = new Worker(aliceToken, {
                connectActivitySid: credentials.multiTaskConnectActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge
            });

            alice.on('ready', async() => {
                alice.setAttributes({ 'contact_uri': credentials.workerNumber });
            });

            // Bob stays offline
            bob = new Worker(bobToken, {
                connectActivitySid: credentials.multiTaskUpdateActivitySid,
                region: buildRegionForEventBridge(credentials.region),
                edge: credentials.edge
            });

            bob.on('ready', async() => {
                bob.setAttributes({ 'contact_uri': credentials.supervisorNumber });
            });
            return outboundCommonHelpers.listenToWorkerReadyOrErrorEvent(alice);
        });
    });

    afterEach(() => {
        alice.removeAllListeners();
        bob.removeAllListeners();
        return envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid).then(() => {
            return Promise.all([envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid,
                                                               credentials.multiTaskBobSid, credentials.multiTaskUpdateActivitySid),
                                envTwilio.updateWorkerActivity(credentials.multiTaskWorkspaceSid,
                                                               credentials.multiTaskAliceSid, credentials.multiTaskUpdateActivitySid)]);
        });
    });

    describe('#Cold Transfer to a Worker', () => {
        it('should complete transfer of an inbound call to worker B successfully with dual recording channels', () => {
            return new Promise(async(resolve, reject) => {
                try {
                    // create an inbound call from customer to contact center
                    const call = await envTwilio.createCall(credentials.flexCCNumber, credentials.customerNumber, longTwimletUrl);
                    AssertionUtils.assertSid(call.sid, 'CA', 'Expected the create call sid to be: CA{32}');
                } catch (error) {
                    reject(`Error in establishing voice call. Error: ${error}`);
                }

                alice.on('reservationCreated', async(aliceReservation) => {
                    aliceReservation.on('accepted', async() => {
                        try {
                            try {
                                await commonHelpers.verifyDualChannelRecording(aliceReservation, credentials.workerNumber);
                            } catch (err) {
                                reject(`Error verifying dual channel recordings for ${aliceReservation.task.sid}. Error: ${err}`);
                            }
                            await outboundCommonHelpers.assertOnTransferorAcceptedAndInitiateTransfer(aliceReservation,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      true,
                                                                                                      credentials.multiTaskBobSid,
                                                                                                      TRANSFER_MODE.cold, 'in-progress',
                                                                                                      2, 'inbound');
                        } catch (err) {
                            reject(`Error caught after receiving reservation accepted event for Inbound Task for Alice ${aliceReservation.task.sid}. Error: ${err}`);
                        }
                    });

                    bob.on('reservationCreated', async(bobReservation) => {
                        commonHelpers.verifyIncomingColdTransfer(bobReservation, reject);

                        Promise.all([outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(aliceReservation, true),
                                    outboundCommonHelpers.assertOnResWrapUpAndCompleteEvent(bobReservation, false, 0)])
                            .then(() => {
                                resolve('Test for cold transfer to worker B is finished');
                            })
                            .catch(err => reject(`Error caught while wrapping and completing reservation for Task ${bobReservation.task.sid}. Error: ${err}`));

                        bobReservation.on('accepted', async() => {
                            try {
                                await commonHelpers.verifyDualChannelRecording(bobReservation, credentials.supervisorNumber);
                            } catch (err) {
                                reject(`Error verifying dual channel recordings for Bob ${bobReservation.task.sid}. Error: ${err}`);
                            }

                            try {
                                await outboundCommonHelpers.assertOnTransfereeAccepted(bobReservation, 'in-progress', 2, 'inbound');
                            } catch (err) {
                                reject(`Error caught after receiving Bob's reservation accepted event for Task ${bobReservation.task.sid}. Error: ${err}`);
                            }
                        });

                        // wait for wrapup event on aliceReservation before issuing conference instruction for Worker B
                        await pauseTestExecution(STATUS_CHECK_DELAY);

                        // issue the conference instruction for Bob (it will accept the reservation too)
                        bobReservation.conference({ endConferenceOnExit: true,
                            record: 'true',
                            recordingChannels: 'dual',
                            recordingStatusCallback: 'https://myapp.com/recording-events',
                            recordingStatusCallbackEvent: 'in-progress completed',
                            recordingStatusCallbackMethod: 'POST' }).catch(err => {
                            reject(`Error in establishing conference for Inbound Task ${bobReservation.task.sid}. Error: ${err}`);
                        });
                    });

                    aliceReservation.conference({
                        endConferenceOnExit: false,
                        record: 'true',
                        recordingChannels: 'dual',
                        recordingStatusCallback: 'https://myapp.com/recording-events',
                        recordingStatusCallbackEvent: 'in-progress completed',
                        recordingStatusCallbackMethod: 'POST'
                    }).catch(err => {
                        reject(`Error in establishing conference. Error: ${err}`);
                    });
                });
            });
        }).timeout(100000);
    });
});
