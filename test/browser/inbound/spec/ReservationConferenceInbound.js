import { getAccessToken, getSyncToken } from '../../../util/MakeAccessToken';
const credentials = require('../../../env');
import { assert } from 'chai';
import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { describe, it, beforeEach, afterEach, before, after,  } from 'mocha';
import { serveVoiceHtml, browserLauncher, event, twiMl } from '../../../util/VoiceHelper';
import { voiceClientProxy } from '../../../util/VoiceClientProxy';
import AssertionUtils from '../../../util/AssertionUtils';
import SyncHelper from '../../../util/SyncHelper';

describe('Reservation Conference Inbound', async() => {
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

    let server;
    let syncClient;
    let aliceBrowser;
    let aliceWorker;
    let aliceVoiceClient;

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

      // Clean up + prepare Alice voice event map
      await syncClient.removeMap('alice');
      await syncClient.createMap('alice');

      // Launch chrome and initialize Alice's client voice and sync clients in browser
      aliceBrowser = await browserLauncher(`http://localhost:${PORT}?worker=alice&runtimeBaseUrl=${credentials.runtimeBaseUrl}&regionOpt=${credentials.syncClientRegion}&eventgwOpt=${credentials.eventgw}&chunderwOpt=${credentials.chunderw}`);

      // Ensure that Bob is offline
      await envTwilio.updateWorkerActivity(
          credentials.multiTaskWorkspaceSid,
          credentials.multiTaskBobSid,
          credentials.multiTaskUpdateActivitySid
      );

      // Generates Alice's access token
      const aliceToken = getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);

      // Initiates Alice in NodeJS
      aliceWorker = new Worker(aliceToken, {
          connectActivitySid: credentials.multiTaskConnectActivitySid,
          ebServer: `${credentials.ebServer}/v1/wschannels`,
          wsServer: `${credentials.wsServer}/v1/wschannels`,
          logLevel: 'error'
      });
    });

    beforeEach(async function() {
      // Initiate voice client proxy for Alice
      aliceVoiceClient = await voiceClientProxy(syncClient, 'alice');

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

      // Removes listeners
      aliceWorker.removeAllListeners();

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

      // Close HTTP server
      await server.close();
    });

    it('ORCH-557 | should enqueue task and redirect customers call to worker', async() => {
      // Listen on voice errors
      aliceVoiceClient.on('error', err => {
        throw err;
      });

      await aliceVoiceClient.waitForEvent('device#ready', 10);

      await envTwilio.enqueueTask(credentials.numberTo, credentials.numberFrom, twiMl);

      const reservationCreated = await event(aliceWorker, 'reservationCreated', 'Did not receive: reservation#created', 10000);

      assert.strictEqual(reservationCreated.status, 'pending', 'Reservation status');

      await reservationCreated.conference();
      const voiceConnectionPending = await event(aliceVoiceClient, 'device#incoming', 'Did not receive: device#incoming', 10000);
      assert.strictEqual(voiceConnectionPending._status, 'pending', 'Call status');
      aliceVoiceClient.accept();

      const reservationAccepted = await event(reservationCreated, 'accepted', 'Did not receive: reservation#accepted', 10000);

      assert.strictEqual(reservationAccepted.status, 'accepted', 'Reservation status');

      AssertionUtils.assertSid(reservationAccepted.task.attributes.conference.sid, 'CF', 'Expected conference sid to be: CF{32}');
      AssertionUtils.assertSid(reservationAccepted.task.attributes.conference.participants.worker, 'CA', 'Expected conference worker sid to be: CA{32}');
      AssertionUtils.assertSid(reservationAccepted.task.attributes.conference.participants.customer, 'CA', 'Expected conference customer to be: CA{32}');

      aliceVoiceClient.disconnect();
      await event(reservationAccepted, 'wrapup', 'Did not receive: reservation#wrapup', 10000);
      assert.strictEqual(reservationAccepted.status, 'wrapping', 'Reservation status');
    });
});
