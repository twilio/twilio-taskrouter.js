// Pre-populate with test.json if it exists.
let env = {};
try {
  env = require('../test.json');
} catch (error) {
  // Do nothing.
}

const singleTaskingKeys = [
  'nonMultiTaskWorkspaceSid',
  'nonMultiTaskWorkflowSid',
  'nonMultiTaskAliceSid',
  'nonMultiTaskBobSid',
  'nonMultiTaskConnectActivitySid',
  'nonMultiTaskUpdateActivitySid',
  'nonMultiTaskNumActivities'
];

const voiceE2EKeys = [
  'supervisorNumber',
  'customerNumber',
  'flexCCNumber',
  'workerNumber',
  'region'
];

// Ensure required variables are present
const requiredKeys = [
  'accountSid',
  'authToken',
  'signingKeySid',
  'signingKeySecret',
  'hasSingleTasking',
  'multiTaskWorkspaceSid',
  'multiTaskWorkflowSid',
  'multiTaskQueueSid',
  'multiTaskAliceSid',
  'multiTaskBobSid',
  'multiTaskConnectActivitySid',
  'multiTaskUpdateActivitySid',
  'multiTaskNumActivities',
  'multiTaskNumChannels',
  'ebServer',
  'wsServer'
];

requiredKeys.forEach(key => {
  if (!(key in env)) {
    throw new Error('Missing ' + key);
  }

  // e2e tester -- no voice
  if (key === 'hasSingleTasking') {
    if (env[key]) {
      // check for single tasking
      singleTaskingKeys.forEach(singleTaskingKey => {
        if (!(singleTaskingKey in env)) {
          throw new Error('Missing Single Tasking Key: ' + singleTaskingKey);
        }
      });
    } else {
      // check for voice
      voiceE2EKeys.forEach(voiceKey => {
        if (!(voiceKey in env)) {
          throw new Error('Missing Voice Integrtion Key: ' + voiceKey);
        }
      });
    }
  }
});

if (env.hasOwnProperty('env') && env.env &&
    !env.env.includes('dev') && !env.env.includes('stage')) {
    env.env = env.env.concat('.us1');
}

module.exports = env;
