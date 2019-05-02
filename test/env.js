// Pre-populate with test.json if it exists.
let env = {};
try {
  env = require('../test.json');
} catch (error) {
  // Do nothing.
}

// Ensure required variables are present
[
  'accountSid',
  'authToken',
  'signingKeySid',
  'signingKeySecret',
  'nonMultiTaskWorkspaceSid',
  'nonMultiTaskWorkflowSid',
  'nonMultiTaskAliceSid',
  'nonMultiTaskBobSid',
  'nonMultiTaskConnectActivitySid',
  'nonMultiTaskUpdateActivitySid',
  'multiTaskWorkspaceSid',
  'multiTaskWorkflowSid',
  'multiTaskAliceSid',
  'multiTaskBobSid',
  'multiTaskConnectActivitySid',
  'multiTaskQueueSid',
  'multiTaskUpdateActivitySid',
  'multiTaskNumActivities',
  'multiTaskNumChannels',
  'ebServer',
  'wsServer'
].forEach(key => {
  if (!(key in env)) {
    throw new Error('Missing ' + key);
  }
});

if (env.hasOwnProperty('env') && env.env &&
    !env.env.includes('dev') && !env.env.includes('stage')) {
    env.env = env.env.concat('.us1');
}

module.exports = env;
