import { API_V1 } from '../../../../lib/util/Constants';
import { pageSize1000 as mockList, defaultChannelInstance as mockInstance, channelsPageSize5Page0 as mockPage0, channelsPageSize5Page1 as mockPage1 } from '../../../mock/Channels';
import { token } from '../../../mock/Token';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');

import ChannelsEntity from '../../../../lib/data/ChannelsEntity';
import Configuration from '../../../../lib/util/Configuration';
import Request from '../../../../lib/util/Request';
import path from 'path';

describe('Channels', () => {
    const config = new Configuration(token);

    describe('constructor', () => {
        it('should throw an error if the configuration is missing', () => {
            (() => {
                new ChannelsEntity();
            }).should.throw(/config is a required parameter/);
        });

        it('should use the default pageSize=1000, if none provided', () => {
            const channelsServices = new ChannelsEntity(config, new Request(config));
            assert.equal(channelsServices._pageSize, 1000);
        });

        it('should use the pageSize, if provided', () => {
            const channelsServices = new ChannelsEntity(config, new Request(config), { pageSize: 50 });
            assert.equal(channelsServices._pageSize, 50);
        });
    });

    describe('#fetchChannels', () => {
        let sandbox;
        const requestURL = path.join('Workspaces', 'WSxxx', 'Workers', 'WKxxx', 'WorkerChannels');

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should fetch all channels', () => {
            const requestParams = { PageSize: 1000 };

            sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V1, requestParams).returns(Promise.resolve(mockList));

            const channelsServices = new ChannelsEntity(config, new Request(config));

            return channelsServices.fetchChannels().then(() => {
                expect(channelsServices.channels.size).to.equal(mockList.contents.length);

                channelsServices.channels.forEach(channel => {
                    if (channel.taskChannelUniqueName === 'default') {
                        expect(channel.accountSid).to.equal(mockInstance.account_sid);
                        expect(channel.workspaceSid).to.equal(mockInstance.workspace_sid);
                        expect(channel.workerSid).to.equal(mockInstance.worker_sid);
                        expect(channel.sid).to.equal(mockInstance.sid);
                        expect(channel.taskChannelSid).to.equal(mockInstance.task_channel_sid);
                        expect(channel.taskChannelUniqueName).to.equal(mockInstance.task_channel_unique_name);
                        expect(channel.capacity).to.equal(mockInstance.configured_capacity);
                        expect(channel.availableCapacityPercentage).to.equal(mockInstance.available_capacity_percentage);
                        expect(channel.available).to.equal(!!mockInstance.available);
                        expect(channel.assignedTasks).to.equal(mockInstance.assigned_tasks);
                        expect(channel.dateCreated).to.equalDate(new Date(mockInstance.date_created * 1000));
                        expect(channel.dateUpdated).to.equalDate(new Date(mockInstance.date_updated * 1000));
                        expect(channel.lastReservedTime).to.equalDate(new Date(mockInstance.last_reserved_time));
                    }
                });
            });
        });

        it('should paginate for the next page if needed', () => {
            const requestParamsPage0 = { PageSize: 5 };
            const requestParamsPage1 = { PageSize: 5, AfterSid: 'WCxx5' };

            const s = sandbox.stub(Request.prototype, 'get');
            s.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(mockPage0));
            s.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(mockPage1));

            const channelsServices = new ChannelsEntity(config, new Request(config), { pageSize: 5 });

            return channelsServices.fetchChannels().then(() => {
               expect(channelsServices.channels.size).to.equal(mockPage0.total);

                channelsServices.channels.forEach(channel => {
                    if (channel.taskChannelUniqueName === 'default') {
                        expect(channel.accountSid).to.equal(mockInstance.account_sid);
                        expect(channel.workspaceSid).to.equal(mockInstance.workspace_sid);
                        expect(channel.workerSid).to.equal(mockInstance.worker_sid);
                        expect(channel.sid).to.equal(mockInstance.sid);
                        expect(channel.taskChannelSid).to.equal(mockInstance.task_channel_sid);
                        expect(channel.taskChannelUniqueName).to.equal(mockInstance.task_channel_unique_name);
                        expect(channel.capacity).to.equal(mockInstance.configured_capacity);
                        expect(channel.availableCapacityPercentage).to.equal(mockInstance.available_capacity_percentage);
                        expect(channel.available).to.equal(!!mockInstance.available);
                        expect(channel.assignedTasks).to.equal(mockInstance.assigned_tasks);
                        expect(channel.dateCreated).to.equalDate(new Date(mockInstance.date_created * 1000));
                        expect(channel.dateUpdated).to.equalDate(new Date(mockInstance.date_updated * 1000));
                        expect(channel.lastReservedTime).to.equalDate(new Date(mockInstance.last_reserved_time));
                    }
                });
            });
        });
    });
});
