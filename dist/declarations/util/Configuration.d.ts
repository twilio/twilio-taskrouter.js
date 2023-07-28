export default class Configuration {
    constructor(token: string, options?: Configuration.Options | undefined);
    logIdentifier: string;
    private _logLevel;
    private _log;
    token: string;
    EB_SERVER: string;
    WS_SERVER: string;
    public updateToken(newToken: string): void;
    public getLogIdentifier(): string;
}
export namespace Configuration {
    type Options = {
        region?: string | undefined;
        ebServer?: string | undefined;
        wsServer?: string | undefined;
        logIdentifier?: string | undefined;
        connectActivitySid?: string | undefined;
        closeExistingSessions?: boolean | undefined;
        logLevel?: string | undefined;
    };
}
