export default class EventBridgeSignaling extends EventEmitter {
    constructor(worker: typeof import("../Worker"), options?: EventBridgeSignal.Options | undefined);
    private _heartbeat;
    private webSocket;
    private _log;
    private _worker;
    closeExistingSessions: boolean;
    private _config;
    private reconnect;
    private tokenTimer;
    public updateToken(newToken: string): void;
    private setTokenExpirationEvent;
    private setUpWebSocket;
    public setLifetime(lifetime: number): void;
    tokenLifetime: number | undefined;
    private createWebSocket;
    private numAttempts;
    private generateBackOffInterval;
    public disconnect(): void;
}
export namespace EventBridgeSignal {
    type Options = {
        closeExistingSessions?: boolean | undefined;
    };
}
import { EventEmitter } from "events";
