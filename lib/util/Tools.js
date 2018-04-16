const constants = require('./Constants');
const Errors = constants.twilioErrors;
const JWTUtil = require('./JWT');

export function verifyJWT(token) {
    if (!token) {
        throw Errors.INVALID_ARGUMENT.clone('Unable to verify JWT. <string>token is a required parameter.');
    }

    let jwt;
    try {
        jwt = JWTUtil.objectize(token);
    } catch (err) {
        throw Errors.INVALID_TOKEN.clone('Twilio access token malformed. Unable to decode token.');
    }

    if (!jwt.iss || !jwt.sub || !jwt.grants.task_router) {
        throw Errors.INVALID_TOKEN.clone('Twilio access token is malformed. Missing one of: grants.task_router, iss, or sub fields.');
    }

    if (!jwt.grants.task_router.role) {
        throw Errors.INVALID_TOKEN.clone('Twilio access token missing required \'role\' parameter in the TaskRouter grant.');
    }

    return jwt;
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
