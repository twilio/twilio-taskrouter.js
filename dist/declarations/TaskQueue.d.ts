export const TaskQueueProperties: string[];
export default TaskQueue;
declare interface TaskQueue {
    readonly sid: string;
    readonly queueSid: string;
    readonly accountSid: string;
    readonly workspaceSid: string;
    readonly name: string;
    readonly queueName: string;
    readonly assignmentActivityName: string;
    readonly reservationActivityName: string;
    readonly assignmentActivitySid: string;
    readonly reservationActivitySid: string;
    readonly targetWorkers: string;
    readonly maxReservedWorkers: number;
    readonly taskOrder: string;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
}
import TaskQueueDescriptor from "./descriptors/TaskQueueDescriptor";
