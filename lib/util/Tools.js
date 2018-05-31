const constants = require('./Constants');
const Errors = constants.twilioErrors;

export function verifyJWT(token) {
    if (!token) {
        throw Errors.INVALID_ARGUMENT.clone('Unable to verify JWT. <string>token is a required parameter.');
    }
}

export function parseTime(timeString) {
    try {
        return new Date(timeString);
    } catch (e) {
        return null;
    }
}

export function validateOptions(options, types) {
    for (const key in options) {
        if (key in types && !types[key](options[key])) {
            throw new TypeError(`Option key: ${key} does not meet the required type.`);
        }
    }
    return true;
}
