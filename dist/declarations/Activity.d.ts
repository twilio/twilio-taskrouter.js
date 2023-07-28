export const ActivityProperties: string[];
export default Activity;
export type ActivityUpdateOptions = {
    rejectPendingReservations?: boolean | undefined;
};
declare interface Activity {
    readonly accountSid: string;
    readonly available: boolean;
    readonly dateCreated: Date;
    readonly dateUpdated: Date;
    readonly name: string;
    readonly sid: string;
    readonly workspaceSid: string;
    get isCurrent(): boolean;
    setAsCurrent(options?: ActivityUpdateOptions | undefined): Promise<Activity>;
}
import ActivityDescriptor from "./descriptors/ActivityDescriptor";
