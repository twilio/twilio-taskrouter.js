import EnvTwilio from '../../util/EnvTwilio';
import { Workspace } from '../../../lib';
import TaskQueue from '../../../lib/TaskQueue';
import WorkerContainer from '../../../lib/WorkerContainer';
import { buildRegionForEventBridge } from '../../integration_test_setup/IntegrationTestSetupUtils';

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
chai.should();
const assert = chai.assert;
const expect = chai.expect;
const credentials = require('../../env');
const JWT = require('../../util/MakeAccessToken');

describe('Workspace', () => {
    const envTwilio = new EnvTwilio(credentials.accountSid, credentials.authToken, credentials.region);
    // eslint-disable-next-line no-undefined
    const adminToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, undefined, 300, 'admin');
    let workspace;
    const options =  {
        region: buildRegionForEventBridge(credentials.region),
        edge: credentials.edge,
        logLevel: 'error'
    };

    beforeEach(() => {
        workspace = new Workspace(adminToken, options);
    });

    describe('#fetchTaskQueues', () => {
        let taskQueueSids = [];

        const createTaskQueues = async(friendlyNames = []) => {
            const taskQueueSids = [];
            for (const name of friendlyNames) {
                const queue = await envTwilio.createTaskQueue(workspace.workspaceSid, { friendlyName: name });
                taskQueueSids.push(queue.sid);
            }

            return taskQueueSids;
        };

        const deleteTaskQueues = async(friendlyNames = []) => {
            for (const friendlyName of friendlyNames) {
                await envTwilio.deleteTaskQueueByName(workspace.workspaceSid, friendlyName);
            }
        };

        before(async() => {
            workspace = new Workspace(adminToken, options);
            await deleteTaskQueues(['test', 'test1']);
            taskQueueSids = await createTaskQueues(['test', 'test1']);
        });

        after(async() => {
            await deleteTaskQueues(['test', 'test1']);
        });

        it('should fetch task queues by FriendlyName', async() => {
            const queues = await workspace.fetchTaskQueues({ FriendlyName: 'test' });
            assert.equal(queues.size, 1);
            assert.equal(queues.get(taskQueueSids[0]).name, 'test');
        }).timeout(5000);

        it('should not fetch task queues by invalid FriendlyName', async() => {
            const workers = await workspace.fetchTaskQueues({ FriendlyName: 'aaa' });

            assert.equal(workers.size, 0);
        }).timeout(5000);

        it('should fetch task queues with AfterSid', async() => {
            const queues = await workspace.fetchTaskQueues({ AfterSid: taskQueueSids[0] });

            assert.equal(queues.size, 1);
            assert.isDefined(queues.get(taskQueueSids[1]));
        }).timeout(5000);

        it('should return 400 error if invalid AfterSid provided', async() => {
            const queuesPromise = workspace.fetchTaskQueues({ AfterSid: 'WK0000000000000000000000000000000000' });

            await expect(queuesPromise).to.be.rejectedWith('Request failed with status code 400');
        }).timeout(5000);

        it('should fetch task queue with Sid', async() => {
            const taskQueueSid = taskQueueSids[0];
            const queue = await workspace.fetchTaskQueue(taskQueueSid);

            assert.instanceOf(queue, TaskQueue);
            assert.equal(queue.sid, taskQueueSid);
        }).timeout(5000);

        it('should return 404 error if invalid Sid provided', async() => {
            const queuePromise = workspace.fetchTaskQueue('WQ0000000000000000000000000000000000');

            await expect(queuePromise).to.be.rejectedWith('Request failed with status code 404');
        }).timeout(5000);

        it('should order task queues by DateUpdated desc', async() => {
            const queuesMap = await workspace.fetchTaskQueues({ Ordering: 'DateUpdated:desc' });
            const queues = Array.from(queuesMap.values());
            for (let i = 0; i < queues.length - 1; i++ ) {
                const queue = queues[i];
                const nextQueue = queues[i + 1];
                expect(queue.dateUpdated).to.be.gte(nextQueue.dateUpdated);
            }
        }).timeout(5000);

        it('should order task queues by DateUpdated asc', async() => {
            const queuesMap = await workspace.fetchTaskQueues({ Ordering: 'DateUpdated:asc' });
            const queues = Array.from(queuesMap.values());
            for (let i = 0; i < queues.length - 1; i++ ) {
                const queue = queues[i];
                const nextQueue = queues[i + 1];
                expect(queue.dateUpdated).to.be.lte(nextQueue.dateUpdated);

            }
        }).timeout(5000);

        it('should paginate with ordering param', async() => {
            workspace = new Workspace(adminToken, { ...options, pageSize: 1 });
            const queuesMap = await workspace.fetchTaskQueues({ Ordering: 'DateUpdated:asc' });
            assert.equal(queuesMap.size, 3);
            const queues = Array.from(queuesMap.values());

            for (let i = 0; i < queues.length - 1; i++ ) {
                const queue = queues[i];
                const nextQueue = queues[i + 1];
                expect(queue.dateUpdated).to.be.lte(nextQueue.dateUpdated);
            }
        }).timeout(5000);

        it('should paginate without params', async() => {
            workspace = new Workspace(adminToken, { ...options, pageSize: 1 });
            const queuesMap = await workspace.fetchTaskQueues();
            assert.equal(queuesMap.size, 3);
        }).timeout(5000);
    });


    describe('#fetchWorkers', () => {
        it('should fetch workers without parameters provided', async() => {
            const workers = await workspace.fetchWorkers();

            assert.equal(workers.size, 2);
        }).timeout(5000);

        it('should fetch max workers', async() => {
            const maxWorkers = 1;
            const workspace = new Workspace(adminToken, { ...options, pageSize: 2 });

            const allWorkers = await workspace.fetchWorkers();
            const partOfWorkers = await workspace.fetchWorkers({ MaxWorkers: maxWorkers });

            assert.equal(partOfWorkers.size, maxWorkers);
            assert.isTrue(partOfWorkers.size < allWorkers.size, 'All workers were returned.');
        }).timeout(5000);

        it('should fetch workers by FriendlyName', async() => {
            const workers = await workspace.fetchWorkers({ FriendlyName: 'Bob' });

            assert.equal(workers.size, 1);
            assert.equal(workers.get(credentials.multiTaskBobSid).friendlyName, 'Bob');
        }).timeout(5000);

        it('should fetch workers by ActivitySid', async() => {
            const workers = await workspace.fetchWorkers();
            const alice = workers.get(credentials.multiTaskAliceSid);

            const workersWithAliceActivity = await workspace.fetchWorkers({
                ActivitySid: alice.activitySid
            });

            assert.equal(workersWithAliceActivity.size, 2);
            assert.isDefined(workersWithAliceActivity.get(credentials.multiTaskAliceSid));
            assert.isDefined(workersWithAliceActivity.get(credentials.multiTaskBobSid));
        }).timeout(5000);

        it('should return 400 error if invalid ActivitySid provided', async() => {
            const workersPromise = workspace.fetchWorkers({
                ActivitySid: 'WAxxx',
            });

            await expect(workersPromise).to.be.rejectedWith(
                'Request failed with status code 400'
            );
        }).timeout(5000);

        it('should fetch workers by ActivityName', async() => {
            const workers = await workspace.fetchWorkers();
            const alice = workers.get(credentials.multiTaskAliceSid);

            const workersWithAliceActivity = await workspace.fetchWorkers({
                ActivityName: alice.activityName
            });

            assert.equal(workersWithAliceActivity.size, 2);
            assert.isDefined(workersWithAliceActivity.get(credentials.multiTaskAliceSid));
            assert.isDefined(workersWithAliceActivity.get(credentials.multiTaskBobSid));
        }).timeout(5000);

        it('should not fetch workers by invalid ActivityName', async() => {
            const workers = await workspace.fetchWorkers({ ActivityName: 'I' });

            assert.equal(workers.size, 0);
        }).timeout(5000);

        it('should fetch workers by TargetWorkersExpression', async() => {
            const workers = await workspace.fetchWorkers({ TargetWorkersExpression: `sid IN ['${credentials.multiTaskBobSid}']` });

            assert.equal(workers.size, 1);
            assert.isNotNull(workers.get(credentials.multiTaskBobSid));
        }).timeout(5000);

        it('should not fetch workers by invalid FriendlyName', async() => {
            const workers = await workspace.fetchWorkers({ FriendlyName: 'Alex' });

            assert.equal(workers.size, 0);
        }).timeout(5000);

        it('should fetch workers with AfterSid', async() => {
            const workers = await workspace.fetchWorkers({ AfterSid: credentials.multiTaskAliceSid });

            assert.equal(workers.size, 1);
            assert.isDefined(workers.get(credentials.multiTaskBobSid));
        }).timeout(5000);

        it('should return 400 error if invalid AfterSid provided', async() => {
            const workersPromise = workspace.fetchWorkers({ AfterSid: 'WK0000000000000000000000000000000000' });

            await expect(workersPromise).to.be.rejectedWith('Request failed with status code 400');
        }).timeout(5000);

        it('should fetch worker with Sid', async() => {
            let workerSid = credentials.multiTaskBobSid;
            const worker = await workspace.fetchWorker(workerSid);

            assert.instanceOf(worker, WorkerContainer);
            assert.equal(worker.sid, workerSid);
        }).timeout(5000);

        it('should return 404 error if invalid Sid provided', async() => {
            const workerPromise = workspace.fetchWorker('WQ0000000000000000000000000000000000');

            await expect(workerPromise).to.be.rejectedWith('Request failed with status code 404');
        }).timeout(5000);

        it('should order workers by DateStatusChanged desc', async() => {
            const workersMap = await workspace.fetchWorkers({ Ordering: 'DateStatusChanged:desc' });
            const workers = Array.from(workersMap.values());
            for (let i = 0; i < workers.length - 1; i++ ) {
                const worker = workers[i];
                const nextWorker = workers[i + 1];
                expect(worker.dateStatusChanged).to.be.gte(nextWorker.dateStatusChanged);
            }
        }).timeout(5000);


        it('should order workers by DateStatusChanged asc', async() => {
            const workersMap = await workspace.fetchWorkers({ Ordering: 'DateStatusChanged:asc' });
            const workers = Array.from(workersMap.values());
            for (let i = 0; i < workers.length - 1; i++ ) {
                const worker = workers[i];
                const nextWorker = workers[i + 1];
                expect(worker.dateStatusChanged).to.be.lte(nextWorker.dateStatusChanged);

            }
        }).timeout(5000);

        it('should paginate with ordering param', async() => {
            workspace = new Workspace(adminToken, { ...options, pageSize: 1 });
            const workersMap = await workspace.fetchWorkers({ Ordering: 'DateStatusChanged:asc' });
            assert.equal(workersMap.size, 2);
            const workers = Array.from(workersMap.values());

            for (let i = 0; i < workers.length - 1; i++ ) {
                const worker = workers[i];
                const nextWorker = workers[i + 1];
                expect(worker.dateStatusChanged).to.be.lte(nextWorker.dateStatusChanged);

            }
        }).timeout(5000);

        it('should paginate without params', async() => {
            workspace = new Workspace(adminToken, { ...options, pageSize: 1 });
            const workersMap = await workspace.fetchWorkers();
            assert.equal(workersMap.size, 2);
        }).timeout(5000);
    });
});
