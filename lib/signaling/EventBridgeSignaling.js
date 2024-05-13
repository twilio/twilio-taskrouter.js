import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { twilioErrors as Errors, EB_URL_PARAMS } from '../util/Constants';
import { EventEmitter } from 'events';
import { Heartbeat } from '../util/Heartbeat';
import Worker from '../Worker';

const topLevel = global.window || global;
const WS = topLevel.WebSocket ? topLevel.WebSocket : require('ws');
const EXPIRATION_BUFFER = 5000;

import * as packageJson from '../../package.json';
const CLIENT_VERSION = packageJson.version;

/**
 * @typedef {Object} EventBridgeSignal.Options
 * @property {boolean} [closeExistingSessions=false] - A boolean defining whether other open sessions of the {@link Worker} should be terminated
 */

/**
 * Construct an {@EventBridgeSignaling}.
 * @classdesc The signaling layer transmitting requests between TaskRouter and the client
 * @param {Worker} worker - The {@link Worker}
 * @param {EventBridgeSignal.Options} [options]
 * @property {boolean} closeExistingSessions - A boolean marking whether other open sessions should be terminated
 * @property {number} tokenLifetime - token lifetime
 * @fires EventBridgeSignaling#connected
 * @fires EventBridgeSignaling#disconnected
 * @fires EventBridgeSignaling#error
 * @fires EventBridgeSignaling#reservationAccepted
 * @fires EventBridgeSignaling#reservationCanceled
 * @fires EventBridgeSignaling#reservationCompleted
 * @fires EventBridgeSignaling#reservationCreated
 * @fires EventBridgeSignaling#reservationRejected
 * @fires EventBridgeSignaling#reservationRescinded
 * @fires EventBridgeSignaling#reservationTimedOut
 * @fires EventBridgeSignaling#reservationFailed
 * @fires EventBridgeSignaling#taskCanceled
 * @fires EventBridgeSignaling#taskCompleted
 * @fires EventBridgeSignaling#taskUpdated
 * @fires EventBridgeSignaling#taskWrappedUp
 * @fires EventBridgeSignaling#tokenExpired
 * @fires EventBridgeSignaling#activityUpdated
 * @fires EventBridgeSignaling#attributesUpdated
 * @fires EventBridgeSignaling#capacityUpdated
 * @fires EventBridgeSignaling#channelAvailabilityUpdated
 */
export default class EventBridgeSignaling extends EventEmitter {
    /**
     * @param {import('../Worker')} worker - The {@link Worker}
     * @param {EventBridgeSignal.Options} [options] - Options
     */
    constructor(worker, options = {}) {
        super();

        if (!worker || !(worker instanceof Worker)) {
            throw Errors.INVALID_ARGUMENT.clone('<Worker>worker is a required parameter to construct EventBridgeSignaling.');
        }

        const log = worker.getLogger(`EventBridgeSignaling-${worker.sid}`);

        if (!isNil(options.closeExistingSessions) && !isBoolean(options.closeExistingSessions)) {
            throw new TypeError('Invalid type passed for <boolean>closeExistingSessions');
        }

        /**
         * @private
         * @type {Heartbeat}
         */
        this._heartbeat = null;
        /**
         * @private
         * @type {WS}
         */
        this.webSocket = null;
        /**
         * @private
         * @type {import('../util/Logger')}
         */
        this._log = log;
        /**
         * @private
         * @type {import('../Worker')}
         */
        this._worker = worker;
        /**
         * @type {boolean}
         */
        this.closeExistingSessions = options.closeExistingSessions || false;
        /**
         * @private
         * @type {import('../util/Configuration')}
         */
        this._config = worker._config;
        /**
         * @private
         * @type {boolean}
         */
        this.reconnect = false;
        /**
         * @private
         * @type {NodeJS.Timer}
         */
        this.tokenTimer = null;

        this.setUpWebSocket();
    }

    /**
     * Update the token
     * @public
     * @param {string} newToken - The new token to be used
     */
    updateToken(newToken) {
        if (!newToken) {
            throw Errors.INVALID_ARGUMENT.clone('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
        }

        this.setTokenExpirationEvent();
        this._log.info('Updated token for Worker ' + this._worker.sid);
        this.reconnect = true;
        // create a new connection if connection was closed
        //   (for backwards compatibility with previous versions where the client tried to reconnect indefinitely,
        //    so eventually a new websocket connection would have been created with the updated token)
        if (this.webSocket.readyState === this.webSocket.CLOSING || this.webSocket.readyState === this.webSocket.CLOSED) {
            this.createWebSocket();
        }
    }

    /**
     * @private
     */
    setTokenExpirationEvent() {
        this._log.debug('setTokenExpirationEvent with lifetime:', this.tokenLifetime);
        clearTimeout(this.tokenTimer);  // there should only be one token timer at a time. Would be nice to encapsulate this logic in a token class.
        this.tokenTimer = setTimeout(() => {
            this.reconnect = false;
            this.emit('tokenExpired');
            this._log.debug('emitted tokenExpired event');
        }, this.tokenLifetime - EXPIRATION_BUFFER);
    }

    /**
     * @private
     */
    setUpWebSocket() {
        // A heart beat is sent every 15 secs by EBS, if none received within 30 seconds close the websocket
        if (this._heartbeat) {
            // reset Heartbeat.onsleep() function to do nothing
            this._heartbeat.onsleep = () => {};
        }

        this._heartbeat = new Heartbeat({
            interval: 30
        });

        this.createWebSocket();
    }

    /**
     * sets token lifetime
     * @public
     * @param {number} lifetime
     */
    setLifetime(lifetime) {
        this.tokenLifetime = lifetime;
        this.setTokenExpirationEvent();
    }

    /**
     * @private
     */
    createWebSocket() {
        /**
         * @type {number}
         * @private
         */
        this.numAttempts = 1;
        this.reconnect = true;

        this._log.debug('createWebSocket called');

        const queryParam = `?${EB_URL_PARAMS.TOKEN}=${this._config.token}&${EB_URL_PARAMS.CLOSE_EXISTING_SESSIONS}=${this.closeExistingSessions}&${EB_URL_PARAMS.CLIENT_VERSION}=${CLIENT_VERSION}`;
        this.webSocket = new WS(this._config.WS_SERVER + queryParam);

        this._log.debug('New websocket created');
        this._isReconnecting = false;

        this.webSocket.onopen = () => {
            // reset the number of attempts made to 1
            // when a successful connection is opened
            this.numAttempts = 1;
            this.emit('connected');

            // Upon successful websocket connection, set heartbeat's onsleep() function to disconnect the websocket
            // if no beat is felt in the 30 sec interval
            this._heartbeat.onsleep = () => {
                this._log.info('Heartbeat not received in the past 30 seconds. Proceeding to close the websocket.');

                // Emit a message immediately, so that for example UI can inform the user that they are offline
                this.emit('disconnected', { message: 'Connection lost' });
                this._log.debug('Emitted disconnect event.');

                // Remove event handlers of the current websocket, because we are
                // not interested in these events anymore. If we don't do that here,
                // we may still receive 'onclose' after 1 minute, when the new websocket
                // is already up and running.
                this._removeEventHandlers();

                // Explicitly tell the websocket to close.
                // This would trigger the .onclose() method (if event handlers were still be in place),
                // when the state of the websocket successfully transitions to CLOSED.
                this.webSocket.close();

                // NB! If user has switched to a different WiFi, the connection is "lost" and
                // it will take another 60 seconds, before .onclose() is called. Hence, let's create
                // a new websocket immediately to reconnect faster.
                this._log.debug('WebSocket connection has been lost. Trying to reconnect...');
                this._reconnectWebSocket();
            };

            // kick off the 30 sec interval with a heartbeat
            this._heartbeat.beat();
        };

        this.webSocket.onmessage = response => {
            this._log.debug('Received event', response.data);

            // a heart beat is received
            this._heartbeat.beat();
            if (response.data.trim().length === 0) {
                return;
            }

            // a message is received
            let json;
            try {
                json = JSON.parse(response.data);
            } catch (e) {
                this._log.error('Received data is not valid JSON: ' + response.data);
                this.emit('error', Errors.INVALID_GATEWAY_MESSAGE);
                return;
            }

            this._log.debug('Emitting event: %s with %s', json.event_type, JSON.stringify(json.payload));
            this.emit(json.event_type, json.payload || null, json.event_type);
        };

        this.webSocket.onerror = response => {
            this._log.error('WebSocket error occurred: ', response);
            this.emit('error', Errors.GATEWAY_CONNECTION_FAILED);
        };

        this.webSocket.onclose = (closeResponse) => {
            this._log.info('WebSocket received onclose event with code', closeResponse.code);
            let reason = closeResponse.reason;
            const reasonCode = closeResponse.code;
            if (isEmpty(reason)) {
                reason = `Websocket closed with errorCode=${reasonCode}`;
            }
            this.emit('disconnected', { message: reason });

            // Clear the heartbeat inactivity handler that attempts
            // to close the websocket, because we are already inside
            // onclose. It will be recreated when a new websocket is created.
            this._heartbeat.onsleep = () => {};

            if (this._isReconnecting) {
                this._log.info('WebSocket connection has closed. Already trying to reconnect...');
                return;
            }

            if (this.reconnect) {
                this._log.info('WebSocket connection has closed. Trying to reconnect...');
                this._reconnectWebSocket();
            } else {
                this._log.info('WebSocket connection has closed. Not reconnecting due to token expiration.');
            }
        };
    }

    /**
     * Reconnect WebSocket
     * @private
     */
    _reconnectWebSocket() {
        this._log.debug('_reconnectWebSocket was called');
        this._isReconnecting = true;

        // Remove event handlers of the current websocket, because we are
        // not interested in these events anymore. If we don't do that here,
        // we will still receive 'onclose' after 1 minute, when the new websocket
        // is already up and running. Event handlers may have been already removed earlier
        // (for example inside heartbeat.onsleep), but let's call it here again just in case
        // for example, when _reconnectWebSocket is called from onclose event handler.
        this._removeEventHandlers();

        // Clear the heartbeat inactivity handler that attempts
        // to close the websocket, because we are attempting to
        // reconnect. It will be recreated when a new websocket is created.
        this._heartbeat.onsleep = () => {};

        // Try to reconnect using a clear backoff algorithm
        const time = this.generateBackOffInterval(this.numAttempts);

        setTimeout(() => {
            this.numAttempts++;
            this.createWebSocket();
        }, time);
    }

    /**
     * Remove event handlers
     * @private
     */
    _removeEventHandlers() {
        if (this.webSocket !== null) {
            this._log.debug('Removing event handlers for websocket');
            ['onmessage', 'onclose', 'onopen', 'onerror'].forEach(event => {
                this.webSocket[event] = null;
            });
        }
    }

    /**
     * @private
     * @param {number} k
     * @return {number}
     */
    generateBackOffInterval(k) {
        const min = Math.ceil(800); // Minimum delay
        const max = Math.floor(Math.min(30, (Math.pow(2, k) - 1)) * 1000); // Backoff interval
        // Using Full-Jitter strategy
        return Math.round(Math.floor(Math.random() * (max - min + 1)) + min);
    }


    /**
     * used to disconnect the websocket
     * @public
     */
    disconnect() {
        this._log.info('Disconnecting websocket');

        if (this.webSocket !== null) {
            ['onmessage', 'onclose', 'onopen', 'onerror'].forEach(evt => {
                this.webSocket[evt] = null;
            });

            this._heartbeat.onsleep = () => {};
            this.webSocket.close();
        }

        this.emit('disconnected', { message: 'SDK Disconnect' });
    }
}

/**
 * The websocket connected
 * @event EventBridgeSignaling#connected
 */

/**
 * The websocket disconnected
 * @event EventBridgeSignaling#disconnected
 */

/**
 * An error occurred
 * @event EventBridgeSignaling#error
 * @param {Error} error - The error triggered
 */

/**
 * {@link Reservation} was accepted
 * @event EventBridgeSignaling#reservationAccepted
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was canceled
 * @event EventBridgeSignaling#reservationCanceled
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was completed
 * @event EventBridgeSignaling#reservationCompleted
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was created
 * @event EventBridgeSignaling#reservationCreated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was rejected
 * @event EventBridgeSignaling#reservationRejected
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was rescinded
 * @event EventBridgeSignaling#reservationRescinded
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was timed out
 * @event EventBridgeSignaling#reservationTimedOut
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was failed
 * @event EventBridgeSignaling#reservationFailed
 * @param {Object} payload - The payload received
 */

/**
 * {@link Task} was canceled
 * @event EventBridgeSignaling#taskCanceled
 */

/**
 * {@link Task} was completed
 * @event EventBridgeSignaling#taskCompleted
 */

/**
 * {@link Task} was updated
 * @event EventBridgeSignaling#taskUpdated
 */

/**
 * {@link Task} was wrapped up
 * @event EventBridgeSignaling#taskWrappedUp
 */

/**
 * The token expired
 * @event EventBridgeSignaling#tokenExpired
 */

/**
 * {@link Worker} activity was updated
 * @event EventBridgeSignaling#activityUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Worker} attributes was updated
 * @event EventBridgeSignaling#attributesUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Channel} capacity was updated
 * @event EventBridgeSignaling#capacityUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Channel} availability was updated
 * @event EventBridgeSignaling#channelAvailabilityUpdated
 * @param {Object} payload - The payload received
 */
