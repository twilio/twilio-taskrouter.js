const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');

import { assignedReservationInstance, pendingReservationInstance } from '../../mock/Reservations';
import { API_V1, TASK_STATUS_COMPLETED, TASK_STATUS_WRAPPING } from '../../../lib/util/Constants';
import Configuration from '../../../lib/util/Configuration';
const Errors = require('../../../lib/util/Constants').twilioErrors;
const mockEvents = require('../../mock/Events').events;
import Request from '../../../lib/util/Request';
import Task from '../../../lib/Task';
import { taskCompleted, taskWrapping, updatedTaskAttributes } from '../../mock/Responses';
import TaskDescriptor from '../../../lib/descriptors/TaskDescriptor';
import { token } from '../../mock/Token';
import Worker from '../../../lib/Worker';
import { WorkerConfig } from '../../mock/WorkerConfig';
import Routes from '../../../lib/util/Routes';

describe('Task', () => {
    const config = new Configuration(token);
    const worker = new Worker(token, WorkerConfig);
    const routes = new Routes('WSxxx', 'WKxxx');
    sinon.stub(worker, 'getRoutes').returns(routes);

    const assignedTaskData = assignedReservationInstance.task;
    const assignedTaskDescriptor = new TaskDescriptor(assignedTaskData, new Request(config));

    const pendingTaskData = pendingReservationInstance.task;
    const pendingTaskDescriptor = new TaskDescriptor(pendingTaskData, new Request(config));

    describe('constructor', () => {
        it('should throw an error if worker is missing', () => {
            (() => {
                new Task();
            }).should.throw(/worker is a required parameter/);
        });

        it('should throw an error if task descriptor is missing', () => {
            (() => {
                new Task(worker);
            }).should.throw(/descriptor is a required parameter/);
        });

        it('should set Task properties', () => {
            const task = new Task(worker, new Request(config), assignedTaskDescriptor);

            assert.equal(task.age, assignedTaskData.age);
            assert.deepEqual(task.attributes, JSON.parse(assignedTaskData.attributes));
            assert.equalDate(task.dateCreated, new Date(assignedTaskData.date_created * 1000));
            assert.equalDate(task.dateUpdated, new Date(assignedTaskData.date_updated * 1000));
            assert.equal(task.priority, assignedTaskData.priority);
            assert.equal(task.reason, assignedTaskData.reason);
            assert.equal(task.sid, assignedTaskData.sid);
            assert.equal(task.status, assignedTaskData.assignment_status);
            assert.equal(task.taskChannelSid, assignedTaskData.task_channel_sid);
            assert.equal(task.taskChannelUniqueName, assignedTaskData.task_channel_unique_name);
            assert.equal(task.queueName, assignedTaskData.queue_name);
            assert.equal(task.queueSid, assignedTaskData.queue_sid);
            assert.equal(task.timeout, assignedTaskData.timeout);
            assert.equal(task.workflowName, assignedTaskData.workflow_name);
            assert.equal(task.workflowSid, assignedTaskData.workflow_sid);
        });
    });

    describe('#complete(reason)', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Tasks/WTxx1';

        const requestParams = {
            AssignmentStatus: TASK_STATUS_COMPLETED,
            Reason: 'Task is completed.'
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should throw an Error if a <String>reason is not provided as argument', () => {
            (() => {
                const task = new Task(worker, new Request(config), assignedTaskDescriptor);
                task.complete();
            }).should.throw(/reason is a required parameter/);
        });

        it('should update the Task reason and properties upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(taskCompleted));
            const task = new Task(worker, new Request(config), assignedTaskDescriptor);

            return task.complete('Task is completed.').then(() => {
                expect(task.reason).to.equal('Task is completed.');
                expect(task.workflowSid).to.equal(taskCompleted.workflow_sid);
                expect(task.workflowName).to.equal(taskCompleted.workflow_name);
                expect(task.queueSid).to.equal(taskCompleted.queue_sid);
                expect(task.queueName).to.equal(taskCompleted.queue_name);
                expect(task.taskChannelSid).to.equal(taskCompleted.task_channel_sid);
                expect(task.taskChannelUniqueName).to.equal(taskCompleted.task_channel_unique_name);
                expect(task.status).to.equal(taskCompleted.assignment_status);
                expect(task.attributes).to.deep.equal(JSON.parse(taskCompleted.attributes));
                expect(task.age).to.equal(taskCompleted.age);
                expect(task.priority).to.equal(taskCompleted.priority);
                expect(task.timeout).to.equal(taskCompleted.timeout);
                expect(task.dateCreated).to.equalDate(new Date(taskCompleted.date_created * 1000));
                expect(task.dateUpdated).to.equalDate(new Date(taskCompleted.date_updated * 1000));
            });
        });

        it('should return an error if unable to complete the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);

            return task.complete('Task is completed.').catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
                expect(task.reason).to.not.equal('Task is completed.');
            });
        });

        it('should not change any Task properties if unable to complete the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);

            return task.complete('Task is completed.').catch(() => {
                expect(task.age).to.equal(assignedTaskDescriptor.age);
                expect(task.accountSid).to.equal(assignedTaskDescriptor.accountSid);
                expect(task.attributes).to.deep.equal(assignedTaskDescriptor.attributes);
                expect(task.addOns).to.deep.equal(assignedTaskDescriptor.addOns);
                expect(task.dateCreated).to.equalDate(assignedTaskDescriptor.dateCreated);
                expect(task.dateUpdated).to.equalDate(assignedTaskDescriptor.dateUpdated);
                expect(task.priority).to.equal(assignedTaskDescriptor.priority);
                expect(task.reason).to.equal(assignedTaskDescriptor.reason);
                expect(task.sid).to.equal(assignedTaskDescriptor.sid);
                expect(task.status).to.equal(assignedTaskDescriptor.status);
                expect(task.taskChannelSid).to.equal(assignedTaskDescriptor.taskChannelSid);
                expect(task.taskChannelUniqueName).to.equal(assignedTaskDescriptor.taskChannelUniqueName);
                expect(task.queueName).to.equal(assignedTaskDescriptor.queueName);
                expect(task.queueSid).to.equal(assignedTaskDescriptor.queueSid);
                expect(task.timeout).to.equal(assignedTaskDescriptor.timeout);
                expect(task.workflowName).to.equal(assignedTaskDescriptor.workflowName);
                expect(task.workflowSid).to.equal(assignedTaskDescriptor.workflowSid);
                expect(task.workspaceSid).to.equal(assignedTaskDescriptor.workspaceSid);
            });
        });
    });

    describe('#wrapUp(options)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Tasks/WTxx1';
        const requestParams = {
            AssignmentStatus: TASK_STATUS_WRAPPING,
            Reason: 'Task is wrapping.'
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should update the Task reason and properties upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(taskWrapping));

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);

            return task.wrapUp({ reason: 'Task is wrapping.' }).then(() => {
                expect(task.reason).to.equal('Task is wrapping.');
                expect(task.workflowSid).to.equal(taskWrapping.workflow_sid);
                expect(task.workflowName).to.equal(taskWrapping.workflow_name);
                expect(task.queueSid).to.equal(taskWrapping.queue_sid);
                expect(task.queueName).to.equal(taskWrapping.queue_name);
                expect(task.taskChannelSid).to.equal(taskWrapping.task_channel_sid);
                expect(task.taskChannelUniqueName).to.equal(taskWrapping.task_channel_unique_name);
                expect(task.status).to.equal(taskWrapping.assignment_status);
                expect(task.attributes).to.deep.equal(JSON.parse(taskWrapping.attributes));
                expect(task.age).to.equal(taskWrapping.age);
                expect(task.priority).to.equal(taskWrapping.priority);
                expect(task.timeout).to.equal(taskWrapping.timeout);
                expect(task.dateCreated).to.equalDate(new Date(taskWrapping.date_created * 1000));
                expect(task.dateUpdated).to.equalDate(new Date(taskWrapping.date_updated * 1000));
            });
        });

        it('should return an error if unable to wrap the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);

            return task.wrapUp({ reason: 'Task is wrapping.' }).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
                expect(task.reason).to.not.equal('Task is wrapping.');
            });
        });

        it('should not change any Task properties if unable to wrap the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);

            return task.wrapUp({ reason: 'Task is wrapping.' }).catch(() => {
                expect(task.age).to.equal(assignedTaskDescriptor.age);
                expect(task.accountSid).to.equal(assignedTaskDescriptor.accountSid);
                expect(task.attributes).to.deep.equal(assignedTaskDescriptor.attributes);
                expect(task.addOns).to.deep.equal(assignedTaskDescriptor.addOns);
                expect(task.dateCreated).to.equalDate(assignedTaskDescriptor.dateCreated);
                expect(task.dateUpdated).to.equalDate(assignedTaskDescriptor.dateUpdated);
                expect(task.priority).to.equal(assignedTaskDescriptor.priority);
                expect(task.reason).to.equal(assignedTaskDescriptor.reason);
                expect(task.sid).to.equal(assignedTaskDescriptor.sid);
                expect(task.status).to.equal(assignedTaskDescriptor.status);
                expect(task.taskChannelSid).to.equal(assignedTaskDescriptor.taskChannelSid);
                expect(task.taskChannelUniqueName).to.equal(assignedTaskDescriptor.taskChannelUniqueName);
                expect(task.queueName).to.equal(assignedTaskDescriptor.queueName);
                expect(task.queueSid).to.equal(assignedTaskDescriptor.queueSid);
                expect(task.timeout).to.equal(assignedTaskDescriptor.timeout);
                expect(task.workflowName).to.equal(assignedTaskDescriptor.workflowName);
                expect(task.workflowSid).to.equal(assignedTaskDescriptor.workflowSid);
                expect(task.workspaceSid).to.equal(assignedTaskDescriptor.workspaceSid);
            });
        });
    });

    describe('#setAttributes(attributes)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Tasks/WTxx1';
        const requestParams = {
            Attributes: '{"languages":["en"]}',
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should update the Task attributes upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(updatedTaskAttributes));

            const task = new Task(config, new Request(config), assignedTaskDescriptor);

            return task.setAttributes({ languages: ['en'] }).then(() => {
                expect(task.reason).to.equal(updatedTaskAttributes.reason);
                expect(task.workflowSid).to.equal(updatedTaskAttributes.workflow_sid);
                expect(task.workflowName).to.equal(updatedTaskAttributes.workflow_name);
                expect(task.queueSid).to.equal(updatedTaskAttributes.queue_sid);
                expect(task.queueName).to.equal(updatedTaskAttributes.queue_name);
                expect(task.taskChannelSid).to.equal(updatedTaskAttributes.task_channel_sid);
                expect(task.taskChannelUniqueName).to.equal(updatedTaskAttributes.task_channel_unique_name);
                expect(task.status).to.equal(updatedTaskAttributes.assignment_status);
                expect(task.attributes).to.deep.equal(JSON.parse(updatedTaskAttributes.attributes));
                expect(task.age).to.equal(updatedTaskAttributes.age);
                expect(task.priority).to.equal(updatedTaskAttributes.priority);
                expect(task.timeout).to.equal(updatedTaskAttributes.timeout);
                expect(task.dateCreated).to.equalDate(new Date(updatedTaskAttributes.date_created * 1000));
                expect(task.dateUpdated).to.equalDate(new Date(updatedTaskAttributes.date_updated * 1000));
            });
        });

        it('should throw an error if attributes parameter is missing', () => {
            (() => {
                const task = new Task(config, new Request(config), assignedTaskDescriptor);

                task.setAttributes();
            }).should.throw(/attributes is a required parameter/);
        });

        it('should not update the attributes, if none provided', () => {
            const task = new Task(config, new Request(config), assignedTaskDescriptor);

            (() => {
                task.setAttributes();
            }).should.throw(/attributes is a required parameter/);
            assert.equal(task.attributes, assignedTaskDescriptor.attributes);
        });

        it('should return an error if attributes update failed', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(config, new Request(config), assignedTaskDescriptor);

            return task.setAttributes({ languages: ['en'] }).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });

        it('should not update any unrelated Task properties', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(config, new Request(config), assignedTaskDescriptor);

            return task.setAttributes({ languages: ['en'] }).catch(() => {
                expect(task.age).to.equal(assignedTaskDescriptor.age);
                expect(task.accountSid).to.equal(assignedTaskDescriptor.accountSid);
                expect(task.attributes).to.deep.equal(assignedTaskDescriptor.attributes);
                expect(task.addOns).to.deep.equal(assignedTaskDescriptor.addOns);
                expect(task.dateCreated).to.equalDate(assignedTaskDescriptor.dateCreated);
                expect(task.dateUpdated).to.equalDate(assignedTaskDescriptor.dateUpdated);
                expect(task.priority).to.equal(assignedTaskDescriptor.priority);
                expect(task.reason).to.equal(assignedTaskDescriptor.reason);
                expect(task.sid).to.equal(assignedTaskDescriptor.sid);
                expect(task.status).to.equal(assignedTaskDescriptor.status);
                expect(task.taskChannelSid).to.equal(assignedTaskDescriptor.taskChannelSid);
                expect(task.taskChannelUniqueName).to.equal(assignedTaskDescriptor.taskChannelUniqueName);
                expect(task.queueName).to.equal(assignedTaskDescriptor.queueName);
                expect(task.queueSid).to.equal(assignedTaskDescriptor.queueSid);
                expect(task.timeout).to.equal(assignedTaskDescriptor.timeout);
                expect(task.workflowName).to.equal(assignedTaskDescriptor.workflowName);
                expect(task.workflowSid).to.equal(assignedTaskDescriptor.workflowSid);
                expect(task.workspaceSid).to.equal(assignedTaskDescriptor.workspaceSid);
            });
        });
    });

    describe('#_emitEvent(eventType, payload)', () => {
        it('should emit Event:on(canceled)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), pendingTaskDescriptor);
            assert.equal(task.status, 'reserved');

            task.on('canceled', spy);

            task._emitEvent('canceled', mockEvents.task.canceled);

            assert.isTrue(spy.calledOnce);
            assert.equal(task.age, mockEvents.task.canceled.age);
            assert.deepEqual(task.attributes, JSON.parse(mockEvents.task.canceled.attributes));
            assert.equalDate(task.dateCreated, new Date(mockEvents.task.canceled.date_created * 1000));
            assert.equalDate(task.dateUpdated, new Date(mockEvents.task.canceled.date_updated * 1000));
            assert.equal(task.priority, mockEvents.task.canceled.priority);
            assert.equal(task.reason, mockEvents.task.canceled.reason);
            assert.equal(task.sid, mockEvents.task.canceled.sid);
            assert.equal(task.status, mockEvents.task.canceled.assignment_status);
            assert.equal(task.taskChannelSid, mockEvents.task.canceled.task_channel_sid);
            assert.equal(task.taskChannelUniqueName, mockEvents.task.canceled.task_channel_unique_name);
            assert.equal(task.queueName, mockEvents.task.canceled.queue_name);
            assert.equal(task.queueSid, mockEvents.task.canceled.queue_sid);
            assert.equal(task.timeout, mockEvents.task.canceled.timeout);
            assert.equal(task.workflowName, mockEvents.task.canceled.workflow_name);
            assert.equal(task.workflowSid, mockEvents.task.canceled.workflow_sid);
        });

        it('should emit Event:on(completed)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);
            assert.equal(task.status, 'assigned');

            task.on('completed', spy);

            task._emitEvent('completed', mockEvents.task.completed);

            assert.isTrue(spy.calledOnce);
            assert.equal(task.age, mockEvents.task.completed.age);
            assert.deepEqual(task.attributes, JSON.parse(mockEvents.task.completed.attributes));
            assert.equalDate(task.dateCreated, new Date(mockEvents.task.completed.date_created * 1000));
            assert.equalDate(task.dateUpdated, new Date(mockEvents.task.completed.date_updated * 1000));
            assert.equal(task.priority, mockEvents.task.completed.priority);
            assert.equal(task.reason, mockEvents.task.completed.reason);
            assert.equal(task.sid, mockEvents.task.completed.sid);
            assert.equal(task.status, mockEvents.task.completed.assignment_status);
            assert.equal(task.taskChannelSid, mockEvents.task.completed.task_channel_sid);
            assert.equal(task.taskChannelUniqueName, mockEvents.task.completed.task_channel_unique_name);
            assert.equal(task.queueName, mockEvents.task.completed.queue_name);
            assert.equal(task.queueSid, mockEvents.task.completed.queue_sid);
            assert.equal(task.timeout, mockEvents.task.completed.timeout);
            assert.equal(task.workflowName, mockEvents.task.completed.workflow_name);
            assert.equal(task.workflowSid, mockEvents.task.completed.workflow_sid);
        });

        it('should emit Event:on(updated)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);
            assert.equal(task.status, 'assigned');

            task.on('updated', spy);

            task._emitEvent('updated', mockEvents.task.updated);

            assert.isTrue(spy.calledOnce);
            assert.equal(task.age, mockEvents.task.updated.age);
            assert.deepEqual(task.attributes, JSON.parse(mockEvents.task.updated.attributes));
            assert.equalDate(task.dateCreated, new Date(mockEvents.task.updated.date_created * 1000));
            assert.equalDate(task.dateUpdated, new Date(mockEvents.task.updated.date_updated * 1000));
            assert.equal(task.priority, mockEvents.task.updated.priority);
            assert.equal(task.reason, mockEvents.task.updated.reason);
            assert.equal(task.sid, mockEvents.task.updated.sid);
            assert.equal(task.status, mockEvents.task.updated.assignment_status);
            assert.equal(task.taskChannelSid, mockEvents.task.updated.task_channel_sid);
            assert.equal(task.taskChannelUniqueName, mockEvents.task.updated.task_channel_unique_name);
            assert.equal(task.queueName, mockEvents.task.updated.queue_name);
            assert.equal(task.queueSid, mockEvents.task.updated.queue_sid);
            assert.equal(task.timeout, mockEvents.task.updated.timeout);
            assert.equal(task.workflowName, mockEvents.task.updated.workflow_name);
            assert.equal(task.workflowSid, mockEvents.task.updated.workflow_sid);
        });

        it('should emit Event:on(wrapup)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), assignedTaskDescriptor);
            assert.equal(task.status, 'assigned');

            task.on('wrapup', spy);

            task._emitEvent('wrapup', mockEvents.task.wrappedUp);

            assert.isTrue(spy.calledOnce);
            assert.equal(task.age, mockEvents.task.wrappedUp.age);
            assert.deepEqual(task.attributes, JSON.parse(mockEvents.task.wrappedUp.attributes));
            assert.equalDate(task.dateCreated, new Date(mockEvents.task.wrappedUp.date_created * 1000));
            assert.equalDate(task.dateUpdated, new Date(mockEvents.task.wrappedUp.date_updated * 1000));
            assert.equal(task.priority, mockEvents.task.wrappedUp.priority);
            assert.equal(task.reason, mockEvents.task.wrappedUp.reason);
            assert.equal(task.sid, mockEvents.task.wrappedUp.sid);
            assert.equal(task.status, mockEvents.task.wrappedUp.assignment_status);
            assert.equal(task.taskChannelSid, mockEvents.task.wrappedUp.task_channel_sid);
            assert.equal(task.taskChannelUniqueName, mockEvents.task.wrappedUp.task_channel_unique_name);
            assert.equal(task.queueName, mockEvents.task.wrappedUp.queue_name);
            assert.equal(task.queueSid, mockEvents.task.wrappedUp.queue_sid);
            assert.equal(task.timeout, mockEvents.task.wrappedUp.timeout);
            assert.equal(task.workflowName, mockEvents.task.wrappedUp.workflow_name);
            assert.equal(task.workflowSid, mockEvents.task.wrappedUp.workflow_sid);
        });
    });
});
