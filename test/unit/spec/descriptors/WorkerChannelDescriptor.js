import { assert } from 'chai';

import WorkerChannelDescriptor from '../../../../lib/descriptors/WorkerChannelDescriptor';
import { defaultChannelInstance as instance } from '../../../mock/Channels';

describe('WorkerChannelDescriptor', () => {
    describe('constructor', () => {
        it('should throw an error if descriptor is not of type Object', () => {
            ['abc', 123, null].forEach(v => {
                (() => new WorkerChannelDescriptor(v)).should.throw(/<Descriptor>descriptor is required./);
            });
        });

        it('should throw an error if the descriptor does not contain all properties of an Activity', () => {
            (() => {
                new WorkerChannelDescriptor({ 'account_sid': 'WAxxx' });
            }).should.throw(/<Descriptor>descriptor does not contain all properties of a Channel./);
        });

        it('should set properties using data from the descriptor', () => {
            const defaultChannelDescriptor = new WorkerChannelDescriptor(instance);
            assert.equal(defaultChannelDescriptor.accountSid, instance.account_sid);
            assert.equal(defaultChannelDescriptor.workspaceSid, instance.workspace_sid);
            assert.equal(defaultChannelDescriptor.sid, instance.sid);
            assert.equal(defaultChannelDescriptor.workerSid, instance.worker_sid);
            assert.equal(defaultChannelDescriptor.taskChannelSid, instance.task_channel_sid);
            assert.equal(defaultChannelDescriptor.taskChannelUniqueName, instance.task_channel_unique_name);
            assert.equal(defaultChannelDescriptor.capacity, instance.configured_capacity);
            assert.equal(defaultChannelDescriptor.availableCapacityPercentage, instance.available_capacity_percentage);
            assert.equal(defaultChannelDescriptor.available, instance.available);
            assert.equal(defaultChannelDescriptor.assignedTasks, instance.assigned_tasks);
            assert.deepEqual(defaultChannelDescriptor.dateCreated, new Date(instance.date_created * 1000));
            assert.deepEqual(defaultChannelDescriptor.dateUpdated, new Date(instance.date_updated * 1000));
            assert.deepEqual(defaultChannelDescriptor.lastReservedTime, new Date(instance.last_reserved_time));
        });
    });
});
