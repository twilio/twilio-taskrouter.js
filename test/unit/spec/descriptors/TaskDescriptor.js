import { assert } from 'chai';
import TaskDescriptor from '../../../../lib/descriptors/TaskDescriptor';
import { pendingReservationInstance as instance } from '../../../mock/Reservations';

describe('TaskDescriptor', () => {
    describe('constructor', () => {
        it('should throw an error if descriptor is not of type Object', () => {
            ['abc', 123, null].forEach(v => {
                (() => new TaskDescriptor(v)).should.throw(/<Descriptor>descriptor is required./);
            });
        });

        it('should throw an error if the descriptor does not contain all properties of a Task', () => {
            (() => {
                new TaskDescriptor({ 'account_sid': 'WAxxx' });
            }).should.throw(/<Descriptor>descriptor does not contain all properties of a Task./);
        });

        it('should set properties using data from the descriptor', () => {
            // task data on the reservation
            const taskDescriptor = new TaskDescriptor(instance.task);
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
        });

        it('should throw an error if unable to parse addons JSON', () => {
            const taskInstanceData = instance.task;
            taskInstanceData.addons = '{ bad }';
            (() => {
                new TaskDescriptor(taskInstanceData);
            }).should.throw();
        });

        it('should throw an error if unable to parse attributes JSON', () => {
            const taskInstanceData = instance.task;
            taskInstanceData.attributes = '{ bad }';
            (() => {
                new TaskDescriptor(taskInstanceData);
            }).should.throw();
        });
    });
});
