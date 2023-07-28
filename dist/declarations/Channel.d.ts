export const ChannelProperties: string[];
export default Channel;
declare interface Channel extends EventEmitter {
    readonly accountSid: string;
    readonly assignedTasks: number;
    readonly available: boolean;
    readonly availableCapacityPercentage: number;
    readonly capacity: number;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly lastReservedTime: Date;
    readonly sid: string;
    readonly taskChannelSid: string;
    readonly taskChannelUniqueName: string;
    readonly workerSid: string;
    readonly workspaceSid: string;
}
import { EventEmitter } from "events";
import WorkerChannelDescriptor from "./descriptors/WorkerChannelDescriptor";
