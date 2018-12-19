import { API_V2 } from '../../../../lib/util/Constants';
import { reservations as mockList, assignedReservationInstance as mockInstance } from '../../../mock/Reservations';
import Request from '../../../../lib/util/Request';
import ReservationsEntity from '../../../../lib/data/ReservationsEntity';
import Worker from '../../../../lib/Worker';
import { WorkerConfig } from '../../../mock/WorkerConfig';
import { token } from '../../../mock/Token';
import Configuration from '../../../../lib/util/Configuration';
import Routes from '../../../../lib/util/Routes';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.should();
const sinon = require('sinon');

describe('Reservations', () => {
    const config = new Configuration(token);
    const worker = new Worker(token, WorkerConfig);
    const routes = new Routes('WSxxx', 'WKxxx');
    sinon.stub(worker, 'getRoutes').returns(routes);

    describe('constructor', () => {
        it('should throw an error if the worker is missing', () => {
            (() => {
                new ReservationsEntity();
            }).should.throw(/worker is a required parameter/);
        });

        it('should use the default pageSize=1000, if none provided', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config));
            assert.equal(reservationsServices._pageSize, 1000);
        });

        it('should use the pageSize, if provided', () => {
            const reservationsServices = new ReservationsEntity(worker, new Request(config), { pageSize: 50 });
            assert.equal(reservationsServices._pageSize, 50);
        });
    });

    describe('#fetchReservations', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should fetch all reservations', () => {
            const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations';
            const requestParams = {
                Active: 'true',
                PageSize: 1000
            };

            sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V2, requestParams).returns(Promise.resolve(mockList));

            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            return reservationsServices.fetchReservations().then(() => {
                expect(reservationsServices.reservations.size).to.equal(mockList.contents.length);

                reservationsServices.reservations.forEach(reservation => {
                    if (reservation.sid === 'WRxx1') {
                        assert.equal(reservation.accountSid, mockInstance.account_sid);
                        assert.equal(reservation.workspaceSid, mockInstance.workspace_sid);
                        assert.equal(reservation.sid, mockInstance.sid);
                        assert.equal(reservation.workerSid, mockInstance.worker_sid);
                        assert.equal(reservation.status, mockInstance.reservation_status);
                        assert.equal(reservation.timeout, mockInstance.reservation_timeout);
                        assert.deepEqual(reservation.dateCreated, new Date(mockInstance.date_created * 1000));
                        assert.deepEqual(reservation.dateUpdated, new Date(mockInstance.date_updated * 1000));
                    }
                });
            });
        });

        it('should clear old reservations before refreshing the reservation map', () => {
            const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/Reservations';
            const requestParams = {
                Active: 'true',
                PageSize: 1000
            };

            sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V2, requestParams).returns(Promise.resolve(mockList));

            const reservationsServices = new ReservationsEntity(worker, new Request(config));

            return reservationsServices.fetchReservations().then(() => {
                expect(reservationsServices.reservations.size).to.equal(mockList.contents.length);

                reservationsServices.reservations.forEach(reservation => {
                    if (reservation.sid === 'WRxx1') {
                        assert.equal(reservation.accountSid, mockInstance.account_sid);
                        assert.equal(reservation.workspaceSid, mockInstance.workspace_sid);
                        assert.equal(reservation.sid, mockInstance.sid);
                        assert.equal(reservation.workerSid, mockInstance.worker_sid);
                        assert.equal(reservation.status, mockInstance.reservation_status);
                        assert.equal(reservation.timeout, mockInstance.reservation_timeout);
                        assert.deepEqual(reservation.dateCreated, new Date(mockInstance.date_created * 1000));
                        assert.deepEqual(reservation.dateUpdated, new Date(mockInstance.date_updated * 1000));
                    }
                });
            }).then(() => reservationsServices.fetchReservations()).then(() => {
                expect(reservationsServices.reservations.size).to.equal(mockList.contents.length);
            });
        });

        // TO DO: Post Paging Bug

        // it('should paginate for the next page if needed', () => {
        // });
    });

    // TO DO: Event test for Event: on('reservationAdded')
    // TO DO: Event test for Event: on('reservationDeleted')
});
