import { createClient } from 'graphql-ws';
import { EventEmitter } from 'events';
import isNil from 'lodash/isNil';
import isBoolean from 'lodash/isBoolean';
import { twilioErrors as Errors } from '../util/Constants';
import Worker from '../Worker';

const topLevel = global.window || global;
const WS = topLevel.WebSocket ? topLevel.WebSocket : require('ws');
const EXPIRATION_BUFFER = 5000;

/**
 * @typedef {Object} GraphQLSignaling.Options
 * @property {boolean} [closeExistingSessions=false] - A boolean defining whether other open sessions of the {@link Worker} should be terminated
 * @property {boolean} [setWorkerOfflineIfDisconnected=true] - A boolean defining whether if {@link Worker} availability set as Offline when the connection is terminated
 */

/**
 * Construct an {@GraphQLSignaling}.
 * @classdesc The signaling layer transmitting requests between TaskRouter and the client
 * @param {Worker} worker - The {@link Worker}
 * @param {GraphQLSignaling.Options} [options]
 * @property {boolean} closeExistingSessions - A boolean marking whether other open sessions should be terminated
 * @property {number} tokenLifetime - token lifetime
 * @fires GraphQLSignaling#connected
 * @fires GraphQLSignaling#disconnected
 * @fires GraphQLSignaling#error
 * @fires GraphQLSignaling#reservationAccepted
 * @fires GraphQLSignaling#reservationCanceled
 * @fires GraphQLSignaling#reservationCompleted
 * @fires GraphQLSignaling#reservationCreated
 * @fires GraphQLSignaling#reservationRejected
 * @fires GraphQLSignaling#reservationRescinded
 * @fires GraphQLSignaling#reservationTimedOut
 * @fires GraphQLSignaling#reservationFailed
 * @fires GraphQLSignaling#taskCanceled
 * @fires GraphQLSignaling#taskCompleted
 * @fires GraphQLSignaling#taskUpdated
 * @fires GraphQLSignaling#taskWrappedUp
 * @fires GraphQLSignaling#tokenExpired
 * @fires GraphQLSignaling#activityUpdated
 * @fires GraphQLSignaling#attributesUpdated
 * @fires GraphQLSignaling#capacityUpdated
 * @fires GraphQLSignaling#channelAvailabilityUpdated
 */
export default class GraphQLSignaling extends EventEmitter {
  /**
   * @param {import('../Worker')} worker - The {@link Worker}
   * @param {GraphQLSignaling.Options} [options] - Options
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
     * @type {WS}
     */
    this.webSocket = null;

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
     * @type {boolean}
     */
    this.setWorkerOfflineIfDisconnected = options.setWorkerOfflineIfDisconnected;

    /**
     * @private
     * @type {import('../util/Configuration')}
     */
    this._config = worker._config;

    /**
     * @private
     * @type {import('../util/Logger')}
     */
    this._log = log;

    /**
     * @private
     * @type {NodeJS.Timer}
     */
    this.tokenTimer = null;

    this.createWebSocket();
  }

  /**
   * @private
   */
  setTokenExpirationEvent() {
    this._log.debug('setTokenExpirationEvent with lifetime:', this.tokenLifetime);
    clearTimeout(this.tokenTimer); // there should only be one token timer at a time. Would be nice to encapsulate this logic in a token class.
    this.tokenTimer = setTimeout(() => {
      this.reconnect = false;
      this.emit('tokenExpired');
      this._log.debug('emitted tokenExpired event');
    }, this.tokenLifetime - EXPIRATION_BUFFER);
  }

  /**
   * Update the token
   * @public
   * @param {string} newToken - The new token to be used
   */
  updateToken(newToken) {
    if (!newToken) {
      throw Errors.INVALID_ARGUMENT.clone(
        'To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.'
      );
    }

    this.setTokenExpirationEvent();
    this.reconnect = true;
    this._log.info('[GQL] Updated token for Worker ' + this._worker.sid);
    // create a new connection if connection was closed
    //   (for backwards compatibility with previous versions where the client tried to reconnect indefinitely,
    //    so eventually a new websocket connection would have been created with the updated token)
    if (!this.webSocket) {
      this.createWebSocket();
    }
  }

  createWebSocket() {
    this._log.debug('[GQL] createWebSocket called');
    this._log.debug('[GQL] Websocket Connection URL', this._config.GQL_WS_SERVER);

    this.webSocket = createClient({
      url: this._config.GQL_WS_SERVER,
      webSocketImpl: WS,
      connectionParams: () => {
        return {
          authToken: `Bearer ${this._config.token}`,
        };
      },
      shouldRetry: () => true,
      retryAttempts: 5,
      // keepAlive: 30_000,
      // connectionAckWaitTimeout: 30_000,
      lazy: false,
    });

    this.registerWebSocketEvents();
  }

  /**
   * @private
   */
  registerWebSocketEvents() {
    this.webSocket.on('connecting', () => {
      this._log.debug('[GQL] Connecting to WS');
    });
    this.webSocket.on('connected', () => {
      this._log.debug('[GQL] Connected to WS 1');
      this.emit('connected');
      this.subscribe();
    });
    this.webSocket.on('opened', () => {
      this._log.debug('[GQL] New websocket created');
    });
    this.webSocket.on('ping', () => {
      this._log.debug('[GQL] Ping from WS');
    });
    this.webSocket.on('pong', () => {
      this._log.debug('[GQL] Pong from WS');
    });
    this.webSocket.on('message', (response) => {
      this._log.debug('[GQL] Received event', response);

      let json;
      try {
        json = JSON.parse(JSON.stringify(response));
        if (!json?.type || !json?.payload) {
          throw new Error('Invalid message format');
        }
      } catch (e) {
        this._log.error('Received data is not valid JSON: ' + response);
        this.emit('error', Errors.INVALID_GATEWAY_MESSAGE);
        return;
      }

      this._log.debug('Emitting event: %s with %s', json.type, JSON.stringify(json.payload));
      this.emit(json.type, json.payload || null, json.type);
    });
    this.webSocket.on('closed', () => {
      this._log.debug('[GQL] Emitted disconnect event.');
      // Emit a message immediately, so that for example UI can inform the user that they are offline
      this.emit('disconnected', { message: '[GQL] Connection lost' });

      // NB! If user has switched to a different WiFi, the connection is "lost" and
      // it will take another 60 seconds, before .onclose() is called. Hence, let's create
      // a new websocket immediately to reconnect faster.
      this._log.debug('[GQL] WebSocket connection has been lost. Trying to reconnect...');
      // this._reconnectWebSocket();
    });
    this.webSocket.on('error', (error) => {
      this._log.debug(`[GQL] Error from WS: ${JSON.stringify(error, null, 2)}`);
    });
  }

  /**
   * used to disconnect the websocket
   * @public
   */
  disconnect() {
    this._log.info('[GQL] Disconnecting websocket');

    if (this.webSocket !== null) {
      ['onmessage', 'onclose', 'onopen', 'onerror'].forEach((evt) => {
        this.webSocket[evt] = null;
      });

      this.webSocket.dispose();
    }

    this.emit('disconnected', { message: '[GQL] SDK Disconnect' });
  }

  async subscribe() {
    this.webSocket.subscribe(
      {
        query: `subscription highlightedMetrics {
      highlightedMetrics {
        __typename
      }
    }`,
      },
      {
        next: (data) => {
          this._log.debug('[GQL] data', data);
        },
        error: (error) => {
          this._log.debug('[GQL] error', error);
        },
        complete: () => {
          this._log.debug('[GQL] complete');
        },
      }
    );
  }
}
