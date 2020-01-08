import { API_V1 } from '../../../../lib/util/Constants';
import { list as mockList, offlineActivityInstance as mockInstance, activitiesPage0 as mockPage0, activitiesPage1 as mockPage1 } from '../../../mock/Activities';
import { token } from '../../../mock/Token';
import { WorkerConfig } from '../../../mock/WorkerConfig';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');

import Configuration from '../../../../lib/util/Configuration';
import ActivitiesEntity from '../../../../lib/data/ActivitiesEntity';
import Request from '../../../../lib/util/Request';
import Worker from '../../../../lib/Worker';
import Routes from '../../../../lib/util/Routes';

describe('Activities', () => {
    const worker = new Worker(token, WorkerConfig);
    const config = new Configuration(token);
    const routes = new Routes('WSxxx', 'WKxxx');
    sinon.stub(worker, 'getRoutes').returns(routes);

    describe('constructor', () => {
        it('should throw an error if the worker is missing', () => {
            (() => {
                new ActivitiesEntity();
            }).should.throw(/worker is a required parameter/);
        });

        it('should use the default pageSize=1000, if none provided', () => {
            const activitiesServices = new ActivitiesEntity(worker, new Request(config));
            assert.equal(activitiesServices._pageSize, 1000);
        });

        it('should use the pageSize, if provided', () => {
            const activitiesServices = new ActivitiesEntity(worker, new Request(config), { pageSize: 50 });
            assert.equal(activitiesServices._pageSize, 50);
        });
    });

    describe('#fetchActivities', () => {
        let sandbox;
        const requestURL = 'Workspaces/WSxxx/Activities';

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should fetch all activities', () => {
            const requestParams = { PageSize: 1000 };

            sandbox.stub(Request.prototype, 'get').withArgs(requestURL, API_V1, requestParams).returns(Promise.resolve(mockList));

            const activitiesServices = new ActivitiesEntity(worker, new Request(config));
            return activitiesServices.fetchActivities().then(() => {
                expect(activitiesServices.activities.size).to.equal(mockList.contents.length);

                activitiesServices.activities.forEach(activity => {
                    if (activity.name === 'Offline') {
                        expect(activity.accountSid).to.equal(mockInstance.account_sid);
                        expect(activity.sid).to.equal(mockInstance.sid);
                        expect(activity.dateCreated).to.equalDate(new Date(mockInstance.date_created * 1000));
                        expect(activity.dateUpdated).to.equalDate(new Date(mockInstance.date_updated * 1000));
                        expect(activity.available).to.equal(mockInstance.available);
                        expect(activity.isCurrent).to.equal(false);
                        expect(activity.name).to.equal(mockInstance.friendly_name);
                    }
                });
            });
        });

        it('should paginate for the next page if needed', () => {
            const requestParamsPage0 = { PageSize: 5 };
            const requestParamsPage1 = { PageSize: 5, AfterSid: 'WAxx5' };

            const s = sandbox.stub(Request.prototype, 'get');
            s.withArgs(requestURL, API_V1, requestParamsPage0).returns(Promise.resolve(mockPage0));
            s.withArgs(requestURL, API_V1, requestParamsPage1).returns(Promise.resolve(mockPage1));

            const activitiesServices = new ActivitiesEntity(worker, new Request(config), { pageSize: 5 });

            return activitiesServices.fetchActivities().then(() => {
                expect(activitiesServices.activities.size).to.equal(mockPage0.total);

                activitiesServices.activities.forEach(activity => {
                    if (activity.name === 'Offline') {
                        expect(activity.accountSid).to.equal(mockInstance.account_sid);
                        expect(activity.sid).to.equal(mockInstance.sid);
                        expect(activity.dateCreated).to.equalDate(new Date(mockInstance.date_created * 1000));
                        expect(activity.dateUpdated).to.equalDate(new Date(mockInstance.date_updated * 1000));
                        expect(activity.available).to.equal(mockInstance.available);
                        expect(activity.isCurrent).to.equal(false);
                        expect(activity.name).to.equal(mockInstance.friendly_name);
                    }
                });
            });
        });
    });
});
