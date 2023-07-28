export const TaskProperties: string[];
export default Task;
export type TransferOptions = {
    attributes: Record<any, any>;
    mode: 'WARM' | 'COLD';
    priority: number;
};
export type WrappingOptions = {
    reason: string;
};
export type TaskParticipantOptions = {
    hold: boolean;
    holdUrl: string;
    holdMethod: 'GET';
};
export type HoldOptions = {
    holdUrl: string;
    holdMethod: 'GET';
};
declare interface Task extends EventEmitter {
    readonly transfers: Transfers;
    readonly addOns: Record<any, any>;
    readonly age: number;
    readonly attributes: Record<any, any>;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly priority: number;
    readonly queueName: string;
    readonly queueSid: string;
    readonly reason: string;
    readonly routingTarget: string;
    readonly sid: string;
    readonly status: 'pending' | 'reserved' | 'assigned' | 'canceled' | 'completed' | 'wrapping';
    readonly taskChannelUniqueName: string;
    readonly taskChannelSid: string;
    readonly timeout: number;
    readonly workflowName: string;
    readonly workflowSid: string;
    readonly version: string;
    readonly reservationSid: string;
    complete(reason: string): Promise<Task>;
    transfer(to: string, options?: TransferOptions | undefined): Promise<Task>;
    wrapUp(options?: WrappingOptions): Promise<Task>;
    setAttributes(attributes: Record<any, any>): Promise<Task>;
    updateParticipant(options: TaskParticipantOptions): Promise<Task>;
    kick(workerSid: string): Promise<Task>;
    hold(targetWorkerSid: string, onHold: boolean, options: HoldOptions): Promise<Task>;
    fetchLatestVersion(): Promise<Task>;
}
import { EventEmitter } from "events";
import Transfers from "./core/transfer/Transfers";
import Worker from "./Worker";
import TaskDescriptor from "./descriptors/TaskDescriptor";
