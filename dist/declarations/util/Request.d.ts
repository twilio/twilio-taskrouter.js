export default class Request {
    constructor(config: Object);
    private _config;
    private _postClient;
    public post(url: string, paramsJSON: Object, apiVersion: string, objectVersion: string): Promise<any>;
    public get(url: string, apiVersion: string, paramsJSON: Object): Promise<any>;
    private buildRequest;
}
