import { assert } from 'chai';
import { describe, it } from 'mocha';
import Configuration from '../../../../lib/util/Configuration';
import TaskDescriptor from '../../../../lib/descriptors/TaskDescriptor';
import { pendingReservationInstance as instance } from '../../../mock/Reservations';
import { token } from '../../../mock/Token';

describe('TaskDescriptor', () => {
    const config = new Configuration(token);
    describe('constructor', () => {
        it('should throw an error if descriptor is not of type Object', () => {
            ['abc', 123, null].forEach(v => {
                (() => new TaskDescriptor(v)).should.throw(/<Descriptor>descriptor is required./);
            });
        });

        it('should throw an error if the config is not of type Configuration', () => {
            (() => {
                new TaskDescriptor(instance.task, 'abc');
            }).should.throw(/<Configuration>config is required./);
        });

        it('should throw an error if the descriptor does not contain all properties of a Task', () => {
            (() => {
                new TaskDescriptor({ 'account_sid': 'WAxxx' }, config);
            }).should.throw(/<Descriptor>descriptor does not contain all properties of a Task./);
        });

        it('should set properties using data from the descriptor', () => {
            // task data on the reservation
            const taskDescriptor = new TaskDescriptor(instance.task, config);
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
                new TaskDescriptor(taskInstanceData, config);
            }).should.throw(/Unexpected token/);
        });

        it('should throw an error if unable to parse attributes JSON', () => {
            const taskInstanceData = instance.task;
            taskInstanceData.attributes = '{ bad }';
            (() => {
                new TaskDescriptor(taskInstanceData, config);
            }).should.throw(/Unexpected token/);
        });
    });
});
