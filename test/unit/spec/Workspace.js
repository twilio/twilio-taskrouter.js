/* eslint no-unused-expressions: 0 */

import { Workspace } from '../../../lib';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');
import { API_V1 } from '../../../lib/util/Constants';
import { taskQueueList, taskQueuesPage0, taskQueuesPage1, workerList, workerListPage0, workerListPage1, workerList2Page0, workerList2Page1 } from '../../mock/Workspace';
import { adminToken, token, updatedAdminToken } from '../../mock/Token';
import Request from '../../../lib/util/Request';
import path from 'path';
import TaskQueue from '../../../lib/TaskQueue';
import WorkerContainer from '../../../lib/WorkerContainer';
import Configuration from '../../../lib/util/Configuration';

describe('Workspace', () => {

    describe('constructor', () => {
        it('should initialize with any role', async() => {
            expect(() => new Workspace(token)).to.not.throw();
            expect(() => new Workspace(adminToken)).to.not.throw();
        });

        it('should initialize with non-decodable token and workspaceSid', async() => {
            expect(() => new Workspace('aaa', {}, 'sid')).to.not.throw();
        });

        it('should throw if workspaceSid not obtained from token or argument', async() => {
            expect(() => new Workspace('aa')).to.throw();
        });
    });

    describe('#fetchTaskQueues', () => {
        const requestURL = 'Workspaces/WSxxx/TaskQueues';

        let sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should fetch task queues', () => {
            const workspace = new Workspace(adminToken);
            const requestParams = { PageSize: 1000 };
            sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V1, requestParams).returns(Promise.resolve(taskQueueList));

            return workspace.fetchTaskQueues().then(queues => {
                expect(queues.size).to.equal(taskQueueList.contents.length);

                let index = 0;
                queues.forEach((taskQueue) => {
                    const queueObject = taskQueueList.contents[index];
                    expect(taskQueue.accountSid).to.equal(queueObject.account_sid);
                    expect(taskQueue.workspaceSid).to.equal(queueObject.workspace_sid);
                    expect(taskQueue.sid).to.equal(queueObject.sid);
                    expect(taskQueue.queueSid).to.equal(queueObject.sid);
                    expect(taskQueue.dateCreated).to.equalDate(new Date(queueObject.date_created * 1000));
                    expect(taskQueue.dateUpdated).to.equalDate(new Date(queueObject.date_updated * 1000));
                    expect(taskQueue.name).to.equal(queueObject.friendly_name);
                    expect(taskQueue.queueName).to.equal(queueObject.friendly_name);
                    expect(taskQueue.assignmentActivityName).to.equal(queueObject.assignment_activity_name);
                    expect(taskQueue.reservationActivityName).to.equal(queueObject.reservation_activity_name);
                    expect(taskQueue.assignmentActivitySid).to.equal(queueObject.assignment_activity_sid);
                    expect(taskQueue.reservationActivitySid).to.equal(queueObject.reservation_activity_sid);
                    expect(taskQueue.targetWorkers).to.equal(queueObject.target_workers);
                    expect(taskQueue.maxReservedWorkers).to.equal(queueObject.max_reserved_workers);
                    expect(taskQueue.taskOrder).to.equal(queueObject.task_order);
                    index++;
                });
            });
        });

        it('should fetch task queues with args', () => {
            const workspace = new Workspace(adminToken);
            const requestParams = { 'PageSize': 1000, 'FriendlyName': 'test', 'Ordering': 'DateUpdated:asc' };
            const stub = sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V1, requestParams).returns(Promise.resolve(taskQueueList));

            return workspace.fetchTaskQueues(requestParams).then(queues => {
                expect(queues.size).to.equal(taskQueueList.contents.length);
                expect(stub.withArgs(requestURL, API_V1, requestParams).calledOnce).to.be.true;
            });
        });

        it('should fetch task queue with sid', () => {
            const workspace = new Workspace(adminToken);
            const taskQueueInstance = taskQueueList.contents[0];
            const url = path.join(requestURL, taskQueueInstance.sid);
            const stub = sandbox.stub(Request.prototype, 'get').withArgs(url, API_V1).returns(Promise.resolve(taskQueueInstance));

            return workspace.fetchTaskQueue(taskQueueInstance.sid).then(queue => {
                expect(queue.sid).to.equal(taskQueueInstance.sid);
                expect(queue).to.be.instanceOf(TaskQueue);
                expect(stub.withArgs(url, API_V1).calledOnce).to.be.true;
            });
        });


        it('should paginate for the next page if needed', () => {
            const requestParamsPage0 = { 'PageSize': 2, 'FriendlyName': 'test' };
            const requestParamsPage1 = { 'PageSize': 2, 'AfterSid': 'WQxx2', 'FriendlyName': 'test' };

            const stub = sandbox.stub(Request.prototype, 'get');
            stub.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(taskQueuesPage0));
            stub.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(taskQueuesPage1));
            const workspace = new Workspace(adminToken, { pageSize: 2 });

            return workspace.fetchTaskQueues(requestParamsPage0).then((queues) => {
                expect(queues.size).to.equal(taskQueuesPage0.total);
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage0).calledOnce).to.be.true;
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage1).calledOnce).to.be.true;
            });
        });

        it('should paginate with ordering parameter', () => {
            const requestParamsPage0 = { 'PageSize': 2, 'FriendlyName': 'test', 'Ordering': 'DateUpdated:asc' };
            const requestParamsPage1 = { 'PageSize': 2, 'NextToken': 'TQxx1/2022-08-09T19:09:10.763Z', 'FriendlyName': 'test', 'Ordering': 'DateUpdated:asc' };

            const stub = sandbox.stub(Request.prototype, 'get');
            stub.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(taskQueuesPage0));
            stub.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(taskQueuesPage1));
            const workspace = new Workspace(adminToken, { pageSize: 2 });

            return workspace.fetchTaskQueues(requestParamsPage0).then((queues) => {
                expect(queues.size).to.equal(taskQueuesPage0.total);
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage0).calledOnce).to.be.true;
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage1).calledOnce).to.be.true;
            });
        });
    });

    describe('#fetchWorkers', () => {
        const requestURL = 'Workspaces/WSxxx/Workers';

        let sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());

        it('should fetch workers', () => {
            const workspace = new Workspace(adminToken);
            const requestParams = { PageSize: 1000 };
            const stub = sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V1, requestParams).returns(Promise.resolve(workerList));

            return workspace.fetchWorkers().then(workers => {
                expect(stub.withArgs(requestURL, API_V1, requestParams).calledOnce).to.be.true;
                expect(workers.size).to.equal(workerList.contents.length);
            });
        });

        it('should fetch workers with args', () => {
            const workspace = new Workspace(adminToken);
            const requestParams = { 'PageSize': 1000, 'FriendlyName': 'test', 'ActivitySid': 'WAxxx', 'ActivityName': 'Idle', 'Ordering': 'DateUpdated:asc', 'TargetWorkersExpression': 'name IN [\'Alice\']' };
            const stub = sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V1, requestParams).returns(Promise.resolve(workerList));

            return workspace.fetchWorkers(requestParams).then(workers => {
                expect(workers.size).to.equal(workerList.contents.length);
                expect(stub.withArgs(requestURL, API_V1, requestParams).calledOnce).to.be.true;
            });
        });

        it('should paginate for the next page if needed', () => {
            const requestParamsPage0 = { 'PageSize': 1, 'FriendlyName': 'test' };
            const requestParamsPage1 = { 'PageSize': 1, 'AfterSid': 'WKxx1', 'FriendlyName': 'test' };

            const stub = sandbox.stub(Request.prototype, 'get');
            stub.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(workerListPage0));
            stub.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(workerListPage1));
            const workspace = new Workspace(adminToken, { pageSize: 1 });

            return workspace.fetchWorkers(requestParamsPage0).then((workers) => {
                expect(workers.size).to.equal(workerListPage0.total);
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage0).calledOnce).to.be.true;
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage1).calledOnce).to.be.true;
            });
        });

        it('should paginate with ordering parameter', () => {
            const requestParamsPage0 = { 'PageSize': 1, 'FriendlyName': 'test', 'Ordering': 'DateUpdated:asc' };
            const requestParamsPage1 = { 'PageSize': 1, 'NextToken': 'WKxx1/2022-08-09T19:09:10.763Z', 'FriendlyName': 'test', 'Ordering': 'DateUpdated:asc' };

            const stub = sandbox.stub(Request.prototype, 'get');
            stub.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(workerListPage0));
            stub.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(workerListPage1));
            const workspace = new Workspace(adminToken, { pageSize: 1 });

            return workspace.fetchWorkers(requestParamsPage0).then((workers) => {
                expect(workers.size).to.equal(workerListPage0.total);
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage0).calledOnce).to.be.true;
                expect(stub.withArgs(requestURL, API_V1, requestParamsPage1).calledOnce).to.be.true;
            });
        });

        it('should fetch max workers', async() => {
            const requestParamsPage0 = { 'PageSize': 1 };
            const requestParamsPage1 = { 'PageSize': 1, 'AfterSid': 'WKxx1' };

            const stub = sandbox.stub(Request.prototype, 'get');
            stub.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(workerListPage0));
            stub.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(workerListPage1));
            const workspace = new Workspace(adminToken, { pageSize: 1 });
            const maxWorkers = 1;

            const partOfWorkers = await workspace.fetchWorkers({ MaxWorkers: maxWorkers });

            expect(stub.withArgs(requestURL, API_V1, requestParamsPage0).calledOnce).to.be.true;
            expect(stub.withArgs(requestURL, API_V1, requestParamsPage1).calledOnce).to.be.false;

            const allWorkers = await workspace.fetchWorkers();

            expect(partOfWorkers.size).to.equal(maxWorkers);
            expect(partOfWorkers.size).to.be.lessThan(allWorkers.size);
        });

        it('should fetch max workers and split the page if needed', async() => {
            const requestParamsPage0 = { 'PageSize': 2 };
            const requestParamsPage1 = { 'PageSize': 2, 'AfterSid': 'Wkxx2' };

            const stub = sandbox.stub(Request.prototype, 'get');
            stub.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(workerList2Page0));
            stub.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(workerList2Page1));
            const workspace = new Workspace(adminToken, { pageSize: 2 });
            const maxWorkers = 1;

            const partOfWorkers = await workspace.fetchWorkers({ MaxWorkers: maxWorkers });

            expect(stub.withArgs(requestURL, API_V1, requestParamsPage0).calledOnce).to.be.true;
            expect(stub.withArgs(requestURL, API_V1, requestParamsPage1).calledOnce).to.be.false;

            const allWorkers = await workspace.fetchWorkers();

            expect(partOfWorkers.size).to.equal(maxWorkers);
            expect(partOfWorkers.size).to.be.lessThan(allWorkers.size);
        });

        it('should fetch worker with sid', () => {
            const workspace = new Workspace(adminToken);
            const workerInstance = workerList.contents[0];
            const url = path.join(requestURL, workerInstance.sid);
            const stub = sandbox.stub(Request.prototype, 'get').withArgs(url, API_V1).returns(Promise.resolve(workerInstance));

            return workspace.fetchWorker(workerInstance.sid).then(queue => {
                expect(queue.sid).to.equal(workerInstance.sid);
                expect(queue).to.be.instanceOf(WorkerContainer);
                expect(stub.withArgs(url, API_V1).calledOnce).to.be.true;
            });
        });

    });


    describe('#updateToken', () => {

        let configSpy;

        beforeEach(() => {
            configSpy = sinon.spy(Configuration.prototype, 'updateToken');
        });

        afterEach(() => {
            configSpy.restore();
        });

        it('should update token',  () =>  {
            const workspace = new Workspace(adminToken);
            workspace.updateToken(updatedAdminToken);

            expect(configSpy.withArgs(updatedAdminToken).calledOnce).to.be.true;
        });

        it('should throw error if new Token is not provided',  () => {
            const workspace = new Workspace(adminToken);
            (() => {
                workspace.updateToken();
            }).should.throw(/newToken is a required parameter/);
        });
    });
});
