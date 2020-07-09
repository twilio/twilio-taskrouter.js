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
        return Async.waitForEvent(syncMap, 'itemAdded', (args) => this.hasWorkerStatus(args, workerSid, 'joined'));
    }

    /**
     * Verify that a worker left the conference
     * @param {string} syncMap - Sync Map for a task
     * @param {string} workerSid - The expected worker sid to join the conference
     */
    async waitForWorkerLeave(syncMap, workerSid) {
        return Async.waitForEvent(syncMap, 'itemUpdated', (args) => this.hasWorkerStatus(args, workerSid, 'left'));
    }

    hasWorkerStatus(args, workerSid, status) {
        if (Array.isArray(args)) {
            for (let arg in args) {
                if (arg.item.value.worker_sid === workerSid) {
                    expect(arg.item.value.status).to.equal(status);
                    return true;
                }
            }
        } else if (args.item.value.worker_sid === workerSid) {
            expect(args.item.value.status).to.equal(status);
            return true;
        }
        return false;
    }

    /**
     * Verify customer hold status
     * @param {string} syncMap - Sync Map for a task
     * @param {string} hold - The expected hold status for cusomter
     */
    async waitForCustomerHoldStatus(syncMap, hold) {
        return Async.waitForEvent(syncMap, 'itemUpdated', (args) => this.isCustomerHold(args, hold));
    }

    isCustomerHold(args, hold) {
        if (Array.isArray(args)) {
            for (let arg in args) {
                if (arg.item.value.participant_type === 'customer') {
                    expect(arg.item.value.hold).to.equal(hold);
                    return true;
                }
            }
        } else if (args.item.value.participant_type === 'customer') {
            expect(args.item.value.hold).to.equal(hold);
            return true;
        }
        return false;
    }
}
