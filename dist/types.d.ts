import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

export as namespace TaskRouter;
export class Worker extends (EventEmitter as new () => TypedEmitter<WorkerEvents>) {
    constructor(token: string, options?: WorkerOptions);

    readonly accountSid: string;
    readonly activities: Map<string, Activity>;
    readonly activity: Activity;
    readonly activitySid: string;
    readonly available: boolean;
    readonly attributes: Record<string, any>;
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
    readonly workerSid: string;
    readonly workerActivitySid: string;
    readonly dateActivityChanged: Date;
    readonly friendlyName: string;
    version: string;

    createTask(to: string, from: string, workflowSid: string, taskQueueSid: string, options?: TaskOptions): Promise<string>;
    disconnect(): void;
    setAttributes(attributes: any): Promise<Worker>;
    updateToken(newToken: string): void;
    fetchLatestVersion(): Promise<Worker>;
}

export class Supervisor extends Worker {
    monitor(taskSid: string, reservationSid: string, extraParams: Object): Promise<void>;
    setWorkerAttributes(workerSid: string, attributes: Record<string, any>): Promise<Worker>;
    setWorkerActivity(workerSid: string, activitySid: string, options?: ActivityOptions): Promise<Worker>;
}

interface WorkerEvents {
    activityUpdated: (worker: Worker) => void;
    attributesUpdated: (worker: Worker) => void;
    disconnected: (worker: Worker) => void;
    error: (error: Error) => void;
    ready: (worker: Worker) => void;
    reservationCreated: (reservation: Reservation) => void;
    reservationFailed: (reservation: Reservation) => void;
    tokenExpired: () => void;
    tokenUpdated: () => void;
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

    setAsCurrent(options?: ActivityOptions): Promise<Activity>;
}

export class Channel extends (EventEmitter as new () => TypedEmitter<ChannelEvents>) {
    readonly accountSid: string;
    readonly assignedTasks: number;
    readonly available: boolean;
    readonly availableCapacityPercentage: number;
    readonly capacity: number;
    readonly lastReservedTime: Date;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly sid: string;
    readonly taskChannelSid: string;
    readonly taskChannelUniqueName: string;
    readonly workerSid: string;
    readonly workspaceSid: string;
}

interface ChannelEvents {
    availabilityUpdated: (channel: Channel) => void;
    capacityUpdated: (channel: Channel) => void;
}

export class Task extends (EventEmitter as new () => TypedEmitter<TaskEvents>) {
    readonly addOns: Object;
    readonly age: number;
    readonly attributes: Record<string, any>;
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
    readonly transfers: Transfers;
    readonly workflowName: string;
    readonly workflowSid: string;
    readonly routingTarget: string;
    readonly version: string;
    readonly virtualStartTime: Date;

    complete(reason: string): Promise<Task>;
    hold(targetWorkerSid: string, onHold: boolean, options?: TaskHoldOptions): Promise<Task>;
    kick(workerSid: string): Promise<Task>;
    setAttributes(attributes: Object): Promise<Task>;
    setVirtualStartTime(date: Date): Promise<Task>;
    transfer(to: string, options: TransferOptions): Promise<Task>;
    wrapUp(options: WrappingOptions): Promise<Task>;
    updateParticipant(options: TaskParticipantOptions): Promise<Task>;
    fetchLatestVersion(): Promise<Task>;
}

interface TaskEvents {
    canceled: (task: Task) => void;
    completed: (task: Task) => void;
    transferInitiated: (outgoingTransfer: OutgoingTransfer) => void;
    updated: (task: Task) => void;
    wrapup: (task: Task) => void;
}

export class Reservation extends (EventEmitter as new () => TypedEmitter<ReservationEvents>) {
    readonly accountSid: string;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly sid: string;
    readonly status: "pending" | "accepted" | "rejected" | "timeout" | "canceled" | "rescinded" | "wrapping" | "completed";
    readonly task: Task;
    readonly timeout: number;
    readonly workerSid: string;
    readonly workspaceSid: string;
    readonly canceledReasonCode?: number;
    readonly version: string;

    accept(): Promise<Reservation>;
    complete(): Promise<Reservation>;
    wrap(): Promise<Reservation>;
    call(from: string, url: string, options?: CallOptions): Promise<Reservation>;
    conference(options?: ConferenceOptions): Promise<Reservation>;
    dequeue(options?: DequeueOptions): Promise<Reservation>;
    redirect(callSid: string, url: string, options?: RedirectOptions): Promise<Reservation>;
    reject(options?: RejectOptions): Promise<Reservation>;
    updateParticipant(options: ReservationParticipantOptions): Promise<Reservation>;
    fetchLatestVersion(): Promise<Reservation>;
}

interface ReservationEvents {
    accepted: (reservation: Reservation) => void;
    canceled: (reservation: Reservation) => void;
    completed: (reservation: Reservation) => void;
    rejected: (reservation: Reservation) => void;
    rescinded: (reservation: Reservation) => void;
    timeout: (reservation: Reservation) => void;
    wrapup: (reservation: Reservation) => void;
}

export interface TaskQueue {
    readonly sid: string;
    readonly queueSid: string;
    readonly queueName: string;
    readonly accountSid: string;
    readonly workplaceSid: string;
    readonly name: string;
    readonly assignmentActivityName: string;
    readonly reservationActivityName: string;
    readonly assignmentActivitySid: string;
    readonly reservationActivitySid: string;
    readonly targetWorkers: string;
    readonly maxReservedWorkers: number;
    readonly taskOrder: string;
    dateCreated: Date;
    dateUpdated: Date;
}

export class TaskRouterEventHandler {
    constructor(worker: Worker, options?: Object);
    getTREventsToHandlerMapping(): {[key: string]: string};
}

type FetchTaskQueuesParams = {
    AfterSid?: string;
    FriendlyName?: string;
    Ordering?: "DateUpdated:asc" | "DateUpdated:desc"
    WorkerSid?: string;
}

type FetchWorkersParams = {
    AfterSid?: string;
    FriendlyName?: string;
    ActivitySid?: string;
    ActivityName?: string;
    TargetWorkersExpression?: string;
    Ordering?: "DateStatusChanged:asc" | "DateStatusChanged:desc"
    MaxWorkers?: number;
};

export class Workspace {
    constructor(jwt: string, options?: Object, workspaceSid?: string);
    readonly workspaceSid: string;

    updateToken(newToken: string): void;
    fetchWorker(workerSid: string): Promise<Worker>;
    fetchWorkers(params?: FetchWorkersParams): Promise<Map<string, Worker>>;
    fetchTaskQueue(queueSid: string): Promise<TaskQueue>;
    fetchTaskQueues(params?: FetchTaskQueuesParams): Promise<Map<string, TaskQueue>>;
    fetchTask(taskSid: string): Promise<Task>;
}

export interface Transfers {
    readonly incoming: IncomingTransfer | null;
    readonly outgoing: OutgoingTransfer | null;
}

export interface IncomingTransfer {
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly mode: "WARM" | "COLD";
    readonly reservationSid: string;
    readonly sid: string;
    readonly status: "INITIATED" | "FAILED" | "COMPLETE" | "CANCELED";
    readonly to: string;
    readonly type: "QUEUE" | "WORKER";
    readonly workerSid: string;
}

export interface OutgoingTransfer extends EventEmitter {
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly mode: "WARM" | "COLD";
    readonly reservationSid: string;
    readonly sid: string;
    readonly status: "INITIATED" | "FAILED" | "COMPLETED" | "CANCELED";
    readonly to: string;
    readonly transferFailedReason: string;
    readonly type: "QUEUE" | "WORKER";
    readonly workerSid: string;

    cancel(): Promise<OutgoingTransfer>;
}

export interface CallOptions {
    readonly accept?: boolean;
    readonly record?: boolean;
    readonly statusCallbackUrl?: string;
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
    transcribe?:boolean;
    transcriptionConfiguration?:string;
}
export interface RedirectOptions {
    accept?:boolean;
}

export interface RejectOptions {
    activitySid: string;
}

export interface TransferOptions {
    attributes?: Object;
    mode?: "COLD" | "WARM";
    priority?: number;
}

export interface TaskParticipantOptions extends TaskHoldOptions {
    hold: boolean;
}

export interface WrappingOptions {
    reason: string;
}

export interface ReservationParticipantOptions {
    endConferenceOnExit?: boolean;
    mute?: boolean;
    beepOnExit?: boolean;
}

export interface WorkerOptions {
    connectActivitySid?: string;
    closeExistingSessions?: boolean;
    setWorkerOfflineIfDisconnected?: boolean
    logLevel?: "error" | "warn" | "info" | "debug" | "trace" | "silent";
    ebServer?: string;
    wsServer?: string;
    eventHandlerClass?: typeof TaskRouterEventHandler;
    region?: string;
    enableVersionCheck?: boolean;
}

export interface WorkspaceOptions {
    region?: string;
    pageSize?: number;
    logLevel?: "error" | "warn" | "info" | "debug" | "trace" | "silent";
}

export interface TaskOptions {
    attributes?: any;
    taskChannelUniqueName?: string;
    taskChannelSid?: string;
}

export interface ActivityOptions {
    rejectPendingReservations?: boolean;
}

export interface TaskHoldOptions {
    holdUrl?: string;
    holdMethod?: string;
}

export interface TaskTransferOptions {
    attributes?: any;
    mode?: "WARM" | "COLD";
    priority?: string;
}
