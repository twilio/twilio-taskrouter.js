export const SuperviseModes: string[];
export default Supervisor;
declare class Supervisor extends Worker {
    monitor(taskSid: string, reservationSid: string, extraParams?: Record<any, any> | undefined): Promise<void>;
    private _supervise;
}
import Worker from "./Worker";
