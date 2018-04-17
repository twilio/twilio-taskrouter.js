import Logger from '../../../../lib/util/Logger';
const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');

describe('Logger', () => {
  describe('constructor', () => {
    it('should throw an error if the module name is missing', () => {
      (() => {
        new Logger();
      }).should.throw(/moduleName is a required parameter/);
    });
  });

  describe('#setLevel(level)', () => {
    it('should throw an error if the logging level option is not a permitted value', () => {
      (() => {
        new Logger('logger-test', 'foo');
      }).should.throw(/level must be one of/);
    });
  });

  describe('#logLevel(msg)', () => {
    const log = new Logger('logger-test');
    const traceSpy = sinon.spy(log, 'trace');
    const infoSpy = sinon.spy(log, 'info');
    const debugSpy = sinon.spy(log, 'debug');
    const warnSpy = sinon.spy(log, 'warn');
    const errorSpy = sinon.spy(log, 'error');

    afterEach(() => {
      traceSpy.resetHistory();
      infoSpy.resetHistory();
      debugSpy.resetHistory();
      warnSpy.resetHistory();
      errorSpy.resetHistory();
    });

    describe('#trace(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        log.setLevel('trace');
        log.trace('Test trace message');

        assert.isTrue(traceSpy.calledOnce);
        assert.isTrue(traceSpy.calledWith('Test trace message'));
      });

      it('should call all log functions whose level is above trace', () => {
        log.setLevel('trace');
        log.info('Test info message');
        log.error('Test error message');
        log.trace('Test trace message');
        log.trace('Test trace message again');

        assert.isTrue(infoSpy.calledOnce);
        assert.isTrue(infoSpy.calledWith('Test info message'));

        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));

        assert.isTrue(traceSpy.calledTwice);
        assert.isTrue(traceSpy.withArgs('Test trace message').calledOnce);
        assert.isTrue(traceSpy.withArgs('Test trace message again').calledOnce);

        assert.isFalse(warnSpy.called);
        assert.isFalse(debugSpy.called);
      });

    });

    describe('#info(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        log.setLevel('info');
        log.info('Test info message');

        assert.isTrue(infoSpy.calledOnce);
        assert.isTrue(infoSpy.calledWith('Test info message'));
      });

      it('should not call log functions whose level is not permitted', () => {
        log.setLevel('info');
        log.trace('Test trace message');
        log.warn('Test warn message');
        log.warn('Test warn message again');

        assert.isTrue(traceSpy.called);
        assert.isTrue(warnSpy.calledTwice);
        assert.isTrue(warnSpy.withArgs('Test warn message').calledOnce);
        assert.isTrue(warnSpy.withArgs('Test warn message again').calledOnce);
        assert.isFalse(infoSpy.called);
        assert.isFalse(debugSpy.called);
        assert.isFalse(errorSpy.called);
      });

    });

    describe('#debug(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        log.setLevel('debug');
        log.debug('Test debug message');

        assert.isTrue(debugSpy.calledOnce);
        assert.isTrue(debugSpy.calledWith('Test debug message'));
      });

      it('should not call log functions whose level is not permitted', () => {
        log.setLevel('debug');
        log.debug('Test debug message');
        log.trace('Test trace message');
        log.error('Test error message');

        assert.isTrue(debugSpy.calledOnce);
        assert.isTrue(debugSpy.calledWith('Test debug message'));
        assert.isTrue(traceSpy.calledOnce);
        assert.isTrue(traceSpy.calledWith('Test trace message'));
        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));

        assert.isFalse(infoSpy.called);
        assert.isFalse(warnSpy.called);
      });

    });

    describe('#warn(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        log.setLevel('warn');
        log.warn('Test warn message');

        assert.isTrue(warnSpy.calledOnce);
        assert.isTrue(warnSpy.calledWith('Test warn message'));
      });

      it('should not call log functions whose level is not permitted', () => {
        log.setLevel('warn');
        log.warn('Test warn message');
        log.info('Test info message');
        log.info('Test info message again');
        log.error('Test error message');

        assert.isTrue(warnSpy.calledOnce);
        assert.isTrue(warnSpy.calledWith('Test warn message'));
        assert.isTrue(infoSpy.calledTwice);
        assert.isTrue(infoSpy.withArgs('Test info message').calledOnce);
        assert.isTrue(infoSpy.withArgs('Test info message again').calledOnce);
        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));

        assert.isFalse(traceSpy.called);
        assert.isFalse(debugSpy.called);
      });

    });

    describe('#error(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        log.setLevel('error');
        log.error('Test error message');

        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));
      });

      it('should be able to call all log functions whose level is below error', () => {
        log.setLevel('error');
        log.trace('Test trace message');
        log.info('Test info message');
        log.debug('Test debug message');
        log.warn('Test warn message');
        log.error('Test error message');
        log.info('Test info message again');

        assert.isTrue(traceSpy.calledOnce);
        assert.isTrue(traceSpy.calledWith('Test trace message'));
        assert.isTrue(infoSpy.calledTwice);
        assert.isTrue(infoSpy.withArgs('Test info message').calledOnce);
        assert.isTrue(infoSpy.withArgs('Test info message again').calledOnce);
        assert.isTrue(debugSpy.calledOnce);
        assert.isTrue(debugSpy.calledWith('Test debug message'));
        assert.isTrue(warnSpy.calledOnce);
        assert.isTrue(warnSpy.calledWith('Test warn message'));
        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));
      });
    });
  });
});
