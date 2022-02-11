/* eslint-disable no-undefined */
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');

import { assignedReservationInstance, pendingReservationInstance } from '../../mock/Reservations';
import { API_V1, API_V2, TASK_STATUS_COMPLETED, TASK_STATUS_WRAPPING } from '../../../lib/util/Constants';
import Configuration from '../../../lib/util/Configuration';
const Errors = require('../../../lib/util/Constants').twilioErrors;
const mockEvents = require('../../mock/Events').events;
import OutgoingTransfer from '../../../lib/core/transfer/OutgoingTransfer';
import Request from '../../../lib/util/Request';
import Task from '../../../lib/Task';
import { taskCompleted, taskWrapping, updatedTaskAttributes, updatedTaskAttributesForOutbound, taskHoldUnhold } from '../../mock/Responses';
import TaskDescriptor from '../../../lib/descriptors/TaskDescriptor';
import { token } from '../../mock/Token';
import Worker from '../../../lib/Worker';
import { WorkerConfig } from '../../mock/WorkerConfig';
import Routes from '../../../lib/util/Routes';
import Transfers from '../../../lib/core/transfer/Transfers';
import TransferDescriptor from '../../../lib/descriptors/TransferDescriptor';

describe('Task', () => {
    const config = new Configuration(token);
    const worker = new Worker(token, WorkerConfig);
    const routes = new Routes('WSxxx', 'WKxxx');
    sinon.stub(worker, 'getRoutes').returns(routes);

    const reservationSid = assignedReservationInstance.sid;
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
                new Task(worker, new Request(config));
            }).should.throw(/descriptor is a required parameter/);
        });

        it('should set Task properties', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            assert.equal(task.age, assignedTaskData.age);
            assert.deepEqual(task.attributes, JSON.parse(assignedTaskData.attributes));
            assert.equalDate(task.dateCreated, new Date(assignedTaskData.date_created * 1000));
            assert.equalDate(task.dateUpdated, new Date(assignedTaskData.date_updated * 1000));
            assert.equal(task.priority, assignedTaskData.priority);
            assert.equal(task.reason, assignedTaskData.reason);
            assert.equal(task.reservationSid, assignedReservationInstance.sid);
            assert.equal(task.sid, assignedTaskData.sid);
            assert.equal(task.status, assignedTaskData.assignment_status);
            assert.equal(task.taskChannelSid, assignedTaskData.task_channel_sid);
            assert.equal(task.taskChannelUniqueName, assignedTaskData.task_channel_unique_name);
            assert.equal(task.queueName, assignedTaskData.queue_name);
            assert.equal(task.queueSid, assignedTaskData.queue_sid);
            assert.equal(task.timeout, assignedTaskData.timeout);
            assert.equal(task.workflowName, assignedTaskData.workflow_name);
            assert.equal(task.workflowSid, assignedTaskData.workflow_sid);
            assert.isNull(task.routingTarget);
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
                const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
                task.complete();
            }).should.throw(/reason is a required parameter/);
        });

        it('should set attributes of the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(taskCompleted));
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

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
                expect(task.routingTarget).to.equal(null);
            });
        });

        it('should return an error if unable to complete the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            return task.complete('Task is completed.').catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
                expect(task.reason).to.not.equal('Task is completed.');
            });
        });

        it('should not change any Task properties if unable to complete the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

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
                expect(task.routingTarget).to.equal(null);
            });
        });

        it('should pass the object version to API request', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const version = task.version;

            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
            stub.returns(Promise.resolve(taskCompleted));

            return task.complete('Task is completed.').then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, version);
            });
        });


        it('should update the object version', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const version = task.version;

            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
            stub.returns(Promise.resolve(taskCompleted));

            return task.complete('Task is completed.').then((updatedTask) => {
                expect(task.version).to.equal(updatedTask.version);
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

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

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
                expect(task.routingTarget).to.equal(null);
            });
        });

        it('should return an error if unable to wrap the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            return task.wrapUp({ reason: 'Task is wrapping.' }).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
                expect(task.reason).to.not.equal('Task is wrapping.');
            });
        });

        it('should not change any Task properties if unable to wrap the Task', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

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
                expect(task.routingTarget).to.equal(null);
            });
        });

        it('should pass the object version to API request', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const version = task.version;

            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
            stub.returns(Promise.resolve(taskWrapping));

            return task.wrapUp({ reason: 'Task is wrapping.' }).then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, version);
            });
        });

        it('should update the object version', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const version = task.version;

            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
            stub.returns(Promise.resolve(taskWrapping));

            return task.wrapUp({ reason: 'Task is wrapping.' }).then((updatedTask) => {
                expect(task.version).to.equal(updatedTask.version);
            });
        });
    });

    describe('#setAttributes(attributes)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Tasks/WTxx1';
        const requestParams = {
            Attributes: {
                languages: ['en']
            },
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should update the Task attributes upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(updatedTaskAttributes));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

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
                expect(task.routingTarget).to.equal(null);
            });
        });

        it('should update the Outbound Task attributes upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(updatedTaskAttributesForOutbound));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            return task.setAttributes({ languages: ['en'] }).then(() => {
                expect(task.reason).to.equal(updatedTaskAttributesForOutbound.reason);
                expect(task.workflowSid).to.equal(updatedTaskAttributesForOutbound.workflow_sid);
                expect(task.workflowName).to.equal(updatedTaskAttributesForOutbound.workflow_name);
                expect(task.queueSid).to.equal(updatedTaskAttributesForOutbound.queue_sid);
                expect(task.queueName).to.equal(updatedTaskAttributesForOutbound.queue_name);
                expect(task.taskChannelSid).to.equal(updatedTaskAttributesForOutbound.task_channel_sid);
                expect(task.taskChannelUniqueName).to.equal(updatedTaskAttributesForOutbound.task_channel_unique_name);
                expect(task.status).to.equal(updatedTaskAttributesForOutbound.assignment_status);
                expect(task.attributes).to.deep.equal(JSON.parse(updatedTaskAttributesForOutbound.attributes));
                expect(task.age).to.equal(updatedTaskAttributesForOutbound.age);
                expect(task.priority).to.equal(updatedTaskAttributesForOutbound.priority);
                expect(task.timeout).to.equal(updatedTaskAttributesForOutbound.timeout);
                expect(task.dateCreated).to.equalDate(new Date(updatedTaskAttributesForOutbound.date_created * 1000));
                expect(task.dateUpdated).to.equalDate(new Date(updatedTaskAttributesForOutbound.date_updated * 1000));
                expect(task.routingTarget).to.equal(updatedTaskAttributesForOutbound.routing_target);
            });
        });

        it('should throw an error if attributes parameter is missing', () => {
            (() => {
                const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

                task.setAttributes();
            }).should.throw(/attributes is a required parameter/);
        });

        it('should not update the attributes, if none provided', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            (() => {
                task.setAttributes();
            }).should.throw(/attributes is a required parameter/);
            assert.deepEqual(task.attributes, assignedTaskDescriptor.attributes);
        });

        it('should return an error if attributes update failed', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            return task.setAttributes({ languages: ['en'] }).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });

        it('should not update any unrelated Task properties', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

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
                expect(task.routingTarget).to.equal(null);
            });
        });

        it('should pass the object version to API request', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const version = task.version;

            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
            stub.returns(Promise.resolve(updatedTaskAttributes));

            return task.setAttributes({ languages: ['en'] }).then(() => {
                expect(stub).have.been.calledWith(requestURL, requestParams, API_V1, version);
            });
        });

        it('should update the object version', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const version = task.version;

            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1, version);
            stub.returns(Promise.resolve(updatedTaskAttributes));

            return task.setAttributes({ languages: ['en'] }).then((updatedTask) => {
                expect(task.version).to.equal(updatedTask.version);
            });
        });
    });

    describe('#updateParticipant(options)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/CustomerParticipant';
        const requestParams = {
            Hold: false,
            TaskSid: 'WTxx1'
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return an error if the optional params fail type check', () => {
            (() => {
                const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
                task.updateParticipant({ hold: 'true' });
            }).should.throw(/hold does not meet the required type/);
        });

        it('should return an error if the optional holdUrl param fails type check', () => {
            (() => {
                const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
                task.updateParticipant({ hold: true, holdUrl: 3 });
            }).should.throw(/holdUrl does not meet the required type/);
        });

        it('should return an error if the optional holdMethod param fails type check', () => {
            (() => {
                const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
                task.updateParticipant({ hold: true, holdUrl: 'https://api.twilio.com/cowbell.mp3', holdMethod: 200 });
            }).should.throw(/holdMethod does not meet the required type/);
        });

        it('should place a hold/unhold request on the Task upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.resolve(taskHoldUnhold));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            return task.updateParticipant({ hold: false }).then(() => {
                expect(task.sid).to.equal(taskHoldUnhold.sid);
            });
        });

        it('should return an error if hold/unhold failed', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            return task.updateParticipant({ hold: false }).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });

        it('should update the object version', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2);
            stub.returns(Promise.resolve(taskHoldUnhold));

            return task.updateParticipant({ hold: false }).then((updatedTask) => {
                expect(task.version).to.equal(updatedTask.version);
            });
        });
    });

    describe('#hold(targetWorkerSid, onHold, options)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/HoldWorkerParticipant';
        const requestParams = {
            TaskSid: 'WTxx1',
            TargetWorkerSid: 'WKxxB',
            Hold: true
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return an error if the parameters fail type check', () => {
            (() => {
                const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);
                task.hold(null, false);
            }).should.throw('Error calling method hold(). <string>targetWorkerSid is a required parameter.');
        });

        it('should return an error if the holdUrl parameter fails type check', () => {
            (() => {
                const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);
                task.hold('WTxx1', true, { holdUrl: 3 });
            }).should.throw(/holdUrl does not meet the required type/);
        });

        it('should return an error if the holdMethod parameter fails type check', () => {
            (() => {
                const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);
                task.hold('WTxx1', true, { holdUrl: 'https://api.twilio.com/cowbell.mp3', holdMethod: 200 });
            }).should.throw(/holdMethod does not meet the required type/);
        });

        it('should place a hold/unhold request on the Task upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.resolve(taskHoldUnhold));

            const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);

            return task.hold('WKxxB', true).then(() => {
                expect(task.sid).to.equal(taskHoldUnhold.sid);
            });
        });

        it('should update the object version', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2);
            stub.returns(Promise.resolve(taskHoldUnhold));

            return task.hold('WKxxB', true).then((updatedTask) => {
                expect(task.version).to.equal(updatedTask.version);
            });
        });

        it('should return an error if hold/unhold failed', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);

            return task.hold('WKxxB', true).catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });
    });

    describe('#transfer(to, options)', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Tasks/WTxx1/Transfers';
        const requestParams = {
            Attributes: {
                languages: ['en']
            },
            Mode: 'cold',
            Priority: 'undefined',
            ReservationSid: reservationSid,
            To: 'alice',
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should send the correct POST', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve());
            sandbox.stub(Transfers.prototype, '_updateOutgoing').returns(Promise.resolve());

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

            return task.transfer('alice', {
                attributes: {
                    languages: ['en']
                },
                mode: 'cold',
                foo: 'bar',
            });
        });
    });

    describe('#kick(workerSid)', () => {
        let sandbox;

        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx/KickWorkerParticipant';
        const requestParams = {
            TaskSid: 'WTxx1',
            TargetWorkerSid: 'WKxx2'
        };

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return an error if the target worker sid to kick is not provided', () => {
            (() => {
                const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);
                task.kick();
            }).should.throw(/<string>workerSid is a required parameter/);
        });

        it('should place a kick request on the Task upon successful execution', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.resolve(taskHoldUnhold));

            const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);

            return task.kick('WKxx2').then(() => {
                expect(task.sid).to.equal(taskHoldUnhold.sid);
            });
        });

        it('should update the object version', () => {
            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            const stub = sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2);
            stub.returns(Promise.resolve(taskHoldUnhold));

            return task.kick('WKxx2').then((updatedTask) => {
                expect(task.version).to.equal(updatedTask.version);
            });
        });

        it('should return an error if hold/unhold failed', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V2).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const task = new Task(worker, new Request(config), 'WR123', assignedTaskDescriptor);

            return task.kick('WKxx2').catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');
            });
        });
    });

    describe('#_emitEvent(eventType, payload)', () => {
        it('should emit Event:on(canceled)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), reservationSid, pendingTaskDescriptor);
            assert.equal(task.status, 'reserved');

            task.on('canceled', spy);

            task._emitEvent('canceled', mockEvents.task.canceled);

            assert.isTrue(spy.calledOnce);
        });

        it('should emit Event:on(completed)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            assert.equal(task.status, 'assigned');

            task.on('completed', spy);

            task._emitEvent('completed', mockEvents.task.completed);

            assert.isTrue(spy.calledOnce);
        });

        it('should emit Event:on(updated)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            assert.equal(task.status, 'assigned');

            task.on('updated', spy);

            task._emitEvent('updated', mockEvents.task.updated);

            assert.isTrue(spy.calledOnce);
        });

        it('should emit Event:on(wrapup)', () => {
            const spy = sinon.spy();

            const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);
            assert.equal(task.status, 'assigned');

            task.on('wrapup', spy);

            task._emitEvent('wrapup', mockEvents.task.wrappedUp);

            assert.isTrue(spy.calledOnce);
        });
    });

    describe('_emitEventForOutgoingTransfer() for transfers', () => {
        let spy;
        const task = new Task(worker, new Request(config), reservationSid, assignedTaskDescriptor);

        beforeEach(() => {
            spy = sinon.spy();
            task.transfers.outgoing = new OutgoingTransfer(worker, new Request(config), assignedTaskDescriptor.sid, new TransferDescriptor(mockEvents.task.transferInitiated));
        });

        // transfer events (for transfers initiated by the worker)
        it('should emit Event:on(transferInitiated)', () => {
            task.on('transferInitiated', spy);
            task._emitEventForOutgoingTransfer('transfer-initiated', mockEvents.task.transferInitiated);
            assert.equal(task.transfers.outgoing.status, 'initiated');
            assert.isTrue(spy.calledOnce);
        });

        it('should not emit Event:on(transferInitiated) if the outgoing transfer is null', () => {
            task.transfers.outgoing = null;
            task.on('transferInitiated', spy);
            task._emitEventForOutgoingTransfer('transfer-initiated', mockEvents.task.transferInitiated);
            assert.isFalse(spy.called);
            assert.isNull(task.transfers.outgoing);
        });

        it('should not emit Event:on(transferInitiated) if the outgoing transfer has mismatched sids', () => {
            task.transfers.outgoing.sid = 'TTxx2';
            task.on('transferInitiated', spy);
            task._emitEventForOutgoingTransfer('transfer-initiated', mockEvents.task.transferInitiated);
            assert.isFalse(spy.called);
        });

        it('should only emit events for transferInitiated on the Task', () => {
            task.transfers.outgoing.sid = 'TTxx2';
            task.on('transferFailed', spy);
            task._emitEventForOutgoingTransfer('transfer-failed', mockEvents.task.transferFailed);
            assert.isFalse(spy.called);
        });
    });
});
