const RetryUtil = require('../../../../lib/util/Retry').default;
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

describe('RetryUtil', () => {
    const baseBackoffTime = 800;
    const maxBackoffTime = 3000;
    let retryUtil;
    let sandbox;

    beforeEach(() => {
        retryUtil = new RetryUtil(baseBackoffTime, maxBackoffTime);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('generateBackoffInterval', () => {
        it('should throw an error if interval is not a positive finite number', () => {
            const error = 'Interval count should be a positive finite number';
            expect(() => retryUtil.generateBackoffInterval(-1)).to.throw(error);
            expect(() => retryUtil.generateBackoffInterval(0)).to.throw(error);
            expect(() => retryUtil.generateBackoffInterval(Infinity)).to.throw(error);
            expect(() => retryUtil.generateBackoffInterval(NaN)).to.throw(error);
            expect(() => retryUtil.generateBackoffInterval('foo')).to.throw(error);
            expect(() => retryUtil.generateBackoffInterval(null)).to.throw(error);
        });

        it('should return a delay between baseBackoffTime and maxBackoffTime with a random time upto 100ms', () => {
            expect(retryUtil.generateBackoffInterval(1)).to.be.within(baseBackoffTime, maxBackoffTime + 100);
            expect(retryUtil.generateBackoffInterval(3)).to.be.within(baseBackoffTime, maxBackoffTime + 100);
            expect(retryUtil.generateBackoffInterval(5)).to.be.within(baseBackoffTime, maxBackoffTime + 100);
        });

        it('should return an incremental delay upto maxBackoffTime for increasing interval counts with a random time upto 100ms', () => {
            expect(retryUtil.generateBackoffInterval(1)).to.be.within(800, 900);
            expect(retryUtil.generateBackoffInterval(2)).to.be.within(1200, 1300);
            expect(retryUtil.generateBackoffInterval(3)).to.be.within(2800, 2900);
            expect(retryUtil.generateBackoffInterval(4)).to.be.within(3000, 3100);
            expect(retryUtil.generateBackoffInterval(5)).to.be.within(3000, 3100);
        });

    });

    describe('whenReady', () => {
        it('should call the callback function after the backoff interval', async() => {
            const intervalCount = 2;
            const expectedDelay = 1500;
            sinon.stub(retryUtil, 'generateBackoffInterval').returns(expectedDelay);
            const spy = sinon.spy(global, 'setTimeout');
            const callback = sinon.spy();
            await retryUtil.whenReady(intervalCount).then(callback);
            expect(spy.calledWith(sinon.match.any, expectedDelay)).to.be.true;
            expect(callback.called).to.be.true;
            expect(callback.calledAfter(spy)).to.be.true;
        });

        it('Callback resolves with incremental backoff interval', async() => {
            let backOffTimeResolution;

            backOffTimeResolution = await retryUtil.whenReady(1);
            expect(backOffTimeResolution).to.be.within(800, 900);

            backOffTimeResolution = await retryUtil.whenReady(2);
            expect(backOffTimeResolution).to.be.within(1200, 1300);

            backOffTimeResolution = await retryUtil.whenReady(3);
            expect(backOffTimeResolution).to.be.within(2800, 2900);

            backOffTimeResolution = await retryUtil.whenReady(4);
            expect(backOffTimeResolution).to.be.within(3000, 3100);
        }).timeout(10000);
    });
});
