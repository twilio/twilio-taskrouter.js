export default class Paginator {
    constructor(items: any[], source: Function, nextToken: boolean);
    private _nextToken;
    private _source;
    hasNextPage: boolean;
    items: any[];
    nextPage(): Promise<Paginator>;
}
