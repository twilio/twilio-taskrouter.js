import _ from 'lodash';
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
 * Construct an {@EventBridgeSignaling}.
 * @class
 * @classdesc The signaling layer transmitting requests between TaskRouter and the client
 * @param {Worker} worker - The {@link Worker}
 * @param {EventBridgeSignaling.Options} [options]
 * @property {boolean} closeExistingSessions - A boolean marking whether other open sessions should be terminated
 * @property {Configuration} configuration - The {@link Configuration} to be used
 * @property {Worker} worker - The {@link Worker}
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
 * @fires EventBridgeSignaling#workerActivityUpdated
 * @fires EventBridgeSignaling#workerAttributesUpdated
 * @fires EventBridgeSignaling#workerCapacityUpdated
 * @fires EventBridgeSignaling#workerChannelAvailabilityUpdated
 */

/**
 * @typedef {Object} EventBridgeSignaling.Options
 * @property {boolean} [closeExistingSessions=false] - A boolean defining whether other open sessions of the
 *   {@link Worker} should be terminated
 */

export default class EventBridgeSignaling extends EventEmitter {
    constructor(worker, options = {}) {
        super();

        if (!worker || !(worker instanceof Worker)) {
            throw Errors.INVALID_ARGUMENT.clone('<Worker>worker is a required parameter to construct EventBridgeSignaling.');
        }

        const log = worker.getLogger(`EventBridgeSignaling-${worker.sid}`);

        if (!_.isNil(options.closeExistingSessions) && !_.isBoolean(options.closeExistingSessions)) {
            throw new TypeError('Invalid type passed for <boolean>closeExistingSessions');
        }

        this._heartbeat = null;
        this.webSocket = null;
        this._log = log;
        this._worker = worker;
        this.closeExistingSessions = options.closeExistingSessions || false;
        this._config = worker._config;
        this.reconnect = false;
        this.tokenTimer = null;

        this.setUpWebSocket();
    }

    /**
     * Update the token
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

    setTokenExpirationEvent() {
        clearTimeout(this.tokenTimer);  // there should only be one token timer at a time. Would be nice to encapsulate this logic in a token class.
        this.tokenTimer = setTimeout(() => {
            this.reconnect = false;
            this.emit('tokenExpired');
        }, this.tokenLifetime - EXPIRATION_BUFFER);
    }

    setUpWebSocket() {
        // A heart beat is sent every 15 secs by EBS, if none received within 60 secs; disconnect the websocket
        if (this._heartbeat) {
            // reset Heartbeat.onsleep() function to do nothing
            this._heartbeat.onsleep = () => {};
        }

        this._heartbeat = new Heartbeat({
            interval: 60
        });

        this.createWebSocket();
    }

    setLifetime(lifetime) {
        this.tokenLifetime = lifetime;
        this.setTokenExpirationEvent();
    }

    createWebSocket() {
        this.numAttempts = 1;
        this.reconnect = true;

        const queryParam = `?${EB_URL_PARAMS.TOKEN}=${this._config.token}&${EB_URL_PARAMS.CLOSE_EXISTING_SESSIONS}=${this.closeExistingSessions}&${EB_URL_PARAMS.CLIENT_VERSION}=${CLIENT_VERSION}`;
        this.webSocket = new WS(this._config.WS_SERVER + queryParam);

        this.webSocket.onopen = () => {
            // reset the number of attempts made to 1
            // when a successful connection is opened
            this.numAttempts = 1;
            this.emit('connected');

            // upon successful websocket connection, set heartbeat's onsleep() function to disconnect the websocket
            // if no beat is felt in the 60 sec interval
            this._heartbeat.onsleep = () => {
                this._log.info('Heartbeat not received in the past 60 seconds. Proceeding to disconnect websocket.');
                // explicitly tell the websocket to close
                // this will trigger the .onclose() method when the state of the websocket successfully transitions to CLOSED
                this.webSocket.close();
            };
            // kick off the 60 sec interval with a heartbeat
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
            if (this.reconnect) {
                this._log.info('WebSocket connection has closed. Trying to reconnect.');
            } else {
                this._log.info('WebSocket connection has closed. Not reconnecting due to token expiration.');

            }

            let reason = closeResponse.reason;
            if (!reason || reason === "") {
                reason = `Websocket closed with errorCode=${closeResponse.code}`;
            }
            this.emit('disconnected', { "message": reason});

            // do not try to disconnect the websocket again if the 60 sec interval is met
            this._heartbeat.onsleep = () => {};

            if (this.reconnect) {
                // try to reconnect using a clear backoff algorithm
                const time = this.generateBackOffInterval(this.numAttempts);

                setTimeout(() => {
                    this.numAttempts++;
                    this.createWebSocket();
                }, time);
            }
        };
    }

    generateBackOffInterval(k) {
        const min = Math.ceil(800); // Minimum delay
        const max = Math.floor(Math.min(30, (Math.pow(2, k) - 1)) * 1000); // Backoff interval
        // Using Full-Jitter strategy
        return Math.round(Math.floor(Math.random() * (max - min + 1)) + min);
    }


    disconnect() {
        this._log.info('Disconnecting websocket');

        if (this.webSocket !== null) {
            ['onmessage', 'onclose', 'onopen', 'onerror'].forEach(evt => {
                this.webSocket[evt] = null;
            });

            this.webSocket.close();
        }

        this.emit('disconnected', { "message": "SDK Disconnect"});
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
