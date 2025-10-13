import Logger from './Logger';

const DEFAULT_BASE_TIMEOUT = 800;
const DEFAULT_MAX_TIMEOUT_LIMIT = 3000;

/**
 * Construct a custom {@link RetryUtil}
 * @param {number} [baseTimeout]
 * @param {number} [maxTimeoutLimit]
 */
export default class RetryUtil {
    /**
     * @private
     * @type {number}
     */
    #BASE_TIMEOUT;
    /**
     * @private
     * @type {number}
     */
    #MAX_TIMEOUT_LIMIT;


    /**
     * @param {number} [baseTimeout]
     * @param {number} [maxTimeoutLimit]
     */
    constructor(baseTimeout = DEFAULT_BASE_TIMEOUT, maxTimeoutLimit = DEFAULT_MAX_TIMEOUT_LIMIT) {
        if (this.#isValidNumber(baseTimeout)) {
            this.#BASE_TIMEOUT = baseTimeout;
        }

        if (this.#isValidNumber(maxTimeoutLimit)) {
            this.#MAX_TIMEOUT_LIMIT = maxTimeoutLimit;
        }

        /**
         * @type {Logger}
         * @private
         */
        this._log = new Logger('RetryUtil');

    }

    /**
     * @private
     * @param {*} x
     * @return {boolean}
     */
    #isValidNumber(x) {
        return Number.isFinite(x) && x > 0;
    }

    /**
     * This helps to avoid cases in which many clients are synchronized by some
     * situation and all retry at once, sending requests in synchronized waves.
     * The value of random_number_milliseconds is recalculated after each retry
     * request.
     *
     * Ref: https://cloud.google.com/iot/docs/how-tos/exponential-backoff#example_algorithm
     *
     * Ref: https://en.wikipedia.org/wiki/Exponential_backoff#Expected_backoff
     */
    /**
     * @private
     * @param {number} x
     * @return {number}
     */
    #generateRandomNumber(x = 100) {
        return Math.ceil(Math.random() * x);
    }

    /**
     * @public
     * @param {number} retryCount
     * @return {number}
     */
    generateBackoffInterval(retryCount) {
        if (!this.#isValidNumber(retryCount)) {
            this._log.warn('Interval count should be a positive finite number. Resetting retryCount to 1, Current value:' + retryCount);
            retryCount = 1;
        }

        const calculatedBackoff = Math.max(this.#BASE_TIMEOUT,
            this.#BASE_TIMEOUT * (Math.pow(2, retryCount) - 1) / 2);
        return Math.min(Math.max(this.#BASE_TIMEOUT, calculatedBackoff), this.#MAX_TIMEOUT_LIMIT )
            + this.#generateRandomNumber();
    }

    /**
     * @public
     * @param {number} retryCount
     * @return {Promise}
     */
    whenReady(retryCount) {
        return new Promise(resolve => {
            const backoff = this.generateBackoffInterval(retryCount);
            return setTimeout(() => resolve(backoff), backoff);
        });
    }
}
