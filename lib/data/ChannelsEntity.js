import inRange from 'lodash/inRange';
import { API_V1, DEFAULT_PAGE_SIZE } from '../util/Constants';
import Channel from '../Channel';
import ChannelDescriptor from '../descriptors/WorkerChannelDescriptor';
import Paginator from '../util/Paginator';
import Worker from '../Worker';
import { WORKER_CHANNELS } from '../util/Routes';

/**
 * @typedef {Object} Channels.Options
 * @property {number} [pageSize] - The page size to use when querying for data
 */

/**
 * Construct a data collection of {@link Channel} objects
 * @classdesc A collection representing the {@link Channel}s available to a {@link Worker}.
 * @param {Worker} worker - The {@link Worker}
 * @param {Request} request - The {@link Request}
 * @param {Channels.Options} [options]
 * @property {Map<string, Channel>} channels - The list of {@link Channel}s available to a {@link Worker}
 */
export default class ChannelsEntity {
    /**
     * @param {Worker} worker - The {@link Worker}
     * @param {import('../util/Request')} request - The {@link Request}
     * @param {Channels.Options} [options]
     */
    constructor(worker, request, options = {}) {
        if (!(worker instanceof Worker)) {
            throw new TypeError('Failed to initialize ChannelsEntity. <Worker>worker is a required parameter.');
        }

        /**
         * @private
         * @type {Map}
         */
        this._channels = new Map();
        /**
         * @private
         * @type {import('../util/Logger')}
         */
        this._log = worker.getLogger('ChannelsEntity');
        /**
         * @private
         * @type {import('../util/Request')}
         */
        this._request = request;
        /**
         * @private
         * @type {string}
         */
        this._pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
        /**
         * @private
         * @type {Worker}
         */
        this._worker = worker;

        if (!inRange(this._pageSize, 1, DEFAULT_PAGE_SIZE + 1)) {
            this._log.warn('PageSize range for ChannelsEntity must be between 1 and %d. Setting pageSize to default size=%d', DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
            this._pageSize = 1000;
        }
    }

    /**
     * @returns {Map<string, Channel>}
     */
     get channels() {
        return this._channels;
    }

    /**
     * Retrieve all the {@link Channel}s for the {@link Worker}
     * @public
     * @returns {Promise<Map<string, Channel>>}
     */
    fetchChannels() {
        const firstPageResponse = this._getPage();
        return this._getAllChannels(firstPageResponse);
    }

    /**
     * @private
     * @param {Paginator} page
     * @returns {Promise<Map<string, Channel>>}
     */
    _getAllChannels(page) {
        return page.then(paginator => {
            paginator.items.forEach(item => {
                this._insertChannel(item);
            });

            if (!paginator.hasNextPage) {
                return Promise.resolve();
            }

            return this._getAllChannels(paginator.nextPage());
        });
    }

    /**
     * Helper method to make a request to TaskRouter to fetch a particular page of {@link Channel} objects
     * @private
     * @param {Object} args
     * @returns {Promise<Map<string, Channel>>}
     */
    _getPage(args) {
        args = args || {};

        const requestURL = this._worker.getRoutes().getRoute(WORKER_CHANNELS).path;
        const requestParam = {
            PageSize: this._pageSize
        };

        if (args.AfterSid) {
            requestParam.AfterSid = args.AfterSid;
        }

        return this._request.get(requestURL, API_V1, requestParam).then(response => {
            return new Paginator(
                response.contents.map(x => new ChannelDescriptor(x)),
                nextToken => this._getPage({ AfterSid: nextToken }),
                response.after_sid
            );
        });
    }

    /**
     * create a Channel object and inserts it into the mapping
     * @private
     * @param {ChannelDescriptor } channelDescriptor - {@link ChannelDescriptor}
     */
    _insertChannel(channelDescriptor) {
        const sid = channelDescriptor.sid;
        this._log.trace(`_insertChannel(sid=${sid}, data=${JSON.stringify(channelDescriptor)}`);

        try {
            const channel = new Channel(this._worker, this._request, channelDescriptor);
            this._channels.set(sid, channel);
        } catch (err) {
            this._log.error(`Unable to create a Channel for sid=${sid}. Skipping insert into Channels map. Error: ${err}`);
        }
    }
}
