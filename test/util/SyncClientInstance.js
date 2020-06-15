const SyncClient = require('twilio-sync');
const credentials = require('../env');
import { Async } from 'async-test-tools';
import { expect } from 'chai';


export default class SyncClientInstance {
    constructor(accessToken) {
        // region and productId are required for Flex sync maps
        this.syncClient = new SyncClient(accessToken, {
            region: credentials.region,
            productId: 'flex_insights'
        });

        this.syncClient.on('connectionError', this.connectionErrorHandler);
    }

    shutdown() {
        this.syncClient.removeListener('connectionError', this.connectionErrorHandler);
        this.syncClient.shutdown();
    }

    connectionErrorHandler(connectionError) {
        console.log('Sync Client connection was interrupted: ' + connectionError.message +
          ' (isTerminal: ' + connectionError.terminal + ')');
    }

    /**
     * Fetches sync map for a task
     * @param {string} taskSid - task sid
     */
    async _fetchSyncMap(taskSid) {
        return this.syncClient.map({
            id: `${taskSid}.CS`,    // these values can change anytime without notice
            mode: 'open_existing'
        });
    }

    /**
     * Verify that a worker joined the conference
     * @param {string} syncMap - Sync Map for a task
     * @param {string} workerSid - The expected worker sid to join the conference
     */
    async waitForWorkerJoin(syncMap, workerSid) {
        return Async.waitForEvent(syncMap, 'itemAdded').then((args) => {
            expect(args[0].item.value.status).to.equal('joined');
            expect(args[0].item.value.worker_sid).to.equal(workerSid);
        });
    }
}
