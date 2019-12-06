import { getAccessToken, getSyncToken } from '../../../util/MakeAccessToken';
const credentials = require('../../../env');
import { assert } from 'chai';
import EnvTwilio from '../../../util/EnvTwilio';
import Worker from '../../../../lib/Worker';
import { describe, it, beforeEach, afterEach, before, after,  } from 'mocha';
import { serveVoiceHtml, browserLauncher, event } from '../../../util/VoiceHelper';
import { voiceClientProxy } from '../../../util/VoiceClientProxy';
import SyncHelper from '../../../util/SyncHelper';

describe('Reservation Conference Outbound', async() => {

  const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.env);

  let server;
  let syncClient;
  let aliceBrowser;
  let customerBrowser;
  let aliceWorker;
  let aliceVoiceClient;
  let customerVoiceClient;

    before(async() => {
      // Start server to host voice sdk and client-side sync client
      const PORT = 3471;
      server = await serveVoiceHtml(PORT);

       // Initiate Sync client
      const syncToken = await getSyncToken();
      syncClient = new SyncHelper(syncToken);

      // Clean up + prepare Alice's voice event map
      await syncClient.removeMap('alice');
      await syncClient.createMap('alice');

      // Clean up + prepare Customer's voice event map
      await syncClient.removeMap('customer');
      await syncClient.createMap('customer');

      // Launch chrome and initialize Alice's client voice and sync clients in browser
      aliceBrowser = await browserLauncher(`http://localhost:${PORT}?worker=alice&runtimeBaseUrl=${credentials.runtimeBaseUrl}`);

      // Launch chrome and initialize Customer's client voice and sync clients in browser
      customerBrowser = await browserLauncher(`http://localhost:${PORT}?worker=customer&runtimeBaseUrl=${credentials.runtimeBaseUrl}`);

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

      await event(aliceWorker, 'ready', 'Did not receive alice#ready', 5000);
    });

    beforeEach(async function() {
      // Initiate voice client proxy for Alice
      aliceVoiceClient = await voiceClientProxy(syncClient, 'alice');

      // Initiate voice client proxy for Customer
      customerVoiceClient = await voiceClientProxy(syncClient, 'customer');

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
      await customerVoiceClient.refreshBrowserClient();

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

      if (customerBrowser) {
        await customerBrowser.kill();
      }

      // Close HTTP server
      await server.close();
    });

  it('should create and accept outbound task', async() => {
    aliceVoiceClient.on('error', err => {
      throw err;
    });

    customerVoiceClient.on('error', err => {
      throw err;
    });

    const taskSid = await aliceWorker.createTask('client:customer', aliceWorker.attributes.contact_uri, credentials.multiTaskWorkflowSid, credentials.multiTaskQueueSid);
    const newReservation = await event(aliceWorker, 'reservationCreated', 'Did not receive alice#reservationCreated', 5000);

    assert.strictEqual(newReservation.task.sid, taskSid, 'reservation.task.sid | createTask() => sid');
    assert.strictEqual(newReservation.task.attributes.from, aliceWorker.attributes.contact_uri, 'task#attributes#from');
    assert.strictEqual(newReservation.task.attributes.outbound_to, 'client:customer', 'task#attributes#outbound_to');
    assert.strictEqual(newReservation.status, 'pending', 'reservation.status');
    assert.strictEqual(newReservation.task.status, 'reserved', 'reservation.status');
    assert.strictEqual((await aliceWorker.reservations).has(newReservation.sid), true, `Expected alice.reservations map to contain reservation: ${newReservation.sid}`);

    await newReservation.conference();
    await event(aliceVoiceClient, 'device#incoming', 'Did not receive: device#incoming', 5000);
    await aliceVoiceClient.accept();

    await event(customerVoiceClient, 'device#incoming', 'Did not receive: device#incoming', 5000);
    await customerVoiceClient.accept();

    const acceptedReservation = await event(newReservation, 'accepted', 'Did not receive reservation#accepted', 5000);
    assert.strictEqual(acceptedReservation.status, 'accepted', 'Accepted reservation status');
    assert.strictEqual(acceptedReservation.task.status, 'assigned', 'Accepted task status');
  });

});
