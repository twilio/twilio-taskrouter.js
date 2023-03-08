const DEFAULT_BASE_TIMEOUT = 800;
const DEFAULT_MAX_TIMEOUT_LIMIT = 3000;

export default class RetryUtil {
    #BASE_TIMEOUT;
    #MAX_TIMEOUT_LIMIT;


    constructor(baseTimeout = DEFAULT_BASE_TIMEOUT, maxTimeoutLimit = DEFAULT_MAX_TIMEOUT_LIMIT) {
        if (this.#isValidNumber(baseTimeout)) {
            this.#BASE_TIMEOUT = baseTimeout;
        }

        if (this.#isValidNumber(maxTimeoutLimit)) {
            this.#MAX_TIMEOUT_LIMIT = maxTimeoutLimit;
        }
    }

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
     #generateRandomNumber(x = 100) {
        return Math.ceil(Math.random() * x);
     }

     generateBackoffInterval(intervalCount) {
        if (!this.#isValidNumber(intervalCount)) {
            throw new Error('Interval count should be a positive finite number');
        }

        const calculatedBackoff = Math.max(this.#BASE_TIMEOUT,
            this.#BASE_TIMEOUT * (Math.pow(2, intervalCount) - 1) / 2);
        return Math.min(Math.max(this.#BASE_TIMEOUT, calculatedBackoff), this.#MAX_TIMEOUT_LIMIT )
            + this.#generateRandomNumber();
    }

     whenReady(retryCount) {
         return new Promise(resolve => {
             const backoff = this.generateBackoffInterval(retryCount);
             return setTimeout(() => resolve(backoff), backoff);
         });
    }
}

