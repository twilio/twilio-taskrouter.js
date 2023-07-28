export default class ChannelsEntity {
    constructor(worker: Worker, request: typeof import("../util/Request"), options?: Channels.Options | undefined);
    private _channels;
    private _log;
    private _request;
    private _pageSize;
    private _worker;
    get channels(): Map<string, Channel>;
    public fetchChannels(): Promise<Map<string, Channel>>;
    private _getAllChannels;
    private _getPage;
    private _insertChannel;
}
export namespace Channels {
    type Options = {
        pageSize?: number | undefined;
    };
}
import Channel from "../Channel";
import Worker from "../Worker";
