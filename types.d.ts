import EventEmitter from "events";

export as namespace TaskRouter;
export class Worker extends EventEmitter {
    constructor(token: string, options?: any);

    readonly accountSid: string;
    readonly activities: Map<string, Activity>;
    readonly activity: Activity;
    readonly attributes: Object;
    readonly channels: Map<string, Channel>;
    readonly connectActivitySid: string;
    readonly dateCreated: Date;
    readonly dateStatusChanged: Date;
    readonly dateUpdated: Date;
    readonly disconnectActivitySid: string;
    readonly name: string;
    readonly reservations: Map<string, Reservation>;
    readonly sid: string;
    readonly workspaceSid: string;

    createTask(to: string, from: string, workflowSid: string, taskQueueSid: string, options: Object): Promise<string>
    disconnect();
    setAttributes(attributes: any): Promise<Worker>;
    updateToken(newToken: string);
}

export class Supervisor extends Worker {
    monitor(taskSid: string, reservationSid: string, extraParams: Object): Promise<void>;
}

export interface Activity {
    readonly accountSid: string;
    readonly available: boolean;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly isCurrent: boolean;
    readonly name: string;
    readonly sid: string;
    readonly workspaceSid: string;

    setAsCurrent(): Promise<Activity>;
}

export interface Channel {
    readonly accountSid: string;
    readonly available: boolean;
    readonly capacity: number;
    readonly availableCapacityPercentage: number;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly sid: string;
    readonly taskChannelSid: string;
    readonly taskChannelUniqueName: string;
    readonly workerSid: string;
    readonly workspaceSid: string;
}

export interface Task extends NodeJS.EventEmitter {
    readonly addOns: Object;
    readonly age: number;
    readonly attributes: Object;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly priority: number;
    readonly queueName: string;
    readonly queueSid: string;
    readonly reason: string;
    readonly sid: string;
    readonly status: "pending" | "reserved" | "assigned" | "canceled" | "completed" | "wrapping";
    readonly taskChannelSid: string;
    readonly taskChannelUniqueName: string;
    readonly timeout: number;
    readonly workflowName: string;
    readonly workflowSid: string;
    readonly routingTarget: string;

    complete(reason: string): Promise<Task>;
    setAttributes(attributes: Object): Promise<Task>;
    async transfer(to: string, options: TransferOptions): Promise<Task>;
    wrapUp({reason: string}): Promise<Task>;
    updateParticipant(options: TaskParticipantOptions): Promise<Task>;
    kick(workerSid: string): Promise<Task>;
    hold(targetWorkerSid: string, onHold: boolean, options: HoldOptions): Promise<Task>;
}

export interface Reservation extends NodeJS.EventEmitter {
    readonly accountSid: string;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly sid: string;
    readonly status: "pending" | "accepted" | "rejected" | "timeout" | "canceled" | "rescinded";
    readonly taskChannelSid: string;
    readonly taskChannelUniqueName: string;
    readonly taskSid: string;
    readonly workerSid: string;
    readonly workspaceSid: string;
    readonly task: Task;

    accept(): Promise<Reservation>;
    complete(): Promise<Reservation>;
    wrap(): Promise<Reservation>;
    call(from: string, url: string, options?: CallOptions): Promise<Reservation>;
    dequeue(options?: DequeueOptions): Promise<Reservation>;
    conference(options?: ConferenceOptions): Promise<Reservation>;
    redirect(callSid: string, url: string, options?: RedirectOptions);
    reject(options?: RejectOptions): Promise<Reservation>;
    updateParticipant(options: ReservationParticipantOptions): Promise<Reservation>;
}

export interface TaskQueue {
    sid: string;
    accountSid: string;
    workspaceSid: string;
    name: string;
    assignmentActivityName: string;
    reservationActivityName: string;
    assignmentActivitySid: string;
    reservationActivitySid: string;
    targetWorkers: string;
    maxReservedWorkers: number;
    taskOrder: string;
    dateCreated: Date;
    dateUpdated: Date;
}

export class TaskRouterEventHandler {
    constructor(worker: Worker, options?: Object);
    getTREventsToHandlerMapping(): {[key: string]: string};
}

export class Workspace {
    constructor(jwt: string, options?: Object);

    fetchWorkers(): Promise<Map<string, Worker>>;
    fetchTaskQueues(): Promise<Map<string, TaskQueue>>;
}

export interface CallOptions {
    readonly statusCallbackUrl?: string;
    readonly accept?: boolean;
    readonly record?: boolean;
    readonly to?: string;
    readonly timeout?: number;

}

export interface DequeueOptions {
    from?:string;
    to?:string;
    postWorkActivitySid?:string;
    record?:string;
    timeout?:number;
    statusCallbackUrl?:string;
    statusCallbackEvents?:string;
}

export interface ConferenceOptions {
    to?:string;
    from?:string;
    timeout?:number;
    statusCallback?:string;
    statusCallbackMethod?:string;
    statusCallbackEvent?:string;
    record?:string;
    muted?:boolean;
    beep?:string | boolean;
    startConferenceOnEnter?:boolean;
    endConferenceOnExit?:boolean;
    endConferenceOnCustomerExit?:boolean;
    beepOnCustomerEntrance?:boolean;
    waitUrl?:string;
    waitMethod?:string;
    earlyMedia?:boolean;
    maxParticipants?:number;
    conferenceStatusCallback?:string;
    conferenceStatusCallbackMethod?:string;
    conferenceStatusCallbackEvent?:string;
    conferenceRecord?:string | boolean;
    conferenceTrim?:string;
    recordingChannels?:string;
    recordingStatusCallback?:string;
    recordingStatusCallbackMethod?:string;
    conferenceRecordingStatusCallback?:string;
    conferenceRecordingStatusCallbackMethod?:string;
    region?:string;
    sipAuthUsername?:string;
    sipAuthPassword?:string;
}
export interface RedirectOptions {
    accept?:boolean;
}

export interface RejectOptions {
    activitySid: string;
}

export interface TransferOptions {
    attributes: Object;
    mode: "COLD" | "WARM";
    priority: number;
}

export interface HoldOptions {
    holdUrl: string;
    holdMethod: "GET"
}

export interface TaskParticipantOptions extends HoldOptions {
    hold: boolean;
}

export interface ReservationParticipantOptions {
    endConferenceOnExit: boolean;
    mute: boolean;
    beepOnExit: boolean;
}

