/**
 * @param {string} timeString
 * @return {null | Date}
 */
export function parseTime(timeString) {
    try {
        return new Date(timeString);
    } catch (e) {
        return null;
    }
}

/**
 * @param {Object} options
 * @param {Object} types
 * @return {boolean}
 */
export function validateOptions(options, types) {
    for (const key in options) {
        if (key in types && !types[key](options[key])) {
            throw new TypeError(`Option key: ${key} does not meet the required type.`);
        }
    }
    return true;
}

/**
 * @param {Object | undefined | null} err
 * @return {number | undefined | null}
 */
export function getStatusCodeFromError(err) {
    return err?.response?.status;
}
