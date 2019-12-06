import EnvTwilio from '../../../util/EnvTwilio';
import Supervisor from '../../../../lib/Supervisor';
import Worker from '../../../../lib/Worker';
import { getAccessToken, getSyncToken } from '../../../util/MakeAccessToken';
const credentials = require('../../../env');
import { assert } from 'chai';
import { describe, it, beforeEach, afterEach, before, after,  } from 'mocha';
import { serveVoiceHtml, browserLauncher, event } from '../../../util/VoiceHelper';
import { voiceClientProxy } from '../../../util/VoiceClientProxy';
import SyncHelper from '../../../util/SyncHelper';

const twiMl = 'http://twimlets.com/echo?Twiml=%3CResponse%3E%0A%20%20%20%20%20%3CSay%20loop%3D%2250%22%3EA%20little%20less%20conversation%2C%20a%20little%20more%20action%20please.%3C%2FSay%3E%0A%3C%2FResponse%3E%0A&';

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
    await envTwilio.updateVoiceHandlerUrl(credentials.numberToSid, credentials.runtimeBaseUrl, functionPath);

    // Initiate Sync client
    const syncToken = await getSyncToken();
    syncClient = new SyncHelper(syncToken);

    // Clean up + prepare participant voice event maps
    await syncClient.removeMap('alice');
    await syncClient.createMap('alice');
    await syncClient.removeMap('bob');
    await syncClient.createMap('bob');

    // Launch chrome and initialize voice and sync clients for call participants
    aliceBrowser = await browserLauncher(`http://localhost:${PORT}?worker=alice&runtimeBaseUrl=${credentials.runtimeBaseUrl}`);
    supervisorBrowser = await browserLauncher(`http://localhost:${PORT}?worker=bob&runtimeBaseUrl=${credentials.runtimeBaseUrl}`);

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
        await aliceBrowser.kill();
      }

      // Close HTTP server
      await server.close();
    });

  it('should monitor conference', async() => {
    aliceVoiceClient.on('error', err => {
      throw err;
    });

    supervisorVoiceClient.on('error', err => {
      throw err;
    });

    await envTwilio.enqueueTask(credentials.numberTo, credentials.numberFrom, twiMl);

    const reservationCreated = await event(aliceWorker, 'reservationCreated', 'Did not receive: reservation#created', 5000);
    await reservationCreated.conference();
    await event(aliceVoiceClient, 'device#incoming', 'Did not receive: device#incoming', 10000);
    aliceVoiceClient.accept();
    await event(reservationCreated, 'accepted', 'Did not receive: reservation#accepted', 10000);

    await supervisorWorker.monitor(reservationCreated.task.sid, reservationCreated.sid);
    await event(supervisorVoiceClient, 'device#incoming',  'Did not receive: device#incoming', 10000);
    supervisorVoiceClient.accept();

    const participants = await envTwilio.fetchConferenceParticipants(reservationCreated.task.attributes.conference.sid);

    assert.strictEqual(participants.length, 3, 'Participant count in conference');

    const customerConferenceSid = reservationCreated.task.attributes.conference.participants.customer;
    const workerConferenceSid = reservationCreated.task.attributes.conference.participants.worker;

    const supervisorParticipant = participants.find(participant => participant.sid !== customerConferenceSid, workerConferenceSid);
    assert.strictEqual(supervisorParticipant.muted, true, 'Supervisor participant muted on join');

    supervisorVoiceClient.disconnect();
    await event(supervisorVoiceClient, 'connection#disconnect', 'Supervisor did not receive: connection#disconnect', 10000);
    const conference = await envTwilio.fetchConference(reservationCreated.task.attributes.conference.sid);

    assert.strictEqual(conference.status, 'in-progress', 'Conference status');
  });
});
