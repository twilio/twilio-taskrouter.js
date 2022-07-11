// Pre-populate with test.json if it exists.
let env = {};
try {
  env = require('../test.json');
} catch (error) {
  // Do nothing.
}

const voiceE2EKeys = [
  'supervisorNumber',
  'customerNumber',
  'flexCCNumber',
  'workerNumber'
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
  'multiTaskNumChannels'
];

requiredKeys.forEach(key => {
  if (!(key in env)) {
    throw new Error('Missing ' + key);
  }
});

voiceE2EKeys.forEach(voiceKey => {
  if (!(voiceKey in env)) {
    throw new Error('Missing Voice Integration Key: ' + voiceKey);
  }
});

module.exports = env;
