export const ReservationProperties: string[];
export default Reservation;
export type RejectOptions = {
    activitySid: string;
};
export type CallOptions = {
    accept?: boolean | undefined;
    record?: string | undefined;
    statusCallbackUrl?: string | undefined;
    to?: string | undefined;
    timeout?: number | undefined;
};
export type DequeueOptions = {
    from?: string | undefined;
    to?: string | undefined;
    postWorkActivitySid?: string | undefined;
    record?: string | undefined;
    timeout?: number | undefined;
    statusCallbackUrl?: string | undefined;
    statusCallbackEvents?: string | undefined;
};
export type RedirectOptions = {
    accept?: boolean | undefined;
};
export type ConferenceOptions = {
    to?: string | undefined;
    from?: string | undefined;
    timeout?: number | undefined;
    statusCallback?: string | undefined;
    statusCallbackMethod?: string | undefined;
    statusCallbackEvent?: string | undefined;
    record?: string | undefined;
    muted?: boolean | undefined;
    beep?: string | boolean | undefined;
    startConferenceOnEnter?: boolean | undefined;
    endConferenceOnExit?: boolean | undefined;
    endConferenceOnCustomerExit?: boolean | undefined;
    beepOnCustomerEntrance?: boolean | undefined;
    waitUrl?: string | undefined;
    waitMethod?: string | undefined;
    earlyMedia?: boolean | undefined;
    maxParticipants?: number | undefined;
    conferenceStatusCallback?: string | undefined;
    conferenceStatusCallbackMethod?: string | undefined;
    conferenceStatusCallbackEvent?: string | undefined;
    conferenceRecord?: string | boolean | undefined;
    conferenceTrim?: string | undefined;
    recordingChannels?: string | undefined;
    recordingStatusCallback?: string | undefined;
    recordingStatusCallbackMethod?: string | undefined;
    conferenceRecordingStatusCallback?: string | undefined;
    conferenceRecordingStatusCallbackMethod?: string | undefined;
    region?: string | undefined;
    sipAuthUsername?: string | undefined;
    sipAuthPassword?: string | undefined;
};
export type ReservationParticipantOptions = {
    endConferenceOnExit: boolean;
    mute: boolean;
    beepOnExit: boolean;
};
declare interface Reservation extends EventEmitter {
    readonly task: Task | {};
    readonly transfer: IncomingTransfer | {};
    readonly accountSid: string;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly sid: string;
    readonly status: "pending" | "accepted" | "rejected" | "timeout" | "canceled" | "rescinded" | "wrapping" | "completed";
    readonly timeout: number;
    readonly workerSid: string;
    readonly workspaceSid: string;
    readonly version: string;
    readonly canceledReasonCode: number | undefined;
    accept(): Promise<Reservation>;
    complete(): Promise<Reservation>;
    reject(options?: RejectOptions | undefined): Promise<Reservation>;
    wrap(): Promise<Reservation>;
    call(from: string, url: string, options?: CallOptions | undefined): Promise<Reservation>;
    dequeue(options?: DequeueOptions | undefined): Promise<Reservation>;
    redirect(callSid: string, url: string, options?: RedirectOptions | undefined): Promise<Reservation>;
    conference(options?: ConferenceOptions | undefined): Promise<Reservation>;
    updateParticipant(options: ReservationParticipantOptions): Promise<Reservation>;
    fetchLatestVersion(): Promise<Reservation>;
}
import { EventEmitter } from "events";
import Task from "./Task";
import IncomingTransfer from "./core/transfer/IncomingTransfer";
import ReservationDescriptor from "./descriptors/ReservationDescriptor";
