import EnvTwilio from '../../../util/EnvTwilio';
import Supervisor from '../../../../lib/Supervisor';
import Worker from '../../../../lib/Worker';
import { getAccessToken, getSyncToken } from '../../../util/MakeAccessToken';
const credentials = require('../../../env');
import { assert } from 'chai';
import { describe, it, beforeEach, afterEach, before, after,  } from 'mocha';
import { serveVoiceHtml, browserLauncher, event, twiMl } from '../../../util/VoiceHelper';
import { voiceClientProxy } from '../../../util/VoiceClientProxy';
import SyncHelper from '../../../util/SyncHelper';

describe('Supervisor Inbound', function() {

  const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

  let server;
  let syncClient;

  let aliceBrowser;
  let aliceWorker;
  let aliceVoiceClient;

  let supervisorBrowser;
  let supervisorWorker;
  let supervisorVoiceClient;

  before(async() => {
    // Start server to host voice sdk and client-side sync client
    const PORT = 3471;
    server = await serveVoiceHtml(PORT);

    // Update enqueue handler to customize enqueue TwiML
    const taskAttributes = { to: 'Alice' };
    const functionPath = 'enqueueTask?taskAttributes=' + encodeURI(JSON.stringify(taskAttributes)) + '&workflowSid=' + credentials.multiTaskWorkflowSid;
    await envTwilio.updateVoiceHandlerUrl(credentials.numberToSid, credentials.prodRuntimeDomain, functionPath);

    // Initiate Sync client
    const syncToken = await getSyncToken();
    syncClient = new SyncHelper(syncToken, { region: credentials.syncClientRegion });

    // Clean up + prepare participant voice event maps
    await syncClient.removeMap('alice');
    await syncClient.createMap('alice');
    await syncClient.removeMap('bob');
    await syncClient.createMap('bob');

    // Launch chrome and initialize voice and sync clients for call participants
    aliceBrowser = await browserLauncher(`http://localhost:${PORT}?worker=alice&runtimeBaseUrl=${credentials.runtimeBaseUrl}&regionOpt=${credentials.syncClientRegion}&eventgwOpt=${credentials.eventgw}&chunderwOpt=${credentials.chunderw}`);
    supervisorBrowser = await browserLauncher(`http://localhost:${PORT}?worker=bob&runtimeBaseUrl=${credentials.runtimeBaseUrl}&regionOpt=${credentials.syncClientRegion}&eventgwOpt=${credentials.eventgw}&chunderwOpt=${credentials.chunderw}`);

    // Ensure that Bob is offline
    await envTwilio.updateWorkerActivity(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskBobSid,
        credentials.multiTaskUpdateActivitySid
    );

    // Generate worker tokens
    const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
    const supervisorToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid, null, 'supervisor');

    // Initialise workers
    aliceWorker = new Worker(aliceToken, {
          connectActivitySid: credentials.multiTaskConnectActivitySid,
          ebServer: `${credentials.ebServer}/v1/wschannels`,
          wsServer: `${credentials.wsServer}/v1/wschannels`,
          logLevel: 'error'
    });

    await event(aliceWorker, 'ready', 'Did not receive alice#ready', 5000);

    supervisorWorker = new Supervisor(supervisorToken, {
        ebServer: `${credentials.ebServer}/v1/wschannels`,
        wsServer: `${credentials.wsServer}/v1/wschannels`,
        logLevel: 'error'
    });

    await event(supervisorWorker, 'ready', 'Did not receive supervisor#ready', 5000);
  });

    beforeEach(async function() {
      // Initiate voice client proxies
      aliceVoiceClient = await voiceClientProxy(syncClient, 'alice');
      supervisorVoiceClient = await voiceClientProxy(syncClient, 'bob');


      // Deletes tasks
      await envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);

      // Sets Alice to idle
      await envTwilio.updateWorkerActivity(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskAliceSid,
        credentials.multiTaskConnectActivitySid
      );
    });

    afterEach(async() => {
      // Refresh page
      await aliceVoiceClient.refreshBrowserClient();
      await supervisorVoiceClient.refreshBrowserClient();

      // Removes listeners
      aliceWorker.removeAllListeners();
      supervisorWorker.removeAllListeners();

      // Deletes tasks
      await envTwilio.deleteAllTasks(credentials.multiTaskWorkspaceSid);

      // Sets Alice to offline
      await envTwilio.updateWorkerActivity(
        credentials.multiTaskWorkspaceSid,
        credentials.multiTaskAliceSid,
        credentials.multiTaskUpdateActivitySid
      );
    });

    after(async() => {
      // Kill browser
      if (aliceBrowser) {
        await aliceBrowser.kill();
      }

      if (supervisorBrowser) {
        await supervisorBrowser.kill();
      }

      // Close HTTP server
      await server.close();
    });

  it('ORCH-558 | should monitor conference', async() => {
    aliceVoiceClient.on('error', err => {
      throw err;
    });

    supervisorVoiceClient.on('error', err => {
      throw err;
    });

    await aliceVoiceClient.waitForEvent('device#ready', 10);
    await supervisorVoiceClient.waitForEvent('device#ready', 10);

    await envTwilio.enqueueTask(credentials.numberTo, credentials.numberFrom, twiMl);

    const reservation = await event(aliceWorker, 'reservationCreated', 'Did not receive: reservation#created', 10000);
    await reservation.conference();
    await event(aliceVoiceClient, 'device#incoming', 'Did not receive: device#incoming', 10000);
    aliceVoiceClient.accept();
    await event(reservation, 'accepted', 'Did not receive: reservation#accepted', 10000);

    await supervisorWorker.monitor(reservation.task.sid, reservation.sid);
    await event(supervisorVoiceClient, 'device#incoming',  'Did not receive: device#incoming', 10000);
    supervisorVoiceClient.accept();

    await supervisorVoiceClient.waitForEvent('connection#accept', 10);
    const participants = await envTwilio.fetchConferenceParticipants(reservation.task.attributes.conference.sid);

    assert.strictEqual(participants.length, 3, 'Participant count in conference');

    const customerConferenceSid = reservation.task.attributes.conference.participants.customer;
    const workerConferenceSid = reservation.task.attributes.conference.participants.worker;

    const supervisorParticipant = participants.find(participant => participant.sid !== customerConferenceSid, workerConferenceSid);
    assert.strictEqual(supervisorParticipant.muted, true, 'Supervisor participant muted on join');

    supervisorVoiceClient.disconnect();
    await event(supervisorVoiceClient, 'connection#disconnect', 'Supervisor did not receive: connection#disconnect', 10000);
    const conference = await envTwilio.fetchConference(reservation.task.attributes.conference.sid);

    assert.strictEqual(conference.status, 'in-progress', 'Conference status');

    aliceVoiceClient.disconnect();
    await event(reservation, 'wrapup', 'Alice: Did not receive: reservation#wrapup', 10000);
    assert.strictEqual(reservation.status, 'wrapping', 'Reservation status');
  });
});
