const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');

import Channel from '../../../lib/Channel';
import Configuration from '../../../lib/util/Configuration';
import { defaultChannelInstance } from '../../mock/Channels';
import Logger from '../../../lib/util/Logger';
const mockEvents = require('../../mock/Events').events;
import Request from '../../../lib/util/Request';
import { token } from '../../mock/Token';
import WorkerChannelDescriptor from '../../../lib/descriptors/WorkerChannelDescriptor';

describe('Channel', function() {

    const config = new Configuration(token);
    const defaultChannelDescriptor = new WorkerChannelDescriptor(defaultChannelInstance);

    describe('constructor', () => {
          it('should throw an error if config is missing', () => {
            (() => {
                new Channel(null);
            }).should.throw(/config is a required parameter/);
        });

        it('should throw an error if channel descriptor is missing', () => {
            (() => {
                new Channel(config, null);
            }).should.throw(/descriptor is a required parameter/);
        });

        it('should set properties using the payload', () => {
            const defaultChannel = new Channel(config, new Request(config), defaultChannelDescriptor);

            assert.equal(defaultChannel.accountSid, defaultChannelInstance.account_sid);
            assert.equal(defaultChannel.assignedTasks, defaultChannelInstance.assigned_tasks);
            assert.equal(defaultChannel.available, defaultChannelInstance.available);
            assert.equal(defaultChannel.capacity, defaultChannelInstance.configured_capacity);
            assert.equal(defaultChannel.availableCapacityPercentage, defaultChannelInstance.available_capacity_percentage);
            assert.equalDate(defaultChannel.dateCreated, new Date(defaultChannelInstance.date_created * 1000));
            assert.equalDate(defaultChannel.dateUpdated, new Date(defaultChannelInstance.date_updated * 1000));
            assert.equalDate(defaultChannel.lastReservedTime, new Date(defaultChannelInstance.last_reserved_time));
            assert.equal(defaultChannel.sid, defaultChannelInstance.sid);
            assert.equal(defaultChannel.taskChannelSid, defaultChannelInstance.task_channel_sid);
            assert.equal(defaultChannel.taskChannelUniqueName, defaultChannelInstance.task_channel_unique_name);
            assert.equal(defaultChannel.workerSid, defaultChannelInstance.worker_sid);
            assert.equal(defaultChannel.workspaceSid, defaultChannelInstance.workspace_sid);

            assert.equal(defaultChannel._config, config);
            assert.instanceOf(defaultChannel._log, Logger);
        });
    });

    describe('#_emitEvent(eventType, payload)', () => {
        it('should emit Event:on(capacityUpdated)', () => {
            const spy = sinon.spy();

            const defaultChannel = new Channel(config, new Request(config), defaultChannelDescriptor);
            assert.equal(defaultChannel.capacity, 2);
            defaultChannel.on('capacityUpdated', spy);

            defaultChannel._emitEvent('capacityUpdated', mockEvents.channel.capacityUpdated);

            assert.isTrue(spy.calledOnce);
            assert.equal(defaultChannel.capacity, 5);
            assert.equal(defaultChannel.available, true);
            assert.equalDate(defaultChannel.dateCreated, defaultChannelDescriptor.dateCreated);
            assert.equalDate(defaultChannel.dateUpdated, new Date(mockEvents.channel.capacityUpdated.date_updated * 1000));
            assert.equalDate(defaultChannel.lastReservedTime, new Date(mockEvents.channel.capacityUpdated.last_reserved_time));
            assert.equal(defaultChannel.assignedTasks, mockEvents.channel.capacityUpdated.assigned_tasks);
            assert.equal(defaultChannel.availableCapacityPercentage, mockEvents.channel.capacityUpdated.available_capacity_percentage);
        });

        it('should emit Event:on(availabilityUpdated)', () => {
            const spy = sinon.spy();

            const defaultChannel = new Channel(config, new Request(config), defaultChannelDescriptor);
            assert.equal(defaultChannel.available, true);
            defaultChannel.on('availabilityUpdated', spy);

            defaultChannel._emitEvent('availabilityUpdated', mockEvents.channel.availabilityUpdated);

            assert.isTrue(spy.calledOnce);
            assert.equal(defaultChannel.capacity, 1);
            assert.equal(defaultChannel.available, false);
            assert.equalDate(defaultChannel.dateCreated, defaultChannelDescriptor.dateCreated);
            assert.equalDate(defaultChannel.dateUpdated, new Date(mockEvents.channel.capacityUpdated.date_updated * 1000));
            assert.equalDate(defaultChannel.lastReservedTime, new Date(mockEvents.channel.capacityUpdated.last_reserved_time));
            assert.equal(defaultChannel.assignedTasks, mockEvents.channel.capacityUpdated.assigned_tasks);
            assert.equal(defaultChannel.availableCapacityPercentage, mockEvents.channel.capacityUpdated.available_capacity_percentage);
        });
    });
});
