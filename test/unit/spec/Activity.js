/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');
import { afterEach, beforeEach, describe, it } from 'mocha';
import Activity from '../../../lib/Activity';
import ActivityDescriptor from '../../../lib/descriptors/ActivityDescriptor';
import { API_V1 } from '../../../lib/util/Constants';
import { updateWorkerActivityToIdle } from '../../mock/Responses';
import { offlineActivityInstance as mockInstance, list as mockList } from '../../mock/Activities';
import { token } from '../../mock/Token';
const Errors = require('../../../lib/util/Constants').twilioErrors;
import Request from '../../../lib/util/Request';
import Worker from '../../../lib/Worker';
import { WorkerConfig } from '../../mock/WorkerConfig';

describe('Activity', () => {

    const worker = new Worker(token, WorkerConfig);
    const offlineActivityDescriptor = new ActivityDescriptor(mockInstance);

    describe('constructor', () => {
        it('should throw an error if worker is missing', () => {
            (() => {
                new Activity(null);
            }).should.throw(/worker is a required parameter/);
        });

        it('should throw an error if activity descriptor data is missing', () => {
            (() => {
                new Activity(worker, null);
            }).should.throw(/descriptor is a required parameter/);
        });

        it('should set properties using the activity descriptor', () => {
            const offlineActivity = new Activity(worker, offlineActivityDescriptor);

            assert.equal(offlineActivity.accountSid, mockInstance.account_sid);
            assert.equal(offlineActivity.available, mockInstance.available);
            assert.equalDate(offlineActivity.dateCreated, new Date(mockInstance.date_created * 1000));
            assert.equalDate(offlineActivity.dateUpdated, new Date(mockInstance.date_updated * 1000));
            assert.equal(offlineActivity.isCurrent, false);
            assert.equal(offlineActivity.name, mockInstance.friendly_name);
            assert.equal(offlineActivity.sid, mockInstance.sid);
            assert.equal(offlineActivity.workspaceSid, mockInstance.workspace_sid);

            assert.instanceOf(offlineActivity._worker, Worker);
        });
    });

    describe('#setAsCurrent', () => {
        const requestURL = 'Workspaces/WSxxx/Workers/WKxxx';
        const requestParams = { ActivitySid: 'WAxx2' };

        let sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => sandbox.restore());
        it('should set this Activity to be the current activity of the Worker', () => {
            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.resolve(updateWorkerActivityToIdle));

            const activities = new Map();
            mockList.contents.forEach(activityPayload => {
                const activityDescriptor = new ActivityDescriptor(activityPayload);
                activities.set(activityPayload.sid, new Activity(worker, activityDescriptor));
            });

            worker.activities = activities;
            let idleActivity;

            worker.activities.forEach(activity => {
                if (activity.name === 'Offline') {
                    activity._isCurrent = true;
                    worker.activity = activity;

                    assert.equal(worker.activity, activity);
                    assert.isTrue(worker.activity.isCurrent);
                } else {
                    if (activity.name === 'Idle') {
                        idleActivity = activity;
                    }
                    assert.notEqual(worker.activity, activity);
                    assert.isFalse(activity.isCurrent);
                }
            });

            // expect to update the activity from Offline -> Idle
            return idleActivity.setAsCurrent().then(() => {
                expect(idleActivity.isCurrent).to.be.true;
                expect(idleActivity).to.equal(worker.activity);

                worker.activities.forEach(activity => {
                    if (activity.name !== 'Idle') {
                        expect(activity.isCurrent).to.be.false;
                        expect(worker.activity).to.not.equal(activity);
                    }
                });
            });
        });

        it('should return an error if unable to set the activity', () => {
            const requestURL = 'Workspaces/WSxxx/Workers/WKxxx';
            const requestParams = { ActivitySid: 'WAxx2' };


            sandbox.stub(Request.prototype, 'post').withArgs(requestURL, requestParams, API_V1).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

            const activities = new Map();
            mockList.contents.forEach(activityPayload => {
                const activityDescriptor = new ActivityDescriptor(activityPayload);
                activities.set(activityPayload.sid, new Activity(worker, activityDescriptor));
            });

            worker.activities = activities;

            let idleActivity;
            let offlineActivity;

            worker.activities.forEach(activity => {
                if (activity.name === 'Offline') {
                    activity._isCurrent = true;
                    worker.activity = activity;
                    offlineActivity = activity;
                }
                if (activity.name === 'Idle') {
                    idleActivity = activity;
                }
            });

            return idleActivity.setAsCurrent().catch(err => {
                expect(err.name).to.equal('TASKROUTER_ERROR');
                expect(err.message).to.equal('Failed to parse JSON.');

                expect(worker.activity).to.equal(offlineActivity);
                expect(offlineActivity.isCurrent).to.be.true;
            });
        });
    });
});
