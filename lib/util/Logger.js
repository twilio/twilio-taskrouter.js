const Errors = require('./Constants').twilioErrors;
const log = require('loglevel');

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];

/**
 * @typedef Logger.LogLevel
 * @property {string} trace
 * @property {string} debug
 * @property {string} info
 * @property {string} warn
 * @property {string} error
 * @property {string} silent
 */

/**
 * Construct a custom {@link Logger}
 * @classdesc Log messages to console at a given logging level
 * @param {string} moduleName - The name of the logging module
 * @param {keyof Logger.LogLevel} logLevel
 */
export default class Logger {
  /**
   * @param {string} moduleName
   * @param {keyof Logger.LogLevel} logLevel
   */
  constructor(moduleName, logLevel) {
    if (!moduleName) {
      throw Errors.INVALID_ARGUMENT.clone('Error instantiating Logger. <string>moduleName is a required parameter.');
    }

    /**
     * @type {log.Logger}
     * @private
     */
    this._log = log.getLogger(moduleName);
    logLevels.forEach(function(level) {
      this[level] = (...args) => this._log[level](this._getTimestamp(), ...args);
    }.bind(this));

    if (logLevel) {
      this.setLevel(logLevel);
    }
  }

  /**
   * @param {string} level
   */
  setLevel(level) {
    if (logLevels.indexOf(level) === -1) {
      throw Errors.INVALID_ARGUMENT.clone('Error setting Logger level. <string>level must be one of [\'trace\', \'debug\', \'info\', \'warn\', \'error\', \'silent\']');
    }

    this._log.setLevel(level, false);
    this._log.setDefaultLevel(level);
  }

  /**
   * @return {string}
   */
  getLevel() {
    return logLevels[this._log.getLevel()];
  }

  /**
   * @private
   * @return {string}
   */
  _getTimestamp() {
    return `[${new Date().toISOString()}]`;
  }
}
