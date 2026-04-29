import TaskRouterEventHandler from '../../../../lib/handlers/TaskRouterEventHandler';
import Worker from '../../../../lib/Worker';
import { WorkerConfig } from '../../../mock/WorkerConfig';
import { token } from '../../../mock/Token';

const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');

describe('TaskRouterEventHandler', () => {
    let worker;
    let handler;

    beforeEach(() => {
        worker = new Worker(token, WorkerConfig);
        handler = new TaskRouterEventHandler(worker);
    });

    describe('constructor', () => {
        it('should create handler with default log level', () => {
            const h = new TaskRouterEventHandler(worker);
            assert.equal(h._logLevel, 'error');
        });

        it('should create handler with custom log level', () => {
            const h = new TaskRouterEventHandler(worker, { logLevel: 'debug' });
            assert.equal(h._logLevel, 'debug');
        });
    });

    describe('#getTREventsToHandlerMapping', () => {
        it('should return event mapping object', () => {
            const mapping = handler.getTREventsToHandlerMapping();
            assert.isObject(mapping);
            assert.equal(mapping['worker.activity.update'], '_workerActivityUpdateHandler');
            assert.equal(mapping['reservation.created'], '_reservationCreatedHandler');
        });
    });

    describe('#_workerActivityUpdateHandler', () => {
        it('should throw error when activity_sid is missing', () => {
            const eventData = {};
            assert.throws(() => {
                handler._workerActivityUpdateHandler(eventData);
            }, /Failed to update Worker/);
        });

        it('should throw error when activity not found in worker activities', () => {
            const eventData = { activity_sid: 'WAxx-nonexistent' };
            assert.throws(() => {
                handler._workerActivityUpdateHandler(eventData);
            }, /Failed to update Worker/);
        });
    });

    describe('#_workerCapacityUpdateHandler', () => {
        it('should throw error when channel sid is missing', () => {
            const eventData = {};
            assert.throws(() => {
                handler._workerCapacityUpdateHandler(eventData);
            }, /Failed to update Worker/);
        });

        it('should throw error when channel not found', () => {
            const eventData = { sid: 'WCxx-nonexistent' };
            assert.throws(() => {
                handler._workerCapacityUpdateHandler(eventData);
            }, /Failed to update Worker/);
        });
    });

    describe('#_workerChannelAvailabilityUpdateHandler', () => {
        it('should throw error when channel sid is missing', () => {
            const eventData = {};
            assert.throws(() => {
                handler._workerChannelAvailabilityUpdateHandler(eventData);
            }, /Failed to update Worker/);
        });

        it('should throw error when channel not found', () => {
            const eventData = { sid: 'WCxx-nonexistent' };
            assert.throws(() => {
                handler._workerChannelAvailabilityUpdateHandler(eventData);
            }, /Failed to update Worker/);
        });
    });

    describe('#_reservationCreatedHandler', () => {
        it('should throw error when reservation sid is missing', () => {
            const eventData = {};
            assert.throws(() => {
                handler._reservationCreatedHandler(eventData);
            }, /Failed to create Reservation/);
        });
    });

    describe('#_reservationFailedHandler', () => {
        it('should emit reservationFailed event', () => {
            const emitSpy = sinon.spy(worker, 'emit');
            const eventData = { sid: 'WRxx1', reason: 'timeout' };

            handler._reservationFailedHandler(eventData);

            assert.isTrue(emitSpy.calledWith('reservationFailed', eventData));
        });
    });

    describe('#_reservationUpdateHandler', () => {
        it('should throw error when reservation sid is missing', () => {
            const eventData = {};
            assert.throws(() => {
                handler._reservationUpdateHandler(eventData, 'reservation.accepted');
            }, /Failed to update Reservation/);
        });

        it('should throw error when reservation not found', () => {
            const eventData = { sid: 'WRxx-nonexistent' };
            assert.throws(() => {
                handler._reservationUpdateHandler(eventData, 'reservation.accepted');
            }, /Failed to update Worker/);
        });
    });

    describe('#_reservationCleanupEventsHandler', () => {
        it('should throw error when reservation sid is missing', () => {
            const eventData = {};
            assert.throws(() => {
                handler._reservationCleanupEventsHandler(eventData, 'reservation.completed');
            }, /Failed to update Reservation/);
        });

        it('should handle cleanup when reservation not found', () => {
            const eventData = { sid: 'WRxx-nonexistent' };
            assert.doesNotThrow(() => {
                handler._reservationCleanupEventsHandler(eventData, 'reservation.completed');
            });
        });
    });

    describe('#_taskTypeEventHandler', () => {
        it('should throw error when task sid is missing', () => {
            const eventData = {};
            assert.throws(() => {
                handler._taskTypeEventHandler(eventData, 'task.updated');
            }, /Failed to emit event for Worker/);
        });

        it('should handle event when task not found', () => {
            const eventData = { sid: 'WTxx-nonexistent' };
            assert.doesNotThrow(() => {
                handler._taskTypeEventHandler(eventData, 'task.updated');
            });
        });
    });

    describe('#_transferTaskEventHandler', () => {
        it('should throw error when reservation sid is missing', () => {
            const eventData = { task_sid: 'WTxx1' };
            assert.throws(() => {
                handler._transferTaskEventHandler(eventData, 'task.transfer-initiated');
            }, /Failed to emit event for Worker/);
        });

        it('should throw error when task sid is missing', () => {
            const eventData = { initiating_reservation_sid: 'WRxx1' };
            assert.throws(() => {
                handler._transferTaskEventHandler(eventData, 'task.transfer-initiated');
            }, /Failed to emit event for Worker/);
        });

        it('should handle event when reservation not found', () => {
            const eventData = {
                initiating_reservation_sid: 'WRxx-nonexistent',
                task_sid: 'WTxx1'
            };
            assert.doesNotThrow(() => {
                handler._transferTaskEventHandler(eventData, 'task.transfer-initiated');
            });
        });
    });
});
