import _ from 'lodash';
import { API_V1, DEFAULT_PAGE_SIZE } from '../util/Constants';
import Channel from '../Channel';
import ChannelDescriptor from '../descriptors/WorkerChannelDescriptor';
import Configuration from '../util/Configuration';
import Logger from '../util/Logger';
import Paginator from '../util/Paginator';
import path from 'path';

/**
 * Construct a data collection of {@link Channel} objects
 * @class
 * @classdesc A collection representing the {@link Channel}s available to a {@link Worker}.
 * @param {Configuration} config - The {@link Configuration}
 * @param {Channels.Options} [options]
 * @property {Map<string, Channel>} channels - The list of {@link Channel}s available to a {@link Worker}
 *//**
 * @typedef {Object} Channels.Options
 * @property {number} [pageSize] - The page size to use when querying for data
 */
export default class ChannelsEntity {
    constructor(config, request, options = {}) {
        if (!(config instanceof Configuration)) {
            throw new TypeError('Failed to initialize ChannelsEntity. <Configuration>config is a required parameter.');
        }

        this._channels = new Map();
        this._config = config;
        this._log = new Logger(`ChannelsEntity-${config._logLevel}`);
        this._request = request;
        this._pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

        if (!_.inRange(this._pageSize, 1, DEFAULT_PAGE_SIZE + 1)) {
            this._log.warn('PageSize range for ChannelsEntity must be between 1 and %d. Setting pageSize to default size=%d', DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
            this._pageSize = 1000;
        }
    }

     get channels() {
        return this._channels;
    }

    /**
     * Retrieve all the {@link Channel}s for the {@link Worker}
     * @returns {Promise.<Void>}
     */
    fetchChannels() {
        const firstPageResponse = this._getPage();
        return this._getAllChannels(firstPageResponse);
    }

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

    // Helper method to make a request to TaskRouter to fetch a particular page of {@link Channel} objects
    _getPage(args) {
        args = args || {};

        const requestURL = path.join(
            'Workspaces', this._config.workspaceSid,
            'Workers', this._config.workerSid,
            'WorkerChannels'
        );

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

    // create a Channel object and inserts it into the mapping
    _insertChannel(channelDescriptor) {
        const sid = channelDescriptor.sid;
        this._log.trace(`_insertChannel(sid=${sid}, data=${JSON.stringify(channelDescriptor)}`);

        try {
            const channel = new Channel(this._config, this._request, channelDescriptor);
            this._channels.set(sid, channel);
        } catch (err) {
            this._log.error(`Unable to create a Channel for sid=${sid}. Skipping insert into Channels map. Error: ${err}`);
        }
    }
}
