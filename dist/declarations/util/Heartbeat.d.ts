export function Heartbeat(opts: Object): Heartbeat;
export class Heartbeat {
    constructor(opts: Object);
    interval: number;
    lastbeat: number | undefined;
    pintvl: any;
    onsleep: Function;
    onwakeup: Function;
    repeat: Function;
    stop: Function;
    now: Function;
    toString(): string;
    beat(): void;
    check(): void;
    sleeping(): boolean;
}
export namespace Heartbeat {
    function toString(): string;
}
