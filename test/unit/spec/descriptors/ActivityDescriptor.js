import { assert } from 'chai';
import { describe, it } from 'mocha';
import ActivityDescriptor from '../../../../lib/descriptors/ActivityDescriptor';
import { offlineActivityInstance as instance } from '../../../mock/Activities';

describe('ActivityDescriptor', () => {
    describe('constructor', () => {
        it('should throw an error if descriptor is not of type Object', () => {
            ['abc', 123, null].forEach(v => {
                (() => new ActivityDescriptor(v)).should.throw(/<Descriptor>descriptor is required./);
            });
        });

        it('should throw an error if the descriptor does not contain all properties of an Activity', () => {
            (() => {
                new ActivityDescriptor({ 'account_sid': 'WAxxx' });
            }).should.throw(/<Descriptor>descriptor does not contain all properties of an Activity./);
        });

        it('should set properties using data from the descriptor', () => {
            const offlineDescriptor = new ActivityDescriptor(instance);
            assert.equal(offlineDescriptor.accountSid, instance.account_sid);
            assert.equal(offlineDescriptor.workspaceSid, instance.workspace_sid);
            assert.equal(offlineDescriptor.sid, instance.sid);
            assert.equal(offlineDescriptor.available, instance.available);
            assert.equal(offlineDescriptor.name, instance.friendly_name);
            assert.deepEqual(offlineDescriptor.dateCreated, new Date(instance.date_created * 1000));
            assert.deepEqual(offlineDescriptor.dateUpdated, new Date(instance.date_updated * 1000));
        });
    });
});
