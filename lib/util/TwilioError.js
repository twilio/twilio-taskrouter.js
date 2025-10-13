/**
 * A Twilio error
 * @classdesc A customized Twilio error
 * @param {Object} errorData - The error data
 * @param {string} customMessage - A custom message
 * @property {string} name - The name of this {@link TwilioError}
 * @property {string} message - The message of this {@link TwilioError}
 */
function TwilioError(errorData, customMessage) {
  // Capture the stack trace
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  }

  Object.defineProperties(this, {
    _errorData: {
      value: errorData
    },
    name: {
      value: errorData.name
    },
    message: {
      value: customMessage || errorData.message
    }
  });
}

TwilioError.prototype = Object.create(Error.prototype);
TwilioError.prototype.constructor = TwilioError;

/**
 * Clone the {@link TwilioError} with a customized message
 * @param {string} customMessage - The custom message
 * @returns {TwilioError} error
 */
TwilioError.prototype.clone = function clone(customMessage) {
  return new TwilioError(this._errorData, customMessage);
};

module.exports = TwilioError;
