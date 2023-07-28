export default class Logger {
    constructor(moduleName: string, logLevel: keyof Logger.LogLevel);
    private _log;
    setLevel(level: string): void;
    getLevel(): string;
    private _getTimestamp;
}
export namespace Logger {
    type LogLevel = {
        trace: string;
        debug: string;
        info: string;
        warn: string;
        error: string;
        silent: string;
    };
}
