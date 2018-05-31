import _ from 'lodash';
import Activity from '../Activity';
import ActivityDescriptor from '../descriptors/ActivityDescriptor';
import { API_V1, DEFAULT_PAGE_SIZE } from '../util/Constants';
import Paginator from '../util/Paginator';
import { ACTIVITIES_LIST } from '../util/Routes';

/**
 * Construct a data collection of {@link Activity} objects
 * @class
 * @classdesc A collection representing the possible {@link Activity} states of a Worker.
 * @param {Worker} worker - The {@link Worker}
 * @param {Activities.Options} [options]
 * @property {Map<string, Activity>} activities - The list of possible states a {@link Worker} can be
 *//**
 * @typedef {Object} Activities.Options
 * @property {number} [pageSize] - The page size to use when querying for data
 */
export default class ActivitiesEntity {
    constructor(worker, request, options = {}) {
        if (!_.isObject(worker)) {
            throw new TypeError('Failed to initialize ActivitiesEntity. <Worker>worker is a required parameter.');
        }

        this._activities = new Map();
        this._log = worker.getLogger(`ActivitiesEntity-${worker.sid}`);
        this._request = request;
        this._worker = worker;

        this._pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
        if (!_.inRange(this._pageSize, 1, DEFAULT_PAGE_SIZE + 1)) {
            this._log.warn('PageSize range for ActivitiesEntity must be between 1 and %d. Setting pageSize to default size=%d', DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
            this._pageSize = 1000;
        }
    }

    get activities() {
        return this._activities;
    }

    /**
     * Retrieve the list of {@link Activity} objects
     * @returns {Promise.<Void>}
     */
    fetchActivities() {
        const firstPageResponse = this._getPage();
        return this._getAllActivities(firstPageResponse);
    }

    // recursively fetches the list of Activities
    _getAllActivities(page) {
        return page.then(paginator => {
            paginator.items.forEach(item => {
                this._insertActivity(item);
            });

            if (!paginator.hasNextPage) {
                return Promise.resolve();
            }

            return this._getAllActivities(paginator.nextPage());
        });
    }


    // Helper method to make a request to TaskRouter to fetch a particular page of {@link Activity} objects
    _getPage(args) {
        args = args || {};

        const requestURL = this._worker.getRoutes().getRoute(ACTIVITIES_LIST).path;
        const requestParams = {
            PageSize: this._pageSize
        };

        if (args.AfterSid) {
            requestParams.AfterSid = args.AfterSid;
        }

        return this._request.get(requestURL, API_V1, requestParams).then(response => {
            return new Paginator(
                response.contents.map(x => new ActivityDescriptor(x)),
                nextToken => this._getPage({ AfterSid: nextToken }),
                response.after_sid
            );
        });
    }

    // create an Activity object and inserts it into the mapping
    _insertActivity(activityDescriptor) {
        const sid = activityDescriptor.sid;
        this._log.trace(`_insertActivity(sid=${sid}, data=${JSON.stringify(activityDescriptor)}`);

        try {
            const activity = new Activity(this._worker, activityDescriptor);
            this._activities.set(sid, activity);
        } catch (err) {
            this._log.error(`Unable to create an Activity for sid=${sid}. Skipping insert into Activities map. Error: ${err}`);
        }
    }
}
