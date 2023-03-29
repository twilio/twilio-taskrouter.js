const RetryUtil = require('../../../../lib/util/Retry').default;
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

describe('RetryUtil', () => {
    const baseBackoffTime = 800;
    const maxBackoffTime = 3000;
    let retryUtil;
    let sandbox;
    let warnSpy;

    beforeEach(() => {
        retryUtil = new RetryUtil(baseBackoffTime, maxBackoffTime);
        warnSpy = sinon.stub(retryUtil._log, 'warn');
        warnSpy.returns('test');
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        warnSpy.reset();
        sandbox.restore();
    });

    describe('generateBackoffInterval', () => {
        // eslint-disable-next-line no-undefined
        [null, '2', undefined, true, false, -1, 0, Infinity, {}, [], NaN].forEach(item => {
            it(`should reset the retryCount and log a warning when ${item} is passed as retryCount`, () => {
                const msg = 'Interval count should be a positive finite number. Resetting retryCount to 1, Current value:' + item;
                retryUtil.generateBackoffInterval(item);
                expect(warnSpy.calledOnce).to.have.true;
                expect(warnSpy.calledWith(msg)).to.be.true;
            });
        });

        // eslint-disable-next-line no-undefined
        ['2', undefined, -2, -1, Infinity, []].forEach(item => {
            it(`should reset the retryCount and log a warning when ${item}+1 is passed as retryCount`, () => {
                const msg = 'Interval count should be a positive finite number. Resetting retryCount to 1, Current value:' + (item + 1);
                retryUtil.generateBackoffInterval(item + 1);
                expect(warnSpy.calledOnce).to.have.true;
                expect(warnSpy.calledWith(msg)).to.be.true;
            });
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
