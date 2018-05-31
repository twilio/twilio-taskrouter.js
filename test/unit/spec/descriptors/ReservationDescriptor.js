import _ from 'lodash';
import { assert } from 'chai';
import ReservationDescriptor from '../../../../lib/descriptors/ReservationDescriptor';
import TaskDescriptor from '../../../../lib/descriptors/TaskDescriptor';
import Worker from '../../../../lib/Worker';
import { pendingReservationInstance as instance } from '../../../mock/Reservations';
import { token } from '../../../mock/Token';
import { WorkerConfig } from '../../../mock/WorkerConfig';

describe('ReservationDescriptor', () => {
    const worker = new Worker(token, WorkerConfig);

    describe('constructor', () => {
        it('should throw an error if descriptor is not of type Object', () => {
            ['abc', 123, null].forEach(v => {
                (() => new ReservationDescriptor(v)).should.throw(/<Descriptor>descriptor is required./);
            });
        });

        it('should throw an error if the worker is not of type Worker', () => {
            (() => {
                new ReservationDescriptor(instance, 'abc');
            }).should.throw(/<Worker>worker is required./);
        });

        it('should throw an error if the descriptor does not contain all properties of a Reservation', () => {
            (() => {
                new ReservationDescriptor({ 'account_sid': 'WAxxx' }, worker);
            }).should.throw(/<Descriptor>descriptor does not contain all properties of a Reservation./);
        });

        it('should set properties using data from the descriptor', () => {
            const reservationDescriptor = new ReservationDescriptor(instance, worker);
            assert.equal(reservationDescriptor.accountSid, instance.account_sid);
            assert.equal(reservationDescriptor.workspaceSid, instance.workspace_sid);
            assert.equal(reservationDescriptor.sid, instance.sid);
            assert.equal(reservationDescriptor.workerSid, instance.worker_sid);
            assert.equal(reservationDescriptor.status, instance.reservation_status);
            assert.equal(reservationDescriptor.timeout, instance.reservation_timeout);
            assert.deepEqual(reservationDescriptor.dateCreated, new Date(instance.date_created * 1000));
            assert.deepEqual(reservationDescriptor.dateUpdated, new Date(instance.date_updated * 1000));

            // task data on the reservation
            const taskDescriptor = new TaskDescriptor(instance.task, worker);
            assert.deepEqual(taskDescriptor.addOns, JSON.parse(instance.task.addons));
            assert.equal(taskDescriptor.age, instance.task.age);
            assert.deepEqual(taskDescriptor.attributes, JSON.parse(instance.task.attributes));
            assert.deepEqual(taskDescriptor.dateCreated, new Date(instance.task.date_created * 1000));
            assert.deepEqual(taskDescriptor.dateUpdated, new Date(instance.task.date_updated * 1000));
            assert.equal(taskDescriptor.priority, instance.task.priority);
            assert.equal(taskDescriptor.queueName, instance.task.queue_name);
            assert.equal(taskDescriptor.queueSid, instance.task.queue_sid);
            assert.equal(taskDescriptor.reason, instance.task.reason);
            assert.equal(taskDescriptor.sid, instance.task.sid);
            assert.equal(taskDescriptor.status, instance.task.assignment_status);
            assert.equal(taskDescriptor.taskChannelUniqueName, instance.task.task_channel_unique_name);
            assert.equal(taskDescriptor.taskChannelSid, instance.task.task_channel_sid);
            assert.equal(taskDescriptor.timeout, instance.task.timeout);
            assert.equal(taskDescriptor.workflowSid, instance.task.workflow_sid);
            assert.equal(taskDescriptor.workflowName, instance.task.workflow_name);

            // check that the reservation's taskDescriptor matches
            assert.deepEqual(reservationDescriptor.taskDescriptor, taskDescriptor);
        });

        it('should throw an error if the task property is malformed or missing a required property', () => {
            const badReservationInstance = _.cloneDeep(instance);
            _.unset(badReservationInstance, 'task.workflow_sid');
            (() => {
                new ReservationDescriptor(badReservationInstance, worker);
            }).should.throw(/<Descriptor>descriptor does not contain all properties of a Task./);
        });
    });
});
