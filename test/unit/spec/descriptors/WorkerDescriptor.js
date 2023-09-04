import { assert } from 'chai';

import WorkerDescriptor from '../../../../lib/descriptors/WorkerDescriptor';
import { updateWorkerActivityToIdle as instance } from '../../../mock/Responses';

describe('WorkerDescriptor', () => {

    describe('constructor', () => {
        it('should throw an error if descriptor is not of type Object', () => {
            ['abc', 123, null].forEach(v => {
                (() => new WorkerDescriptor(v)).should.throw(/<Descriptor>descriptor is a required parameter./);
            });
        });

        it('should throw an error if the descriptor does not contain all properties of a Worker', () => {
            (() => {
                new WorkerDescriptor({ 'account_sid': 'WAxxx' });
            }).should.throw(/The provided <Descriptor>descriptor does not contain all properties of a Worker./);
        });

        it('should set properties using data from the descriptor', () => {
            const workerDescriptor = new WorkerDescriptor(instance);
            assert.equal(workerDescriptor.accountSid, instance.account_sid);
            assert.equal(workerDescriptor.workspaceSid, instance.workspace_sid);
            assert.equal(workerDescriptor.sid, instance.sid);
            assert.equal(workerDescriptor.activityName, instance.activity_name);
            assert.equal(workerDescriptor.activitySid, instance.activity_sid);
            assert.deepEqual(workerDescriptor.attributes, JSON.parse(instance.attributes));
            assert.equal(workerDescriptor.available, instance.available);
            assert.deepEqual(workerDescriptor.dateCreated, new Date(instance.date_created * 1000));
            assert.deepEqual(workerDescriptor.dateUpdated, new Date(instance.date_updated * 1000));
            assert.deepEqual(workerDescriptor.dateStatusChanged, new Date(instance.date_status_changed * 1000));
            assert.equal(workerDescriptor.name, instance.friendly_name);
            assert.equal(workerDescriptor.version, instance.version);
            assert.equal(typeof workerDescriptor.version, 'string');
            // duplicated fields for sync compatibility
            assert.equal(workerDescriptor.friendlyName, instance.friendly_name);
            assert.equal(workerDescriptor.workerActivitySid, instance.activity_sid);
            assert.deepEqual(workerDescriptor.dateActivityChanged, new Date(instance.date_status_changed * 1000));
            assert.equal(workerDescriptor.workerSid, instance.sid);
        });

        it('should throw an error if unable to parse attributes JSON', () => {
            const workerInstanceData = instance;
            workerInstanceData.attributes = '{ bad }';

            (() => {
                new WorkerDescriptor(workerInstanceData);
            }).should.throw();
        });
    });
});
