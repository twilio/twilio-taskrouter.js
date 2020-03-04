const Errors = require('./Constants').twilioErrors;
const log = require('loglevel');

/**
 * Construct a custom {@link Logger}
 * @class
 * @classdesc Log messages to console at a given logging level
 * @param {string} moduleName - The name of the logging module
 */

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];

export default class Logger {
  constructor(moduleName, logLevel) {
    if (!moduleName) {
      throw Errors.INVALID_ARGUMENT.clone('Error instantiating Logger. <string>moduleName is a required parameter.');
    }

    this._log = log.getLogger(moduleName);
    logLevels.forEach(function(level) {
      this[level] = (...args) => this._log[level](...args);
    }.bind(this));

    if (logLevel) {
      this.setLevel(logLevel);
    }
  }

  setLevel(level) {
    if (logLevels.indexOf(level) === -1) {
      throw Errors.INVALID_ARGUMENT.clone('Error setting Logger level. <string>level must be one of [\'trace\', \'debug\', \'info\', \'warn\', \'error\', \'silent\']');
    }

    this._log.setLevel(level, false);
    this._log.setDefaultLevel(level);
  }

  getLevel() {
    return logLevels[this._log.getLevel()];
  }
}
