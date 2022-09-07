import mocha from 'mocha';

mocha.reporters.Base.symbols.ok = '[PASS]';
mocha.reporters.Base.symbols.err = '[FAIL]';
