export default class RetryUtil {
    constructor(baseTimeout?: number | undefined, maxTimeoutLimit?: number | undefined);
    private _log;
    public generateBackoffInterval(retryCount: number): number;
    public whenReady(retryCount: number): Promise<any>;
    #private;
}
