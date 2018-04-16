const Errors = require('./Constants').twilioErrors;

/**
 * Construct a {@link Paginator}.
 * @class
 * @classdesc A {@link Paginator} helper class.
 * @param {boolean} hasNextPage - Whether there is another page of elements.
 * @param {Array} items - An array of elements on the current page.
 */
export default class Paginator {
    constructor(items, source, nextToken) {
        if (!items) {
            throw Errors.INVALID_ARGUMENT.clone('Error instantiating Paginator. <Array>items is a required parameter.');
        }

        if (!source) {
            throw Errors.INVALID_ARGUMENT.clone('Error instantiating Paginator. <Function>source is a required parameter.');
        }

        this._nextToken = nextToken;
        this._source = source;

        this.hasNextPage = !!this._nextToken;
        this.items = items;
    }

    /**
    * Fetch the next page of elements.
     * @return {Promise<Paginator>} - Rejected if the {@link Paginator} has no next page to fetch.
     */
    nextPage() {
        if (!this.hasNextPage) {
            return Promise.reject(Errors.TASKROUTER_ERROR.clone('Error getting the next page. No next page exists.'));
        }
        return this._source(this._nextToken);
    }
}

