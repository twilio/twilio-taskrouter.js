export default class ReservationsEntity extends EventEmitter {
    constructor(worker: Worker, request: typeof import("../util/Request"), options?: Reservations.Options | undefined);
    private _worker;
    private _log;
    private _request;
    private _reservations;
    private _reservationSidsByTask;
    private _pageSize;
    get reservations(): Map<string, Reservation>;
    public fetchReservations(): Promise<Map<string, Reservation>>;
    private _getAllReservations;
    private _getPage;
    private _insertReservation;
    public insert(rawReservationData: Object): Reservation;
    public getTasks(taskSid: string): [typeof import("../Task")] | null;
    private _deleteByReservationSid;
    private _cleanUpReservationAndTask;
}
export namespace Reservations {
    type Options = {
        pageSize?: number | undefined;
    };
}
import { EventEmitter } from "events";
import Reservation from "../Reservation";
import Worker from "../Worker";
